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
            🔥 Temporada 1 — Red Binance (USDT)
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] mb-6">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">
              WORLDMILLION
            </span>
            <br />
            <span className="text-white/90 text-3xl md:text-5xl lg:text-6xl">
              CONQUEST
            </span>
          </h1>

          <p className="text-white/50 text-sm md:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            Compra una parcela por <span className="text-cyan-400 font-bold">$5</span>, conquista el mapa,
            y podrías ganar <span className="text-green-400 font-bold">$500,000</span>.
            Sorteo automático on-chain Fort Knox. Arquitectura 100% Anti-Hacker y Sin Intermediarios.
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
          <div className="mt-12 flex items-center justify-center gap-8 text-center flex-wrap">
            <div>
              <div className="text-2xl md:text-3xl font-black text-white">250K</div>
              <div className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Parcelas</div>
            </div>
            <div className="w-px h-10 bg-white/10 hidden sm:block" />
            <div>
              <div className="text-2xl md:text-3xl font-black text-cyan-400">$5</div>
              <div className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Por Parcela</div>
            </div>
            <div className="w-px h-10 bg-white/10 hidden sm:block" />
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
            Totalmente automático. Cero intervención humana. 100% On-Chain.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              icon: '🗺️',
              title: 'Compra tu Parcela',
              description: 'Existen 250,000 parcelas en el mapa. Cada parcela cuesta 5 USDT y permanece tuya hasta el final de la Temporada.',
              color: 'from-cyan-500 to-blue-500',
              glow: 'cyan',
            },
            {
              step: '02',
              icon: '🤝',
              title: 'Invita y Gana ($187k)',
              description: 'Comparte tu link de referidos. Si la persona que invitas resulta ser el Ganador Principal, tú te llevas el 15% del bote automáticamente.',
              color: 'from-purple-500 to-pink-500',
              glow: 'purple',
            },
            {
              step: '03',
              icon: '🏆',
              title: 'Sorteo "Nivel Dios"',
              description: 'Al llenarse el mapa, nuestro Algoritmo Fort-Knox selecciona los ganadores y cada usuario puede "Reclamar" su premio sin jamás colapsar la red.',
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
            Verificador Público <span className="text-[10px] bg-green-500/20 text-green-400 px-3 py-1 rounded-full uppercase tracking-wider">Temporada 0 (Demo)</span>
          </h3>
          <p className="text-sm text-white/40 mb-8 max-w-2xl relative z-10">
            En <strong>WorldMillion</strong>, la transparencia lo es todo. Aquí podrás auditar los ganadores de la temporada pasada verificados directamente en la blockchain. Garantizamos la ejecución implacable de nuestro código abierto.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
            <div className="bg-black/40 border border-white/5 rounded-xl p-4">
              <div className="text-xs text-white/30 uppercase tracking-widest mb-1">Gran Ganador</div>
              <div className="font-mono text-cyan-400 text-sm">-- Pendiente --</div>
              <div className="text-xs text-white/50 mt-2">$500,000 listos para cobrar</div>
            </div>
            <div className="bg-black/40 border border-white/5 rounded-xl p-4">
              <div className="text-xs text-white/30 uppercase tracking-widest mb-1">Padrino</div>
              <div className="font-mono text-purple-400 text-sm">-- Pendiente --</div>
              <div className="text-xs text-white/50 mt-2">$187,500 listos para cobrar</div>
            </div>
            <div className="bg-black/40 border border-white/5 rounded-xl p-4">
              <div className="text-xs text-white/30 uppercase tracking-widest mb-1">8 Vecinos</div>
              <div className="font-mono text-blue-400 text-sm">0 / 8 Reclamados</div>
              <div className="text-xs text-white/50 mt-2">$125,000 en el pozo</div>
            </div>
            <div className="bg-black/40 border border-white/5 rounded-xl p-4">
              <div className="text-xs text-white/30 uppercase tracking-widest mb-1">Lluvia Extendida</div>
              <div className="font-mono text-green-400 text-sm">0 / 100 Reclamados</div>
              <div className="text-xs text-white/50 mt-2">$62,500 en el pozo</div>
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
              <span className="text-white/60 text-xl md:text-3xl block mt-2">Distribución Exacta</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { emoji: '🏆', label: 'GANADOR', amount: '$500,000', pct: '40%', color: 'from-yellow-500 to-amber-600', desc: 'Una parcela al azar se lleva la gloria absoluta.' },
              { emoji: '🤝', label: 'PADRINO', amount: '$187,500', pct: '15%', color: 'from-purple-500 to-pink-500', desc: 'El usuario que invitó al Gran Ganador a través de su link.' },
              { emoji: '🏘️', label: '8 VECINOS', amount: '$125,000', pct: '10%', color: 'from-blue-500 to-cyan-500', desc: 'Las 8 parcelas físicas colindantes al ganador del mapa.' },
              { emoji: '🌧️', label: 'LLUVIA', amount: '$62,500', pct: '5%', color: 'from-cyan-500 to-teal-500', desc: '100 parcelas aleatorias que no ganaron premios obtienen consuelo.' },
              { emoji: '🔄', label: 'JACKPOT (SIG. TEMPORADA)', amount: '$125,000', pct: '10%', color: 'from-green-500 to-emerald-500', desc: 'Todo el sobrante y los premios caducados crecen el bote.' },
              { emoji: '🏦', label: 'TESORERÍA', amount: '$250,000', pct: '20%', color: 'from-gray-500 to-gray-600', desc: 'Operaciones, auditorias de seguridad y expansión del juego.' },
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
              <div className="text-[10px] uppercase tracking-widest text-green-400 font-bold mb-1">Regla Estricta: Un Ganador Único</div>
              <div className="text-sm text-white/70">
                Ninguna billetera puede ganar dos premios en el mismo sorteo. El contrato salta iterativamente a ganadores repetidos (ej. si compraste tres parcelas conjuntas) para <strong>esparcir la riqueza</strong> a diferentes personas de forma justa.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════ SECURITY & FORT KNOX ═══════════════════════════════════ */}
      <section className="px-4 py-20 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-4">
            <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">Seguridad "Nivel Dios"</span>
          </h2>
          <p className="text-white/40 max-w-xl mx-auto text-sm">
            Diseñamos el Smart Contract como una fortaleza inexpugnable. 0% Confiabilidad Humana. 100% Matemática Pura.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { icon: '🔒', title: 'Arquitectura "Pull Payment"', desc: 'El contrato nunca "empuja" el dinero. En su lugar, asegura tu saldo a tu nombre. Tú lo retiras cuando quieras, y pagas tú mismo el pequeño gas de red, eliminando un colapso general en la Blockchain.' },
            { icon: '🎲', title: 'Aleatoriedad Híbrida Ofuscada', desc: 'Mezclamos un Hash cifrado del administrador antes de cerrar el sorteo con el hash impredecible exacto del Bloque 250,000 en 3 capas. Imposible de predecir o manipular por mineros o creadores.' },
            { icon: '🚫', title: 'CERO Puertas Traseras', desc: 'No incluimos funciones "Backdoors" en nuestro código. Ninguna autorización de emergencia para retirar liquidez de los usuarios. Todo es inmutable.' },
            { icon: '🔪', title: 'Cero Tolerancia al Creador', desc: 'Si el equipo se demora en revelar el hash por más de 24 horas, cualquier usuario al azar puede Forzar el Reveal en el contrato. ¡Gana la gente, pero la Tesorería se la traga el pozo y el equipo recibe 0$!' },
            { icon: '🛡️', title: 'Defensas Reactivas (Anti-Bots)', desc: 'Nuestro Smart Contract está blindado con algoritmos de detección de intrusos. Cualquier intento de usar Re-entrancy o manipular el flujo del contrato será bloqueado y el atacante penalizado irreversiblemente por el sistema.' },
            { icon: '⏳', title: 'Expiración Reciclada (180 Días)', desc: 'Si un jugador sufre un accidente y no reclama su premio de $500,000 en 6 Meses, ese dinero no lo embolsa el creador. Una función lo liquida y lo ingresa directamente al Carry-Over progresivo de la comunidad general.' },
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
          <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Preguntas Frecuentes</span>
        </h2>

        <div className="space-y-4">
          {[
            { q: '¿Cuánto cuesta una parcela y cómo se paga?', a: '5 USDT. Puedes usar MetaMask, Trust Wallet u OKX en la red de BNB Smart Chain. No necesitas registrarte con correos, todo es directo a tu billetera.' },
            { q: '¿Cuándo es exactamente el sorteo?', a: 'No hay fecha en el calendario. El cálculo matemático se dispara en el milisegundo en que un usuario en el mundo compra la última de las 250,000 parcelas del mapa.' },
            { q: '¿Qué pasa si compro varias parcelas?', a: 'Tienes muchas más chances matemáticas de ganar y de ser tu propio "Vecino", PERO recuerda nuestra estricta regla de "Un Ganador Único". Solo cobrarás tu premio mayor. La Blockchain buscará billeteras de personas nuevas para el resto de consuelos.' },
            { q: '¿Cómo sé que el dueño de la web no se quedará mi dinero?', a: 'El Contrato Inteligente que procesa y guarda el dinero es un ente matemático inmutable y público. Carece de "Botones Secretos" para drenar dinero a discreción y puede ser verificado bloque a bloque.' },
            { q: '¿Tengo que hacer algo especial para cobrar mis $500,000?', a: 'No. Una vez ganados el sistema liberará tu saldo on-chain. Solo regresas a la web e inicias sesión con tu billetera seleccionando "Reclamar". Céntimo por céntimo, a tu bolsillo sin KYC ni terceros.' },
            { q: '¿Qué pasa si mi internet falla o reclamo tarde?', a: 'Nada malo. En WorldMillion el premio ya es tuyo sin tiempos estrechos. Tienes un límite gigantesco de 6 meses de sobra para accionar tu billetera on-chain.' },
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
            Una parcela de $5 dólares de inversión hoy puede liberar tus $500,000 dólares mañana.
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
