"use client";

import { useState, useEffect } from 'react';
import { useContract } from '@/context/ContractContext';
import { useWallet } from '@/context/WalletContext';
import { useGame } from '@/context/GameContext';

export default function BuyPanel() {
    const { state: contractState, buyParcels, claimPrize, approveUsdt, isContractReady, error: contractError } = useContract();
    const { state: gameState, buyRandomParcels } = useGame();
    const { address } = useWallet();
    const [amount, setAmount] = useState(1);
    const [copied, setCopied] = useState(false);
    const [buying, setBuying] = useState(false);
    const [claiming, setClaiming] = useState(false);
    const [txHash, setTxHash] = useState<string | null>(null);

    // ── Customization State ──
    const [selectedColor, setSelectedColor] = useState('#00f3ff');
    const [identifier, setIdentifier] = useState('');

    const priceUSDT = 5;

    // Use contract state if available, otherwise fall back to game state
    const userParcels = isContractReady ? contractState.userParcels : gameState.userParcels;
    const userReferrals = isContractReady ? contractState.userReferrals : gameState.userReferrals;
    const pendingPrize = isContractReady ? parseFloat(contractState.pendingPrize) : 0;

    // Get referral from URL
    const [referrer, setReferrer] = useState<string>('');
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const ref = params.get('ref');
            if (ref && ref.startsWith('0x')) setReferrer(ref);
        }
    }, []);

    const isApprovalNeeded = isContractReady && parseFloat(contractState.usdtAllowance || '0') < (amount * priceUSDT);

    const handleAction = async () => {
        if (isApprovalNeeded) {
            setBuying(true);
            await approveUsdt((amount * priceUSDT).toString());
            setBuying(false);
        } else {
            handleBuy();
        }
    };

    const handleBuy = async () => {
        if (isContractReady) {
            // Real contract interaction
            setBuying(true);
            setTxHash(null);
            try {
                // Generate random unique coordinates
                const xs: number[] = [];
                const ys: number[] = [];
                const used = new Set<string>();
                let attempts = 0;
                while (xs.length < amount && attempts < amount * 20) {
                    const x = Math.floor(Math.random() * 500);
                    const y = Math.floor(Math.random() * 500);
                    const key = `${x},${y}`;
                    if (!used.has(key)) {
                        xs.push(x);
                        ys.push(y);
                        used.add(key);
                    }
                    attempts++;
                }

                // Pack color to uint32
                const colorHex = selectedColor.replace('#', '');
                const colorUint = parseInt(colorHex, 16);

                // Encode identifier to bytes4
                // Padding string to 4 chars, then to hex
                let idStr = identifier.padEnd(4, ' ').substring(0, 4);
                let hexId = '0x';
                for (let i = 0; i < 4; i++) {
                    hexId += idStr.charCodeAt(i).toString(16).padStart(2, '0');
                }

                // Ensure the context buyParcels accepts color and identifier
                const hash = await buyParcels(xs, ys, referrer || undefined, colorUint, hexId);
                if (hash) {
                    setTxHash(hash);
                }
            } finally {
                setBuying(false);
            }
        } else {
            // Demo mode (Mocking the color and identifier for visual effect)
            buyRandomParcels(amount, selectedColor, identifier);
        }
    };

    const handleClaim = async () => {
        setClaiming(true);
        try {
            await claimPrize();
        } finally {
            setClaiming(false);
        }
    };

    const handleCopy = () => {
        const url = address
            ? `${window.location.origin}?ref=${address}`
            : 'https://elcontinente.io/?ref=tu-wallet';
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const refLink = address
        ? `${typeof window !== 'undefined' ? window.location.origin : ''}?ref=${address.slice(0, 6)}...${address.slice(-4)}`
        : 'Conecta tu wallet primero';

    // Badge logic
    const getBadge = (parcels: number) => {
        if (parcels >= 100) return { label: '💎 LEYENDA', color: 'text-purple-400 bg-purple-400/10 border-purple-400/30' };
        if (parcels >= 50) return { label: '🥇 EMPERADOR', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30' };
        if (parcels >= 10) return { label: '🥈 CONQUISTADOR', color: 'text-slate-300 bg-slate-300/10 border-slate-300/30' };
        return { label: '🥉 EXPLORADOR', color: 'text-amber-700 bg-amber-700/10 border-amber-700/30' };
    };
    const badge = getBadge(userParcels);

    const presetColors = ['#00f3ff', '#ff0055', '#bb00ff', '#00ff66', '#ffaa00', '#ffffff'];

    return (
        <div className="glass-panel p-5 flex flex-col gap-5">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                    <span className="w-7 h-7 rounded-md bg-cyan-400 flex items-center justify-center text-black text-sm">⚔️</span>
                    CONQUISTAR
                </h3>
                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full border ${badge.color}`}>
                    {badge.label}
                </span>
            </div>

            {/* Mode indicator */}
            <div className={`text-[9px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full text-center ${isContractReady ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'}`}>
                {isContractReady ? '🟢 CONTRATO ACTIVO — BNB REAL' : '🟡 MODO DEMO — Conecta wallet y despliega contrato'}
            </div>

            {/* Customization Panel (100% On-Chain, 0 Gas) */}
            <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-[0.1em] text-cyan-400">🎨 Identidad On-Chain (GRATIS)</span>
                    <span className="text-[8px] text-white/30 uppercase">Visible desde el espacio</span>
                </div>

                <div className="space-y-2">
                    <div className="flex gap-2">
                        {presetColors.map(c => (
                            <button
                                key={c}
                                onClick={() => setSelectedColor(c)}
                                className={`w-6 h-6 rounded-full transition-transform ${selectedColor === c ? 'scale-125 border-2 border-white' : 'border border-white/20 hover:scale-110'}`}
                                style={{ backgroundColor: c, boxShadow: selectedColor === c ? `0 0 10px ${c}80` : 'none' }}
                            />
                        ))}
                    </div>

                    <div className="relative">
                        <input
                            type="text"
                            maxLength={4}
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                            placeholder="Nombre en el Mapa (Max 4 Letras)"
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white font-bold outline-none focus:border-cyan-500/50 transition-colors text-xs uppercase"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-white/20">
                            {identifier.length}/4
                        </span>
                    </div>
                </div>
            </div>

            {/* Amount selector */}
            <div className="space-y-3">
                <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-[0.15em] text-white/30">
                    <span>Cantidad</span>
                    <div className="text-right">
                        <span className="text-cyan-400 text-xs">{(amount * priceUSDT).toFixed(2)} USDT</span>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                    {[1, 5, 25, 50].map((val) => (
                        <button
                            key={val}
                            onClick={() => setAmount(val)}
                            className={`py-2.5 rounded-lg border text-sm font-bold transition-all duration-200 ${amount === val
                                ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400 shadow-[0_0_12px_-4px_rgba(0,243,255,0.3)]'
                                : 'border-white/5 bg-white/5 text-white/50 hover:border-white/15 hover:text-white/70'
                                }`}
                        >
                            {val}
                        </button>
                    ))}
                </div>

                <div className="relative">
                    <input
                        type="number"
                        min={1}
                        max={1000}
                        value={amount}
                        onChange={(e) => setAmount(Math.max(1, Math.min(1000, Number(e.target.value))))}
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3.5 text-white font-bold outline-none focus:border-cyan-500/50 transition-colors text-sm"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] uppercase font-bold text-white/20">
                        c/u 5 USDT
                    </span>
                </div>
            </div>

            {/* Referral Link */}
            <div className="p-3.5 rounded-lg bg-white/[0.03] border border-white/5 space-y-2">
                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.15em]">
                    <span className="text-white/30">Tu Link de Padrino</span>
                    <button onClick={handleCopy} className="text-cyan-400 hover:text-cyan-300 transition-colors">
                        {copied ? '✅ Copiado!' : 'Copiar'}
                    </button>
                </div>
                <input
                    readOnly
                    value={refLink}
                    className="w-full bg-transparent border-none outline-none text-[10px] font-mono text-white/40 p-0"
                />
                <p className="text-[9px] text-white/15 leading-relaxed">
                    Si alguien gana usando tu link → te llevas <span className="text-cyan-400/60 font-bold">15%</span> del bote (<span className="text-cyan-400/60 font-bold">$187,500</span>)
                </p>
            </div>

            {/* BUY Button */}
            <button
                onClick={handleAction}
                disabled={buying}
                className="w-full py-4 rounded-xl bg-gradient-to-b from-white to-white/90 text-black font-black text-base tracking-tight hover:from-cyan-400 hover:to-cyan-500 transition-all duration-300 active:scale-[0.98] shadow-[0_8px_30px_-8px_rgba(255,255,255,0.25)] hover:shadow-[0_8px_30px_-8px_rgba(0,243,255,0.4)] disabled:opacity-50 disabled:cursor-wait"
            >
                {buying
                    ? '⏳ Confirmando...'
                    : isApprovalNeeded
                        ? `APROBAR GASTOS (${amount * priceUSDT} USDT)`
                        : `CONQUISTAR ${amount > 1 ? `x${amount}` : ''} AHORA`
                }
                <div className="text-[9px] font-bold text-black/40 tracking-widest uppercase mt-0.5">
                    PREMIO MÁX: 500,000 USDT
                </div>
            </button>

            {/* Transaction hash */}
            {txHash && (
                <a
                    href={`https://testnet.bscscan.com/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-mono text-green-400/60 text-center hover:text-green-400 transition-colors break-all"
                >
                    ✅ TX: {txHash.slice(0, 16)}...{txHash.slice(-8)} ↗
                </a>
            )}

            {/* Contract error */}
            {contractError && (
                <div className="text-[10px] text-red-400/60 text-center bg-red-400/5 border border-red-400/10 px-3 py-2 rounded-lg">
                    ⚠️ {contractError.slice(0, 100)}
                </div>
            )}

            {/* Claim Prize */}
            {pendingPrize > 0 && (
                <button
                    onClick={handleClaim}
                    disabled={claiming}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black text-sm hover:from-green-400 hover:to-emerald-500 transition-all active:scale-[0.98] shadow-[0_0_30px_-10px_rgba(16,185,129,0.4)] disabled:opacity-50"
                >
                    {claiming ? '⏳ Reclamando...' : `🎉 RECLAMAR ${contractState.pendingPrize} USDT`}
                </button>
            )}

            {/* User Stats */}
            <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3 text-center">
                    <div className="text-[9px] uppercase font-black text-white/25 mb-0.5 tracking-wider">Tus Parcelas</div>
                    <div className="text-xl font-black text-white">{userParcels}</div>
                </div>
                <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3 text-center">
                    <div className="text-[9px] uppercase font-black text-white/25 mb-0.5 tracking-wider">Referidos</div>
                    <div className="text-xl font-black text-white">{userReferrals}</div>
                </div>
            </div>
        </div>
    );
}
