"use client";

import { useGame } from '@/context/GameContext';

function fmt(n: number): string {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export default function Leaderboard() {
    const { state } = useGame();

    const getBadge = (parcels: number) => {
        if (parcels >= 100) return '💎';
        if (parcels >= 50) return '🥇';
        if (parcels >= 10) return '🥈';
        return '🥉';
    };

    return (
        <div className="glass-panel p-5">
            <h4 className="text-[9px] uppercase font-black tracking-[0.2em] text-white/30 mb-4 flex items-center justify-between">
                <span>Top Conquistadores</span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            </h4>

            <div className="space-y-3">
                {state.leaderboard.map((item, i) => (
                    <div key={i} className="flex items-center justify-between group cursor-default hover:bg-white/[0.02] -mx-2 px-2 py-1 rounded-md transition-colors">
                        <div className="flex items-center gap-2">
                            <span className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-black ${i === 0 ? 'bg-yellow-500/20 text-yellow-400'
                                : i === 1 ? 'bg-slate-300/10 text-slate-300'
                                    : i === 2 ? 'bg-amber-700/15 text-amber-600'
                                        : 'bg-white/5 text-white/20'
                                }`}>{i + 1}</span>
                            <span className="text-xs font-mono text-white/50 group-hover:text-white/80 transition-colors">{item.name}</span>
                            <span className="text-[10px]">{getBadge(item.parcels)}</span>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-black text-white/80">{fmt(item.parcels)} <span className="text-white/20">px</span></div>
                            <div className="text-[8px] text-white/15 uppercase font-bold tracking-tight">{item.invested}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
