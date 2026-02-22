"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

interface WalletContextType {
    address: string | null;
    chainId: number | null;
    isConnected: boolean;
    isConnecting: boolean;
    connect: () => Promise<void>;
    disconnect: () => void;
    error: string | null;
}

const WalletContext = createContext<WalletContextType>({
    address: null,
    chainId: null,
    isConnected: false,
    isConnecting: false,
    connect: async () => { },
    disconnect: () => { },
    error: null,
});

export const useWallet = () => useContext(WalletContext);

// BSC Mainnet config
const BSC_CHAIN_ID = 56;
const BSC_CONFIG = {
    chainId: '0x38',
    chainName: 'BNB Smart Chain',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    rpcUrls: ['https://bsc-dataseed1.binance.org/'],
    blockExplorerUrls: ['https://bscscan.com/'],
};

export function WalletProvider({ children }: { children: ReactNode }) {
    const [address, setAddress] = useState<string | null>(null);
    const [chainId, setChainId] = useState<number | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isConnected = !!address;

    const connect = useCallback(async () => {
        setError(null);
        setIsConnecting(true);
        try {
            if (typeof window === 'undefined' || !(window as any).ethereum) {
                throw new Error('Instala MetaMask o Trust Wallet para continuar');
            }

            const ethereum = (window as any).ethereum;

            // Request accounts
            const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
            if (!accounts || accounts.length === 0) throw new Error('No accounts found');

            // Switch to BSC
            try {
                await ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: BSC_CONFIG.chainId }],
                });
            } catch (switchError: any) {
                // Chain not added yet — add it
                if (switchError.code === 4902) {
                    await ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [BSC_CONFIG],
                    });
                } else {
                    throw switchError;
                }
            }

            setAddress(accounts[0]);
            setChainId(BSC_CHAIN_ID);
        } catch (err: any) {
            setError(err.message || 'Error al conectar');
        } finally {
            setIsConnecting(false);
        }
    }, []);

    const disconnect = useCallback(() => {
        setAddress(null);
        setChainId(null);
        setError(null);
    }, []);

    // Listen for account/chain changes
    useEffect(() => {
        if (typeof window === 'undefined' || !(window as any).ethereum) return;
        const ethereum = (window as any).ethereum;

        const handleAccounts = (accounts: string[]) => {
            if (accounts.length === 0) {
                setAddress(null);
            } else {
                setAddress(accounts[0]);
            }
        };

        const handleChain = (chainIdHex: string) => {
            setChainId(parseInt(chainIdHex, 16));
        };

        ethereum.on('accountsChanged', handleAccounts);
        ethereum.on('chainChanged', handleChain);

        return () => {
            ethereum.removeListener('accountsChanged', handleAccounts);
            ethereum.removeListener('chainChanged', handleChain);
        };
    }, []);

    return (
        <WalletContext.Provider value={{ address, chainId, isConnected, isConnecting, connect, disconnect, error }}>
            {children}
        </WalletContext.Provider>
    );
}
