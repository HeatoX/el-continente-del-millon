"use client";

import { useGame } from '@/context/GameContext';
import { useContract } from '@/context/ContractContext';

export default function StatsPanel() {
    const { state: gameState } = useGame();
    const { state: contractState, isContractReady } = useContract();

    // Use real data when contract is ready, otherwise demo data
    const soldCount = isContractReady ? contractState.soldCount : gameState.pixelsSold;
    const totalParcels = 250000;
    const percentage = (soldCount / totalParcels) * 100;
    const seasonId = isContractReady ? contractState.seasonId : gameState.season;

    // Prize pool in USDT
    const prizePoolUSDT = isContractReady ? parseFloat(contractState.prizePool) : (gameState.pixelsSold * 5);

    const nextEarthquake = Math.ceil(soldCount / 25000) * 25000;
    const eqProgress = ((soldCount % 25000) / 25000) * 100;

    const carryOverUSDT = isContractReady ? parseFloat(contractState.carryOver) : 0;

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Prize Pool */}
            <div className="glass-panel p-5 relative overflow-hidden group hover:border-cyan-500/30 transition-all duration-300">
                <div className="absolute -top-4 -right-4 text-[60px] opacity-[0.04] group-hover:opacity-[0.08] transition-opacity select-none">💰</div>
                <div className="text-[9px] uppercase font-black tracking-[0.2em] text-white/30 mb-1">Premio Acumulado</div>
                <div className="text-2xl lg:text-3xl font-black text-cyan-400 cyan-glow">
                    ${prizePoolUSDT.toLocaleString()} <span className="text-sm text-cyan-400/50">USDT</span>
                </div>
                <div className="text-[9px] text-white/20 mt-1 font-bold">
                    {carryOverUSDT > 0 && (
                        <span className="text-green-400/60">+{carryOverUSDT.toFixed(2)} USDT carry-over</span>
                    )}
                </div>
            </div>

            {/* Progress */}
            <div className="glass-panel p-5 relative overflow-hidden group hover:border-purple-500/30 transition-all duration-300">
                <div className="text-[9px] uppercase font-black tracking-[0.2em] text-white/30 mb-1">Parcelas Vendidas</div>
                <div className="text-2xl lg:text-3xl font-black text-white">
                    {percentage.toFixed(1)}<span className="text-base text-white/40">%</span>
                </div>
                <div className="mt-3 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-purple-600 transition-all duration-1000"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                <div className="text-[9px] text-white/20 mt-1.5 font-bold">
                    {soldCount.toLocaleString()} / {totalParcels.toLocaleString()}
                </div>
            </div>

            {/* Next Earthquake */}
            <div className="glass-panel p-5 relative overflow-hidden group hover:border-orange-500/30 transition-all duration-300">
                <div className="absolute -top-4 -right-4 text-[60px] opacity-[0.04] group-hover:opacity-[0.08] transition-opacity select-none">🌋</div>
                <div className="text-[9px] uppercase font-black tracking-[0.2em] text-white/30 mb-1">Próximo Terremoto</div>
                <div className="text-2xl lg:text-3xl font-black text-orange-400">
                    {nextEarthquake.toLocaleString()}
                </div>
                <div className="mt-3 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-1000"
                        style={{ width: `${eqProgress}%` }}
                    />
                </div>
                <div className="text-[9px] text-white/20 mt-1.5 font-bold">
                    5 PARCELAS GRATIS AL LLEGAR
                </div>
            </div>

            {/* Season */}
            <div className="glass-panel p-5 relative overflow-hidden group hover:border-yellow-500/30 transition-all duration-300">
                <div className="text-[9px] uppercase font-black tracking-[0.2em] text-white/30 mb-1">Temporada</div>
                <div className="text-2xl lg:text-3xl font-black text-white">
                    #{String(seasonId).padStart(2, '0')}
                </div>
                <div className="flex items-center gap-2 mt-2">
                    <span className={`flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${isContractReady ? 'bg-green-500/15 text-green-400' : 'bg-yellow-500/15 text-yellow-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isContractReady ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`} />
                        {isContractReady ? 'On-Chain' : 'Demo'}
                    </span>
                    <span className="text-[9px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        BSC (USDT)
                    </span>
                </div>
            </div>
        </div>
    );
}
