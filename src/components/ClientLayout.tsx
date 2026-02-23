"use client";

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { GameProvider } from '@/context/GameContext';
import { WalletProvider, useWallet } from '@/context/WalletContext';
import { ContractProvider } from '@/context/ContractContext';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';
import Particles from '@/components/Particles';

function LanguageToggle() {
    const { language, setLanguage } = useLanguage();

    return (
        <button
            onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold text-white/50 uppercase tracking-wider transition-colors mr-2"
        >
            <span className={language === 'es' ? 'text-white' : ''}>ES</span>
            <span className="text-white/20">|</span>
            <span className={language === 'en' ? 'text-white' : ''}>EN</span>
        </button>
    );
}

function NavBar() {
    const [mobileMenu, setMobileMenu] = useState(false);
    const { connect, disconnect, isConnected, isConnecting, address } = useWallet();
    const pathname = usePathname();
    const isApp = pathname === '/app';

    return (
        <>
            <nav className="relative z-50 flex items-center justify-between px-4 lg:px-8 py-3 glass-panel mx-3 mt-3 rounded-2xl lg:rounded-full border-white/5">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-sm font-black text-black">
                        🌍
                    </div>
                    <span className="text-lg lg:text-xl font-black tracking-tighter bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                        WORLDMILLION
                    </span>
                    <span className="hidden sm:inline text-[8px] bg-white/10 px-2 py-0.5 rounded-full text-white/40 uppercase tracking-widest font-black">
                        v2.0
                    </span>
                </Link>

                {/* Desktop links */}
                <div className="hidden md:flex items-center gap-6 text-xs font-bold text-white/50 uppercase tracking-wider">
                    {isApp ? (
                        <>
                            <a href="#map" className="hover:text-cyan-400 transition-colors">Mapa</a>
                            <Link href="/" className="hover:text-cyan-400 transition-colors">Inicio</Link>
                        </>
                    ) : (
                        <>
                            <a href="#how" className="hover:text-cyan-400 transition-colors">¿Cómo?</a>
                            <a href="#prizes" className="hover:text-cyan-400 transition-colors">Premios</a>
                        </>
                    )}

                    <LanguageToggle />

                    {isConnected ? (
                        <div className="flex items-center gap-3">
                            <Link
                                href="/app"
                                className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-5 py-2 rounded-full font-black text-xs hover:from-cyan-400 hover:to-blue-500 transition-all active:scale-95"
                            >
                                🗺️ Ir al Mapa
                            </Link>
                            <button
                                onClick={disconnect}
                                className="text-[10px] font-mono text-white/30 hover:text-red-400 transition-colors"
                                title="Desconectar"
                            >
                                {address?.slice(0, 6)}...{address?.slice(-4)} ✕
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={connect}
                            disabled={isConnecting}
                            className="bg-white text-black px-5 py-2 rounded-full font-black text-xs hover:bg-cyan-400 transition-all active:scale-95 shadow-[0_4px_20px_-6px_rgba(255,255,255,0.2)] disabled:opacity-50"
                        >
                            {isConnecting ? '⏳...' : '🔗 Conectar Wallet'}
                        </button>
                    )}
                </div>

                {/* Mobile hamburger */}
                <div className="md:hidden flex items-center gap-2">
                    <LanguageToggle />
                    <button
                        onClick={() => setMobileMenu(!mobileMenu)}
                        className="w-8 h-8 flex flex-col items-center justify-center gap-1.5"
                    >
                        <span className={`w-5 h-0.5 bg-white/60 transition-all ${mobileMenu ? 'rotate-45 translate-y-2' : ''}`} />
                        <span className={`w-5 h-0.5 bg-white/60 transition-all ${mobileMenu ? 'opacity-0' : ''}`} />
                        <span className={`w-5 h-0.5 bg-white/60 transition-all ${mobileMenu ? '-rotate-45 -translate-y-2' : ''}`} />
                    </button>
                </div>
            </nav>

            {/* Mobile menu */}
            {mobileMenu && (
                <div className="md:hidden relative z-50 glass-panel mx-3 mt-1 rounded-xl p-4 space-y-3 border-white/5">
                    {isApp ? (
                        <>
                            <a href="#map" className="block text-sm font-bold text-white/60 hover:text-cyan-400 py-2 border-b border-white/5">🗺️ Mapa</a>
                            <Link href="/" className="block text-sm font-bold text-white/60 hover:text-cyan-400 py-2 border-b border-white/5">🏠 Inicio</Link>
                        </>
                    ) : (
                        <>
                            <a href="#how" className="block text-sm font-bold text-white/60 hover:text-cyan-400 py-2 border-b border-white/5">❓ ¿Cómo?</a>
                            <a href="#prizes" className="block text-sm font-bold text-white/60 hover:text-cyan-400 py-2 border-b border-white/5">🏆 Premios</a>
                        </>
                    )}
                    {isConnected ? (
                        <div className="space-y-2">
                            <Link href="/app" className="block w-full text-center bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-xl font-black text-sm">
                                🗺️ Ir al Mapa
                            </Link>
                            <button onClick={disconnect} className="w-full text-center text-xs text-white/30 py-2">
                                Desconectar ({address?.slice(0, 6)}...{address?.slice(-4)})
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={connect}
                            disabled={isConnecting}
                            className="w-full bg-white text-black py-3 rounded-xl font-black text-sm disabled:opacity-50"
                        >
                            {isConnecting ? '⏳ Conectando...' : '🔗 Conectar Wallet'}
                        </button>
                    )}
                </div>
            )}
        </>
    );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    return (
        <LanguageProvider>
            <WalletProvider>
                <ContractProvider>
                    <GameProvider>
                        <div className="min-h-screen relative">
                            <Particles />

                            {/* Background glows */}
                            <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
                                <div className="absolute top-[-15%] left-[-10%] w-[45%] h-[45%] bg-[#00f3ff12] blur-[120px] rounded-full" />
                                <div className="absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] bg-[#9d00ff12] blur-[120px] rounded-full" />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] bg-[#ff00ff08] blur-[100px] rounded-full" />
                            </div>

                            {/* Navigation */}
                            <NavBar />

                            <main className="relative z-10 p-3 pt-3">
                                {children}
                            </main>

                            {/* Footer */}
                            <footer className="relative z-10 glass-panel py-3 px-6 mx-3 mb-3 rounded-xl border-white/5 flex flex-wrap items-center justify-between gap-2 text-[8px] uppercase font-black tracking-[0.2em] text-white/20">
                                <div className="flex flex-wrap gap-4 lg:gap-8">
                                    <span className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-green-500" /> CONTRACT: BSC</span>
                                    <span>SORTEO: COMMIT-REVEAL</span>
                                    <span>PREMIOS: PULL PAYMENT</span>
                                </div>
                                <div className="flex gap-4">
                                    <a href="#" className="hover:text-cyan-400 transition-colors">Twitter</a>
                                    <a href="#" className="hover:text-cyan-400 transition-colors">Discord</a>
                                    <a href="#" className="hover:text-cyan-400 transition-colors">Docs</a>
                                    <a href="#" className="hover:text-cyan-400 transition-colors">BscScan</a>
                                </div>
                            </footer>
                        </div>
                    </GameProvider>
                </ContractProvider>
            </WalletProvider>
        </LanguageProvider>
    );
}
