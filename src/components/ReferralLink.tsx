"use client";

import { useState, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';

export default function ReferralLink() {
    const { address, isConnected } = useWallet();
    const [copied, setCopied] = useState(false);
    const [referralLink, setReferralLink] = useState('');

    useEffect(() => {
        if (isConnected && address) {
            // Create the referral link based on the current domain
            const baseUrl = window.location.origin;
            setReferralLink(`${baseUrl}?ref=${address}`);
        }
    }, [isConnected, address]);

    const copyToClipboard = async () => {
        try {
            if (!referralLink) return;
            await navigator.clipboard.writeText(referralLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    if (!isConnected) return null;

    return (
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 mt-3">
            <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🤝</span>
                <h3 className="font-bold text-white/90 text-sm">Tu Link de Padrino</h3>
            </div>
            <p className="text-xs text-white/40 mb-3 leading-relaxed">
                Invita amigos con este enlace. Si tu ahijado se convierte en el Ganador Principal, tú te llevas automáticamente el <strong>15% del bote ($187,500)</strong>.
            </p>

            <div className="flex items-center gap-2">
                <div className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white/60 overflow-hidden text-ellipsis whitespace-nowrap">
                    {referralLink}
                </div>
                <button
                    onClick={copyToClipboard}
                    className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${copied
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 hover:border-white/20'
                        }`}
                >
                    {copied ? '¡Copiado!' : 'Copiar'}
                </button>
            </div>
        </div>
    );
}
