"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ABI, CONTRACT_ADDRESS, ACTIVE_CHAIN } from '@/lib/contract';

export interface ParcelData {
    x: number;
    y: number;
    owner: string;
    color: string;
}

export interface ActivityLog {
    text: string;
    time: string;
    user: string;
    type: 'buy' | 'referral' | 'earthquake' | 'hotzone';
}

export interface GameState {
    season: number;
    totalPixels: number;
    pixelsSold: number;
    prizePool: number;
    parcels: Map<string, ParcelData>;
    hotZone: { x: number; y: number; size: number } | null;
    activityLog: ActivityLog[];
    userParcels: number;
    userReferrals: number;
    earthquakeProgress: number;
    leaderboard: { name: string; parcels: number; invested: string }[];
}

interface GameContextType {
    state: GameState;
    buyParcel: (x: number, y: number, color?: string, identifier?: string) => void;
    buyRandomParcels: (count: number, color?: string, identifier?: string) => void;
    isParcelOwned: (x: number, y: number) => boolean;
}

const GameContext = createContext<GameContextType | null>(null);

const GRID_SIZE = 500;
const TOTAL_PARCELS = GRID_SIZE * GRID_SIZE;

export function GameProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<GameState>({
        season: 1,
        totalPixels: TOTAL_PARCELS,
        pixelsSold: 0,
        prizePool: 0,
        parcels: new Map<string, ParcelData>(), // Starts 100% empty (Real data)
        hotZone: null,
        earthquakeProgress: 0,
        userParcels: 0,
        userReferrals: 0,
        activityLog: [],
        leaderboard: [],
    });

    const isSyncing = useRef(false);

    // Sync data from blockchain
    const syncMapData = useCallback(async () => {
        if (!CONTRACT_ADDRESS || isSyncing.current) return;

        try {
            isSyncing.current = true;
            let provider;
            if (typeof window !== 'undefined' && (window as any).ethereum) {
                provider = new ethers.BrowserProvider((window as any).ethereum);
            } else {
                provider = new ethers.JsonRpcProvider(ACTIVE_CHAIN.rpc);
            }

            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

            // Limit the amount of async calls we make at once to not anger public RPC limiters
            const soldCountRaw = await contract.getSoldCount();
            const soldCount = Number(soldCountRaw);

            setState(prev => {
                if (prev.pixelsSold >= soldCount) return prev; // Up to date

                // We need to fetch the new ones. Since async state updates can be tricky,
                // we fire off an async IIFE to fetch the missing ones.
                (async () => {
                    const newParcels = new Map(prev.parcels);
                    const newLogs = [...prev.activityLog];

                    // Fetch in chunks to avoid rate limits
                    const start = prev.pixelsSold;
                    const end = soldCount;

                    for (let i = start; i < end; i++) {
                        try {
                            const gridIndex = await contract.soldIndices(i);
                            const parcelData = await contract.grid(gridIndex);

                            const owner = parcelData[0];
                            const colorUint = Number(parcelData[2]);
                            const identifierHex = parcelData[3];

                            // Decode color
                            const colorHex = '#' + colorUint.toString(16).padStart(6, '0');

                            // Decode bytes4 identifier back to string
                            let identifierStr = '';
                            if (identifierHex !== '0x00000000') {
                                identifierStr = ethers.decodeBytes32String(identifierHex.padEnd(66, '0')).replace(/\0/g, '').trim();
                                if (!identifierStr) {
                                    // Fallback manual bytes4 decode if decodeBytes32String fails on pure bytes4
                                    identifierStr = Buffer.from(identifierHex.slice(2), 'hex').toString('utf8').replace(/\0/g, '').trim();
                                }
                            }

                            const x = Number(gridIndex) % GRID_SIZE;
                            const y = Math.floor(Number(gridIndex) / GRID_SIZE);
                            const key = `${x},${y}`;

                            newParcels.set(key, {
                                x, y,
                                owner: identifierStr || owner,
                                color: colorHex
                            });

                            if (i >= end - 5) {
                                // Add only the latest logs
                                newLogs.unshift({
                                    text: `Conquistó parcela [${x},${y}]`,
                                    time: 'En vivo',
                                    user: identifierStr || `${owner.slice(0, 6)}...`,
                                    type: 'buy'
                                });
                            }
                        } catch (e) {
                            console.error(`Error fetching parcel index ${i}`, e);
                        }
                    }

                    // Generate Leaderboard on the fly
                    const territories = new Map<string, number>();
                    newParcels.forEach((p) => {
                        territories.set(p.owner, (territories.get(p.owner) || 0) + 1);
                    });

                    const newLeaderboard = Array.from(territories.entries())
                        .map(([name, parcels]) => ({
                            name,
                            parcels,
                            invested: `$${parcels * 5}` // Since 1 parcel = 5 USDT
                        }))
                        .sort((a, b) => b.parcels - a.parcels)
                        .slice(0, 10);

                    setState(curr => ({
                        ...curr,
                        pixelsSold: soldCount,
                        prizePool: soldCount * 5,
                        parcels: newParcels,
                        activityLog: newLogs.slice(0, 20),
                        leaderboard: newLeaderboard
                    }));
                })();

                return prev;
            });

        } catch (e) {
            console.error("Error syncing map state", e);
        } finally {
            isSyncing.current = false;
        }
    }, [state.pixelsSold]);

    // Polling map data every 10 seconds
    useEffect(() => {
        syncMapData();
        const interval = setInterval(syncMapData, 10000);
        return () => clearInterval(interval);
    }, [syncMapData]);

    const isParcelOwned = useCallback((x: number, y: number) => {
        return state.parcels.has(`${x},${y}`);
    }, [state.parcels]);

    // These local buy functions are empty stubs because ContractContext Handles Reals Txns now
    // But we keep them so the UI component structure doesn't break
    const buyParcel = useCallback((x: number, y: number, color?: string, identifier?: string) => {
        // Handled via ContractContext.buyParcels() in BuyPanel
    }, []);

    const buyRandomParcels = useCallback((count: number, color?: string, identifier?: string) => {
        // Handled via ContractContext.buyParcels() in BuyPanel
    }, []);

    return (
        <GameContext.Provider value={{ state, buyParcel, buyRandomParcels, isParcelOwned }}>
            {children}
        </GameContext.Provider>
    );
}

export function useGame() {
    const ctx = useContext(GameContext);
    if (!ctx) throw new Error('useGame must be inside GameProvider');
    return ctx;
}
