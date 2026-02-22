"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

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
    buyParcel: (x: number, y: number) => void;
    buyRandomParcels: (count: number) => void;
    isParcelOwned: (x: number, y: number) => boolean;
}

const GameContext = createContext<GameContextType | null>(null);

const COLORS = [
    '#00f3ff', '#ff00ff', '#9d00ff', '#ffcc00', '#00ff88',
    '#ff4466', '#44bbff', '#ff8800', '#88ff00', '#ff0088',
    '#00ffcc', '#8844ff', '#ff4400', '#0088ff', '#ffff00',
];

function generateInitialParcels(count: number): Map<string, ParcelData> {
    const map = new Map<string, ParcelData>();
    const gridSize = 500;
    const centerX = gridSize / 2;
    const centerY = gridSize / 2;
    const radius = gridSize * 0.4;

    const wallets = [
        '0xF3a1...A21', '0x82eE...EE4', '0x11Ab...ABC',
        '0xBBc9...990', '0x00a1...111', '0xD4f2...F82',
    ];

    for (let i = 0; i < count; i++) {
        const angle = i * 137.508;
        const r = Math.sqrt(i) * (radius / Math.sqrt(count));
        const x = Math.floor(centerX + r * Math.cos((angle * Math.PI) / 180));
        const y = Math.floor(centerY + r * Math.sin((angle * Math.PI) / 180));

        if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
            const key = `${x},${y}`;
            if (!map.has(key)) {
                map.set(key, {
                    x, y,
                    owner: wallets[i % wallets.length],
                    color: COLORS[Math.floor(i / 200) % COLORS.length],
                });
            }
        }
    }
    return map;
}

const INITIAL_SOLD = 158420;

export function GameProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<GameState>(() => ({
        season: 1,
        totalPixels: 250000,
        pixelsSold: INITIAL_SOLD,
        prizePool: INITIAL_SOLD * 5,
        parcels: generateInitialParcels(INITIAL_SOLD),
        hotZone: { x: 220, y: 180, size: 20 },
        earthquakeProgress: 70,
        userParcels: 12,
        userReferrals: 4,
        activityLog: [
            { text: 'Conquistó x25 parcelas', time: 'hace 2s', user: '0xA1...B2', type: 'buy' },
            { text: 'Conquistó x1 parcela', time: 'hace 8s', user: '0xF9...33', type: 'buy' },
            { text: 'Nuevo referido nivel 🥈', time: 'hace 15s', user: '0x88...C1', type: 'referral' },
            { text: '🌋 Terremoto! 5 parcelas gratis', time: 'hace 1m', user: 'SISTEMA', type: 'earthquake' },
            { text: '🔥 Hot Zone activada [220,180]', time: 'hace 3m', user: 'SISTEMA', type: 'hotzone' },
        ],
        leaderboard: [
            { name: '0xF3...A21', parcels: 1540, invested: '$7.7k' },
            { name: '0x82...EE4', parcels: 942, invested: '$4.7k' },
            { name: '0x11...ABC', parcels: 812, invested: '$4.0k' },
            { name: '0xBB...990', parcels: 420, invested: '$2.1k' },
            { name: '0x00...111', parcels: 150, invested: '$0.7k' },
            { name: '0xD4...F82', parcels: 88, invested: '$0.4k' },
            { name: '0x7A...012', parcels: 50, invested: '$0.2k' },
        ],
    }));

    const isParcelOwned = useCallback((x: number, y: number) => {
        return state.parcels.has(`${x},${y}`);
    }, [state.parcels]);

    const buyParcel = useCallback((x: number, y: number) => {
        setState(prev => {
            const key = `${x},${y}`;
            if (prev.parcels.has(key)) return prev;

            const newParcels = new Map(prev.parcels);
            newParcels.set(key, {
                x, y,
                owner: '0xTU...WAL',
                color: '#00f3ff',
            });

            const newLog: ActivityLog = {
                text: `Conquistó parcela [${x},${y}]`,
                time: 'ahora',
                user: '0xTU...WAL',
                type: 'buy',
            };

            return {
                ...prev,
                pixelsSold: prev.pixelsSold + 1,
                prizePool: prev.prizePool + 5,
                parcels: newParcels,
                userParcels: prev.userParcels + 1,
                activityLog: [newLog, ...prev.activityLog.slice(0, 19)],
            };
        });
    }, []);

    const buyRandomParcels = useCallback((count: number) => {
        setState(prev => {
            const newParcels = new Map(prev.parcels);
            const newLogs: ActivityLog[] = [];
            let bought = 0;
            let attempts = 0;

            while (bought < count && attempts < count * 10) {
                const x = Math.floor(Math.random() * 500);
                const y = Math.floor(Math.random() * 500);
                const key = `${x},${y}`;
                attempts++;

                if (!newParcels.has(key)) {
                    newParcels.set(key, { x, y, owner: '0xTU...WAL', color: '#00f3ff' });
                    bought++;
                }
            }

            if (bought > 0) {
                newLogs.push({
                    text: `Conquistó x${bought} parcelas`,
                    time: 'ahora',
                    user: '0xTU...WAL',
                    type: 'buy',
                });
            }

            return {
                ...prev,
                pixelsSold: prev.pixelsSold + bought,
                prizePool: prev.prizePool + bought * 5,
                parcels: newParcels,
                userParcels: prev.userParcels + bought,
                activityLog: [...newLogs, ...prev.activityLog.slice(0, 19)],
            };
        });
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
