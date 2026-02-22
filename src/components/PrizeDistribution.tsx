"use client";

export default function PrizeDistribution() {
    const prizes = [
        { pct: 40, amount: '$500,000', label: '🏆 Ganador', desc: 'La parcela elegida por Commit-Reveal', color: 'from-cyan-400 to-blue-500', textColor: 'text-cyan-400' },
        { pct: 15, amount: '$187,500', label: '🤝 El Padrino', desc: 'Quien invitó al ganador (referido)', color: 'from-purple-400 to-pink-500', textColor: 'text-purple-400' },
        { pct: 10, amount: '$125,000', label: '🏘️ Vecinos', desc: '8 parcelas adyacentes al ganador', color: 'from-green-400 to-emerald-500', textColor: 'text-green-400' },
        { pct: 5, amount: '$62,500', label: '🌧️ Lluvia', desc: '100 parcelas al azar ($625 c/u)', color: 'from-yellow-400 to-orange-500', textColor: 'text-yellow-400' },
        { pct: 10, amount: '$125,000', label: '🔄 Próxima Temporada', desc: 'Jackpot progresivo — se acumula', color: 'from-emerald-400 to-teal-500', textColor: 'text-emerald-400' },
        { pct: 20, amount: '$250,000', label: '🏦 Tesorería', desc: 'Marketing, seguridad y operaciones', color: 'from-white/40 to-white/20', textColor: 'text-white/60' },
    ];

    return (
        <div className="glass-panel p-5">
            <h4 className="text-[9px] uppercase font-black tracking-[0.2em] text-white/30 mb-4 flex items-center justify-between">
                <span>Distribución del Premio</span>
                <span className="text-cyan-400">$1,250,000</span>
            </h4>

            <div className="space-y-3">
                {prizes.map((p, i) => (
                    <div key={i} className="group cursor-default">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <span className={`text-sm font-black ${p.textColor}`}>{p.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-white/80">{p.amount}</span>
                                <span className="text-[9px] text-white/20 font-bold">{p.pct}%</span>
                            </div>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full bg-gradient-to-r ${p.color} transition-all duration-700 group-hover:brightness-125`}
                                style={{ width: `${p.pct}%` }}
                            />
                        </div>
                        <p className="text-[9px] text-white/15 mt-1">{p.desc}</p>
                    </div>
                ))}
            </div>

            {/* Visual: Neighbor Grid Demo */}
            <div className="mt-5 pt-4 border-t border-white/5">
                <div className="text-[9px] uppercase font-black tracking-[0.2em] text-white/20 mb-3">
                    Mecánica de Salpicadura (Vecinos)
                </div>
                <div className="grid grid-cols-5 gap-1 w-32 mx-auto">
                    {Array.from({ length: 25 }).map((_, i) => {
                        const isCenter = i === 12;
                        const isNeighbor = [6, 7, 8, 11, 13, 16, 17, 18].includes(i);
                        return (
                            <div
                                key={i}
                                className={`aspect-square rounded-sm border transition-all duration-300 ${isCenter
                                    ? 'bg-cyan-400 border-cyan-400 shadow-[0_0_12px_rgba(0,243,255,0.5)] animate-pulse'
                                    : isNeighbor
                                        ? 'bg-green-500/30 border-green-500/40 hover:bg-green-500/50'
                                        : 'bg-white/3 border-white/5'
                                    }`}
                            />
                        );
                    })}
                </div>
                <div className="flex items-center justify-center gap-4 mt-3 text-[9px] text-white/20">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-cyan-400" /> Ganador</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-500/40" /> $15,625 c/u</span>
                </div>
            </div>
        </div>
    );
}
