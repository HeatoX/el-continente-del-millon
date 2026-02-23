"use client";

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useWallet } from '@/context/WalletContext';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from 'next/navigation';

const PlanetHero = dynamic(() => import('@/components/PlanetHero'), { ssr: false });

export default function LandingPage() {
  const { connect, isConnected, isConnecting, address } = useWallet();
  const { t } = useLanguage();
  const router = useRouter();

  const handleConnect = async () => {
    if (isConnected) {
      router.push('/app');
    } else {
      await connect();
    }
  };

  // If already connected, show "Enter" button
  const ctaText = isConnecting ? t('hero.connecting') : isConnected ? t('hero.enter') : t('hero.connect');

  return (
    <div className="space-y-0">
      {/* ═══════════════════════════════════ HERO ═══════════════════════════════════ */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Planet background */}
        <div className="absolute inset-0 z-0">
          <PlanetHero />
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#050510] z-10" />

        {/* Hero content */}
        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto">
          <div className="inline-block mb-6 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase tracking-[0.3em] font-bold text-cyan-400/80">
            {t('hero.season')}
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] mb-6">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">
              WORLDMILLION
            </span>
            <br />
            <span className="text-white/90 text-3xl md:text-5xl lg:text-6xl">
              {t('hero.conquest')}
            </span>
            <br />
            <span className="text-cyan-400 text-2xl md:text-4xl lg:text-5xl mt-4 block filter drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]">
              {t('hero.prizes')}
            </span>
          </h1>

          <p className="text-white/50 text-sm md:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            {t('hero.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl text-white font-black text-lg uppercase tracking-wider hover:from-cyan-400 hover:to-blue-500 transition-all active:scale-95 shadow-[0_0_40px_-10px_rgba(0,200,255,0.5)] disabled:opacity-50"
            >
              {ctaText}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-20 blur-xl transition-opacity" />
            </button>
            <a href="#how" className="text-white/40 hover:text-white/70 text-sm font-bold transition-colors">
              {t('hero.how')}
            </a>
          </div>

          {isConnected && (
            <div className="mt-4 text-[10px] font-mono text-green-400/60">
              ✅ {address?.slice(0, 6)}...{address?.slice(-4)}
            </div>
          )}

          {/* Trust Badges */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest text-white/40">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"><span className="text-yellow-400 text-sm">🔶</span> BNB Smart Chain</span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"><span className="text-orange-400 text-sm">🦊</span> MetaMask</span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"><span className="text-green-400 text-sm">💵</span> USDT BEP-20</span>
            <a href="https://bscscan.com/address/0x8b75907EF2Dac4a03dFa5A8a0538dd67c2b3479e" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors">
              <span className="text-blue-400 text-sm">🛡️</span> Audited & Verified
            </a>
          </div>

          {/* Stats ticker */}
          <div className="mt-12 flex items-center justify-center gap-8 text-center flex-wrap">
            <div>
              <div className="text-2xl md:text-3xl font-black text-white">250K</div>
              <div className="text-[9px] uppercase tracking-widest text-white/30 font-bold">{t('hero.parcels')}</div>
            </div>
            <div className="w-px h-10 bg-white/10 hidden sm:block" />
            <div>
              <div className="text-2xl md:text-3xl font-black text-cyan-400">$5</div>
              <div className="text-[9px] uppercase tracking-widest text-white/30 font-bold">{t('hero.per_parcel')}</div>
            </div>
            <div className="w-px h-10 bg-white/10 hidden sm:block" />
            <div>
              <div className="text-2xl md:text-3xl font-black text-green-400">$1.25M</div>
              <div className="text-[9px] uppercase tracking-widest text-white/30 font-bold">{t('hero.total_pool')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════ HOW IT WORKS ═══════════════════════════════════ */}
      <section id="how" className="px-4 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-4">
            <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">{t('how_it_works.title')}</span>
          </h2>
          <p className="text-white/40 max-w-xl mx-auto text-sm">
            {t('how_it_works.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              icon: '🗺️',
              title: t('how_it_works.steps.0.title'),
              description: t('how_it_works.steps.0.description'),
              color: 'from-cyan-500 to-blue-500',
              glow: 'cyan',
            },
            {
              step: '02',
              icon: '🤝',
              title: t('how_it_works.steps.1.title'),
              description: t('how_it_works.steps.1.description'),
              color: 'from-purple-500 to-pink-500',
              glow: 'purple',
            },
            {
              step: '03',
              icon: '🏆',
              title: t('how_it_works.steps.2.title'),
              description: t('how_it_works.steps.2.description'),
              color: 'from-green-500 to-emerald-500',
              glow: 'green',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="group relative bg-white/[0.02] border border-white/5 rounded-3xl p-8 hover:border-white/10 transition-all hover:bg-white/[0.04]"
            >
              <div className={`absolute -top-4 -left-4 w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-black text-xs font-black shadow-lg`}>
                {item.step}
              </div>
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="text-lg font-black text-white/90 mb-2">{item.title}</h3>
              <p className="text-sm text-white/40 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════ RECENT WINNERS MOCK (TRANSPARENCY) ═══════════════════════════════════ */}
      <section className="px-4 py-10 max-w-5xl mx-auto">
        <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-9xl">🏆</div>
          <h3 className="text-2xl font-black text-white/90 mb-6 flex items-center gap-3">
            {t('verifier.title')} <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full uppercase tracking-wider">{t('verifier.badge')}</span>
          </h3>
          <p className="text-sm text-white/40 mb-6 max-w-2xl relative z-10">
            {t('verifier.description')}
          </p>

          <div className="mb-8 relative z-10">
            <a href="https://bscscan.com/address/0x8b75907EF2Dac4a03dFa5A8a0538dd67c2b3479e" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 bg-black/60 border border-white/10 rounded-xl px-4 py-3 hover:border-cyan-500/50 transition-colors group">
              <span className="text-3xl">📜</span>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold mb-0.5">{t('verifier.contract_title')}</div>
                <div className="font-mono text-white/70 text-sm group-hover:text-white transition-colors">0x8b75907EF2Dac4a03dFa5A8a0538dd67c2b3479e ↗</div>
              </div>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
            <div className="bg-black/40 border border-white/5 rounded-xl p-4">
              <div className="text-xs text-white/30 uppercase tracking-widest mb-1">{t('verifier.winner')}</div>
              <div className="font-mono text-cyan-400 text-sm">{t('verifier.pending')}</div>
              <div className="text-xs text-white/50 mt-2">$500,000 {t('verifier.ready')}</div>
            </div>
            <div className="bg-black/40 border border-white/5 rounded-xl p-4">
              <div className="text-xs text-white/30 uppercase tracking-widest mb-1">{t('verifier.godfather')}</div>
              <div className="font-mono text-purple-400 text-sm">{t('verifier.pending')}</div>
              <div className="text-xs text-white/50 mt-2">$187,500 {t('verifier.ready')}</div>
            </div>
            <div className="bg-black/40 border border-white/5 rounded-xl p-4">
              <div className="text-xs text-white/30 uppercase tracking-widest mb-1">{t('verifier.neighbors')}</div>
              <div className="font-mono text-blue-400 text-sm">0 / 8 {t('verifier.claimed')}</div>
              <div className="text-xs text-white/50 mt-2">$125,000 {t('verifier.in_pool')}</div>
            </div>
            <div className="bg-black/40 border border-white/5 rounded-xl p-4">
              <div className="text-xs text-white/30 uppercase tracking-widest mb-1">{t('verifier.rain')}</div>
              <div className="font-mono text-green-400 text-sm">0 / 100 {t('verifier.claimed')}</div>
              <div className="text-xs text-white/50 mt-2">$62,500 {t('verifier.in_pool')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════ PRIZES ═══════════════════════════════════ */}
      <section id="prizes" className="px-4 py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto relative">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-4">
              <span className="bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">$1,250,000</span>
              <span className="text-white/60 text-xl md:text-3xl block mt-2">{t('prizes.title')}</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { emoji: '🏆', label: t('prizes.items.0.label'), amount: '$500,000', pct: '40%', color: 'from-yellow-500 to-amber-600', desc: t('prizes.items.0.desc') },
              { emoji: '🤝', label: t('prizes.items.1.label'), amount: '$187,500', pct: '15%', color: 'from-purple-500 to-pink-500', desc: t('prizes.items.1.desc') },
              { emoji: '🏘️', label: t('prizes.items.2.label'), amount: '$125,000', pct: '10%', color: 'from-blue-500 to-cyan-500', desc: t('prizes.items.2.desc') },
              { emoji: '🌧️', label: t('prizes.items.3.label'), amount: '$62,500', pct: '5%', color: 'from-cyan-500 to-teal-500', desc: t('prizes.items.3.desc') },
              { emoji: '🔄', label: t('prizes.items.4.label'), amount: '$125,000', pct: '10%', color: 'from-green-500 to-emerald-500', desc: t('prizes.items.4.desc') },
              { emoji: '🏦', label: t('prizes.items.5.label'), amount: '$250,000', pct: '20%', color: 'from-gray-500 to-gray-600', desc: t('prizes.items.5.desc') },
            ].map((prize) => (
              <div key={prize.label} className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{prize.emoji}</span>
                  <div>
                    <div className="text-[9px] uppercase tracking-widest text-white/30 font-bold">{prize.label} — {prize.pct}</div>
                    <div className={`text-xl font-black bg-gradient-to-r ${prize.color} bg-clip-text text-transparent`}>{prize.amount}</div>
                  </div>
                </div>
                <p className="text-[11px] text-white/30 leading-relaxed">{prize.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center flex justify-center">
            <div className="max-w-md bg-green-500/10 border border-green-500/20 rounded-2xl px-6 py-4">
              <div className="text-[10px] uppercase tracking-widest text-green-400 font-bold mb-1">{t('prizes.rule_title')}</div>
              <div className="text-sm text-white/70">
                {t('prizes.rule_desc')}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════ SECURITY & FORT KNOX ═══════════════════════════════════ */}
      <section className="px-4 py-20 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-4">
            <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">{t('security.title')}</span>
          </h2>
          <p className="text-white/40 max-w-xl mx-auto text-sm">
            {t('security.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { icon: '🔒', title: t('security.items.0.title'), desc: t('security.items.0.desc') },
            { icon: '🎲', title: t('security.items.1.title'), desc: t('security.items.1.desc') },
            { icon: '🚫', title: t('security.items.2.title'), desc: t('security.items.2.desc') },
            { icon: '🔪', title: t('security.items.3.title'), desc: t('security.items.3.desc') },
            { icon: '🛡️', title: t('security.items.4.title'), desc: t('security.items.4.desc') },
            { icon: '⏳', title: t('security.items.5.title'), desc: t('security.items.5.desc') },
          ].map((item) => (
            <div key={item.title} className="flex gap-4 bg-white/[0.02] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all">
              <span className="text-3xl flex-shrink-0">{item.icon}</span>
              <div>
                <h3 className="text-sm font-black text-white/80 mb-1">{item.title}</h3>
                <p className="text-xs text-white/35 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════ FAQ ═══════════════════════════════════ */}
      <section className="px-4 py-20 max-w-3xl mx-auto">
        <h2 className="text-3xl font-black tracking-tighter mb-10 text-center">
          <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">{t('faq.title')}</span>
        </h2>

        <div className="space-y-4">
          {[
            { q: t('faq.q1'), a: t('faq.a1') },
            { q: t('faq.q2'), a: t('faq.a2') },
            { q: t('faq.q3'), a: t('faq.a3') },
            { q: t('faq.q4'), a: t('faq.a4') },
            { q: t('faq.q5'), a: t('faq.a5') },
            { q: t('faq.q6'), a: t('faq.a6') },
          ].map((item, i) => (
            <details key={i} className="group bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
              <summary className="cursor-pointer px-6 py-4 text-xs md:text-sm font-bold text-white/70 hover:text-white transition-colors flex items-center justify-between">
                <span>{item.q}</span>
                <span className="text-white/20 group-open:rotate-45 transition-transform text-lg ml-4">+</span>
              </summary>
              <div className="px-6 pb-4 text-xs md:text-sm text-white/40 leading-relaxed">{item.a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════ FINAL CTA ═══════════════════════════════════ */}
      <section className="px-4 py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-6">
            <span className="text-white/90">{t('footer.ready')}</span>
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">{t('footer.conquer')}</span>
          </h2>
          <p className="text-white/40 text-sm mb-8">
            {t('footer.desc')}
          </p>
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="px-10 py-5 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl text-white font-black text-xl uppercase tracking-wider hover:from-cyan-400 hover:to-purple-500 transition-all active:scale-95 shadow-[0_0_60px_-15px_rgba(0,200,255,0.4)] disabled:opacity-50"
          >
            {ctaText}
          </button>
        </div>
      </section>
    </div>
  );
}
