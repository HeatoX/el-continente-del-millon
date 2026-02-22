"use client";

import { useGame } from '@/context/GameContext';

export default function ActivityFeed() {
    const { state } = useGame();

    const typeConfig: Record<string, { dot: string; textColor: string }> = {
        buy: { dot: 'bg-cyan-400', textColor: 'text-cyan-400/70' },
        referral: { dot: 'bg-purple-400', textColor: 'text-purple-400/70' },
        earthquake: { dot: 'bg-orange-500', textColor: 'text-orange-400/70' },
        hotzone: { dot: 'bg-red-500', textColor: 'text-red-400/70' },
    };

    return (
        <div className="glass-panel p-5 flex-1">
            <h4 className="text-[9px] uppercase font-black tracking-[0.2em] text-white/30 mb-4 flex items-center justify-between">
                <span>Actividad en Vivo</span>
                <span className="flex items-center gap-1 text-green-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    LIVE
                </span>
            </h4>

            <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                {state.activityLog.map((log, i) => {
                    const config = typeConfig[log.type] || typeConfig.buy;
                    return (
                        <div key={i} className="flex flex-col border-l-2 border-white/5 pl-3 relative">
                            <div className={`absolute left-[-5px] top-1.5 w-2 h-2 rounded-full ${config.dot} border-2 border-[#0a0a0a]`} />
                            <div className={`text-[10px] font-mono ${config.textColor}`}>{log.user}</div>
                            <div className="text-[11px] font-medium text-white/60">{log.text}</div>
                            <div className="text-[8px] text-white/15 mt-0.5 uppercase font-black tracking-wider">{log.time}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
