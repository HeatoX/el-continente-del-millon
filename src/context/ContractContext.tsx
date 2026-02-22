"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ABI, CONTRACT_ADDRESS, ACTIVE_CHAIN } from '@/lib/contract';
import { useWallet } from './WalletContext';

interface ContractState {
    seasonId: number;
    totalParcels: number;
    soldCount: number;
    prizePool: string; // in BNB
    carryOver: string;
    parcelPrice: string;
    drawPhase: number; // 0=BUYING, 1=COMMITTED, etc.
    userParcels: number;
    userReferrals: number;
    pendingPrize: string;
    loading: boolean;
}

interface ContractContextType {
    state: ContractState;
    buyParcels: (xs: number[], ys: number[], referrer?: string) => Promise<string | null>;
    claimPrize: () => Promise<string | null>;
    getParcelOwner: (x: number, y: number) => Promise<string>;
    refreshState: () => Promise<void>;
    isContractReady: boolean;
    error: string | null;
}

const ContractContext = createContext<ContractContextType | null>(null);

export function useContract() {
    const ctx = useContext(ContractContext);
    if (!ctx) throw new Error('useContract must be inside ContractProvider');
    return ctx;
}

export function ContractProvider({ children }: { children: ReactNode }) {
    const { address, isConnected } = useWallet();
    const [error, setError] = useState<string | null>(null);
    const [state, setState] = useState<ContractState>({
        seasonId: 1,
        totalParcels: 250000,
        soldCount: 0,
        prizePool: '0',
        carryOver: '0',
        parcelPrice: '0.01',
        drawPhase: 0,
        userParcels: 0,
        userReferrals: 0,
        pendingPrize: '0',
        loading: true,
    });

    const isContractReady = isConnected && !!CONTRACT_ADDRESS;

    // Get read-only provider
    const getProvider = useCallback(() => {
        if (typeof window !== 'undefined' && (window as any).ethereum) {
            return new ethers.BrowserProvider((window as any).ethereum);
        }
        return new ethers.JsonRpcProvider(ACTIVE_CHAIN.rpc);
    }, []);

    // Get read-only contract
    const getReadContract = useCallback(() => {
        if (!CONTRACT_ADDRESS) return null;
        const provider = getProvider();
        return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    }, [getProvider]);

    // Get signer contract (for writes)
    const getWriteContract = useCallback(async () => {
        if (!CONTRACT_ADDRESS || !isConnected) return null;
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();
        return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    }, [isConnected]);

    // Refresh all state from contract
    const refreshState = useCallback(async () => {
        const contract = getReadContract();
        if (!contract) {
            setState(prev => ({ ...prev, loading: false }));
            return;
        }

        try {
            const [seasonId, soldCount, totalPrize, carryOver, parcelPrice, drawPhase] = await Promise.all([
                contract.currentSeasonId(),
                contract.getSoldCount(),
                contract.getTotalPrizePool(),
                contract.carryOverPot(),
                contract.PARCEL_PRICE(),
                contract.drawPhase(),
            ]);

            let userParcels = 0;
            let userReferrals = 0;
            let pendingPrize = '0';

            if (address) {
                const [parcels, referrals, pending] = await Promise.all([
                    contract.userParcelCount(address),
                    contract.totalReferrals(address),
                    contract.getPendingPrize(address),
                ]);
                userParcels = Number(parcels);
                userReferrals = Number(referrals);
                pendingPrize = ethers.formatEther(pending);
            }

            setState({
                seasonId: Number(seasonId),
                totalParcels: 250000,
                soldCount: Number(soldCount),
                prizePool: ethers.formatEther(totalPrize),
                carryOver: ethers.formatEther(carryOver),
                parcelPrice: ethers.formatEther(parcelPrice),
                drawPhase: Number(drawPhase),
                userParcels,
                userReferrals,
                pendingPrize,
                loading: false,
            });
            setError(null);
        } catch (err: any) {
            console.error('Contract read error:', err);
            setError(err.message || 'Error reading contract');
            setState(prev => ({ ...prev, loading: false }));
        }
    }, [getReadContract, address]);

    // Auto-refresh on connection
    useEffect(() => {
        if (isContractReady) {
            refreshState();
            const interval = setInterval(refreshState, 15000); // every 15s
            return () => clearInterval(interval);
        }
    }, [isContractReady, refreshState]);

    // Buy parcels
    const buyParcels = useCallback(async (xs: number[], ys: number[], referrer?: string): Promise<string | null> => {
        try {
            setError(null);
            const contract = await getWriteContract();
            if (!contract) throw new Error('Contract not ready');

            const price = await contract.PARCEL_PRICE();
            const totalCost = price * BigInt(xs.length);

            const tx = await contract.buyParcels(xs, ys, referrer || ethers.ZeroAddress, {
                value: totalCost,
            });

            await tx.wait();
            await refreshState();
            return tx.hash;
        } catch (err: any) {
            const message = err.reason || err.message || 'Transaction failed';
            setError(message);
            console.error('Buy error:', err);
            return null;
        }
    }, [getWriteContract, refreshState]);

    // Claim prize
    const claimPrize = useCallback(async (): Promise<string | null> => {
        try {
            setError(null);
            const contract = await getWriteContract();
            if (!contract) throw new Error('Contract not ready');

            const tx = await contract.claim();
            await tx.wait();
            await refreshState();
            return tx.hash;
        } catch (err: any) {
            const message = err.reason || err.message || 'Claim failed';
            setError(message);
            return null;
        }
    }, [getWriteContract, refreshState]);

    // Get parcel owner
    const getParcelOwner = useCallback(async (x: number, y: number): Promise<string> => {
        const contract = getReadContract();
        if (!contract) return ethers.ZeroAddress;
        try {
            return await contract.getParcelOwner(x, y);
        } catch {
            return ethers.ZeroAddress;
        }
    }, [getReadContract]);

    return (
        <ContractContext.Provider value={{
            state,
            buyParcels,
            claimPrize,
            getParcelOwner,
            refreshState,
            isContractReady,
            error,
        }}>
            {children}
        </ContractContext.Provider>
    );
}
