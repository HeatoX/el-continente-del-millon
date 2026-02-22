"use client";

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useWallet } from '@/context/WalletContext';
import { useRouter } from 'next/navigation';

const PlanetHero = dynamic(() => import('@/components/PlanetHero'), { ssr: false });

export default function LandingPage() {
  const { connect, isConnected, isConnecting, address } = useWallet();
  const router = useRouter();

  const handleConnect = async () => {
    if (isConnected) {
      router.push('/app');
    } else {
      await connect();
    }
  };

  // If already connected, show "Enter" button
  const ctaText = isConnecting ? 'Conectando...' : isConnected ? '🚀 Entrar al Mapa' : '🔗 Conectar Wallet';

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
            🔥 Temporada 1 — BNB Smart Chain
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] mb-6">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">
              EL CONTINENTE
            </span>
            <br />
            <span className="text-white/90 text-3xl md:text-5xl lg:text-6xl">
              DEL MILLÓN
            </span>
          </h1>

          <p className="text-white/50 text-sm md:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            Compra una parcela por <span className="text-cyan-400 font-bold">$5</span>, conquista el mapa,
            y podrías ganar <span className="text-green-400 font-bold">$500,000</span>.
            Sorteo automático cuando se llena el mapa. 100% on-chain. Sin intermediarios.
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
              ¿Cómo funciona? ↓
            </a>
          </div>

          {isConnected && (
            <div className="mt-4 text-[10px] font-mono text-green-400/60">
              ✅ {address?.slice(0, 6)}...{address?.slice(-4)}
            </div>
          )}

          {/* Stats ticker */}
          <div className="mt-12 flex items-center justify-center gap-8 text-center">
            <div>
              <div className="text-2xl md:text-3xl font-black text-white">250K</div>
              <div className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Parcelas</div>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div>
              <div className="text-2xl md:text-3xl font-black text-cyan-400">$5</div>
              <div className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Por Parcela</div>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div>
              <div className="text-2xl md:text-3xl font-black text-green-400">$1.25M</div>
              <div className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Bote Total</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════ HOW IT WORKS ═══════════════════════════════════ */}
      <section id="how" className="px-4 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-4">
            <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">¿Cómo Funciona?</span>
          </h2>
          <p className="text-white/40 max-w-xl mx-auto text-sm">
            Tres pasos simples. Todo automático. Todo on-chain.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              icon: '🗺️',
              title: 'Conquista Parcelas',
              description: 'Conecta tu wallet y compra parcelas por 0.01 BNB (~$5 USD). Cada parcela es tuya en la blockchain.',
              color: 'from-cyan-500 to-blue-500',
              glow: 'cyan',
            },
            {
              step: '02',
              icon: '🤝',
              title: 'Invita Guerreros',
              description: 'Comparte tu link de Padrino. Si tu ahijado gana, tú te llevas el 15% ($187,500) automáticamente.',
              color: 'from-purple-500 to-pink-500',
              glow: 'purple',
            },
            {
              step: '03',
              icon: '🏆',
              title: 'El Gran Sorteo',
              description: 'Al venderse la última parcela, se elige un ganador al azar. $500,000 directo a tu wallet.',
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

      {/* ═══════════════════════════════════ PRIZES ═══════════════════════════════════ */}
      <section id="prizes" className="px-4 py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto relative">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-4">
              <span className="bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">$1,250,000</span>
              <span className="text-white/60 text-xl md:text-3xl block mt-2">En Premios Automáticos</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { emoji: '🏆', label: 'GANADOR', amount: '$500,000', pct: '40%', color: 'from-yellow-500 to-amber-600', desc: 'Una parcela al azar gana el premio mayor' },
              { emoji: '🤝', label: 'PADRINO', amount: '$187,500', pct: '15%', color: 'from-purple-500 to-pink-500', desc: 'Quien invitó al ganador' },
              { emoji: '🏘️', label: '8 VECINOS', amount: '$125,000', pct: '10%', color: 'from-blue-500 to-cyan-500', desc: 'Las 8 parcelas alrededor del ganador' },
              { emoji: '🌧️', label: 'LLUVIA', amount: '$62,500', pct: '5%', color: 'from-cyan-500 to-teal-500', desc: '100 parcelas random reciben consuelo' },
              { emoji: '🔄', label: 'PRÓXIMA TEMPORADA', amount: '$125,000', pct: '10%', color: 'from-green-500 to-emerald-500', desc: 'Se acumula como jackpot progresivo' },
              { emoji: '🏦', label: 'TESORERÍA', amount: '$250,000', pct: '20%', color: 'from-gray-500 to-gray-600', desc: 'Marketing, operaciones, seguridad' },
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

          <div className="mt-8 text-center">
            <div className="inline-block bg-green-500/10 border border-green-500/20 rounded-2xl px-6 py-4">
              <div className="text-[10px] uppercase tracking-widest text-green-400/60 font-bold mb-1">Jackpot Progresivo</div>
              <div className="text-sm text-white/50">
                La Temporada 2 empieza con <span className="text-green-400 font-bold">$125,000</span> ya en el bote. Cada temporada crece más. 🔥
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════ SECURITY ═══════════════════════════════════ */}
      <section className="px-4 py-20 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-4">
            <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">🔐 Seguridad Blindada</span>
          </h2>
          <p className="text-white/40 max-w-xl mx-auto text-sm">
            Contrato auditable. Sin backdoors. Sin acceso admin a los fondos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { icon: '🔒', title: 'Pull Payment', desc: 'Cada ganador reclama su premio individualmente. Imposible que se trabe por gas.' },
            { icon: '🎲', title: 'Commit-Reveal', desc: 'Aleatoriedad verificable sin servicios externos. Admin no puede manipular el resultado.' },
            { icon: '🛡️', title: 'Sin Backdoors', desc: 'No existe función para que el admin retire fondos del pool. Tu inversión está segura.' },
            { icon: '⏱️', title: 'Anti-Abandono', desc: 'Si el admin no actúa en 48h, cualquier usuario puede forzar el sorteo.' },
            { icon: '🔑', title: 'Solo Tú Cobras', desc: 'Solo el dueño de la wallet puede reclamar su premio. Nadie más puede tocarlo.' },
            { icon: '🔄', title: 'Emergencia 7 Días', desc: 'Emergencia con timelock público de 7 días. La comunidad tiene tiempo de reaccionar.' },
          ].map((item) => (
            <div key={item.title} className="flex gap-4 bg-white/[0.02] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all">
              <span className="text-2xl flex-shrink-0">{item.icon}</span>
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
          <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Preguntas Frecuentes</span>
        </h2>

        <div className="space-y-4">
          {[
            { q: '¿Cuánto cuesta una parcela?', a: '0.01 BNB (aproximadamente $5 USD). Puedes comprar cuantas quieras.' },
            { q: '¿Cuándo es el sorteo?', a: 'Automáticamente cuando se vende la última de las 250,000 parcelas. No hay fecha fija.' },
            { q: '¿Cómo sé que es justo?', a: 'Usamos un sistema Commit-Reveal on-chain. El admin compromete un hash secreto ANTES de que se llene el mapa. Cualquiera puede verificar.' },
            { q: '¿Qué pasa si el admin desaparece?', a: 'Cualquier usuario puede llamar forceReveal() si el admin no actúa en 48 horas. Los fondos nunca quedan atrapados.' },
            { q: '¿Puedo perder mi premio?', a: 'No. Tu premio queda registrado en la blockchain para siempre. Solo tú puedes reclamarlo con tu wallet, cuando quieras.' },
            { q: '¿Qué es el Jackpot Progresivo?', a: 'El 10% del bote pasa a la siguiente temporada. Cada temporada empieza con más dinero. Es como un jackpot de casino que solo crece.' },
          ].map((item, i) => (
            <details key={i} className="group bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
              <summary className="cursor-pointer px-6 py-4 text-sm font-bold text-white/70 hover:text-white transition-colors flex items-center justify-between">
                {item.q}
                <span className="text-white/20 group-open:rotate-45 transition-transform text-lg">+</span>
              </summary>
              <div className="px-6 pb-4 text-sm text-white/40 leading-relaxed">{item.a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════ FINAL CTA ═══════════════════════════════════ */}
      <section className="px-4 py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-6">
            <span className="text-white/90">¿Listo para</span>
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">Conquistar?</span>
          </h2>
          <p className="text-white/40 text-sm mb-8">
            Una parcela de $5 puede convertirse en $500,000.
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
