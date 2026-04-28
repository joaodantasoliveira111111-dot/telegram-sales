'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ChevronRight, CheckCircle2, XCircle, Check, Star, ChevronDown,
  Bot, BarChart3, GitBranch, FlaskConical, CreditCard, Shield, Users, Globe,
  PlusCircle, TrendingUp, MessageSquare, Send, Share2, Percent,
  BarChart2, DollarSign, Tag, FileText, Mail, Rocket, Menu, X, Zap,
  ArrowRight, Clock, Banknote, Lock, Layers, BadgeCheck,
} from 'lucide-react'

// ─── Logo SVG ────────────────────────────────────────────────────────────────

function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 500 500" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="lgA" x1="0.85" y1="0.05" x2="0.15" y2="0.95">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="42%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
        <linearGradient id="lgB" x1="0.85" y1="0.05" x2="0.15" y2="0.95">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#4c1d95" />
        </linearGradient>
      </defs>
      <g fill="url(#lgB)" opacity="0.5" transform="translate(20,14)">
        <rect x="118" y="88" width="56" height="315" rx="28" />
        <rect x="118" y="88" width="262" height="56" rx="28" />
        <rect x="118" y="195" width="208" height="50" rx="25" />
      </g>
      <g fill="url(#lgA)">
        <rect x="118" y="88" width="56" height="315" rx="28" />
        <rect x="118" y="88" width="262" height="56" rx="28" />
        <rect x="118" y="195" width="208" height="50" rx="25" />
      </g>
    </svg>
  )
}

// ─── Scroll entrance ─────────────────────────────────────────────────────────

function useScrollEntrance() {
  useEffect(() => {
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.remove('opacity-0', 'translate-y-4')
          e.target.classList.add('animate-fade-up')
          io.unobserve(e.target)
        }
      }),
      { threshold: 0.07, rootMargin: '0px 0px -24px 0px' }
    )
    document.querySelectorAll('[data-animate]').forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])
}

// ─── Tokens ───────────────────────────────────────────────────────────────────

const pill: React.CSSProperties = {
  background: 'rgba(139,92,246,0.1)',
  border: '1px solid rgba(139,92,246,0.22)',
  backdropFilter: 'blur(16px)',
}

const card: React.CSSProperties = {
  background: 'rgba(139,92,246,0.07)',
  border: '1px solid rgba(139,92,246,0.15)',
  backdropFilter: 'blur(24px) saturate(160%)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.35)',
}

const cardStrong: React.CSSProperties = {
  background: 'rgba(139,92,246,0.1)',
  border: '1px solid rgba(139,92,246,0.22)',
  backdropFilter: 'blur(24px) saturate(160%)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07), 0 12px 48px rgba(0,0,0,0.5)',
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar() {
  const [open, setOpen] = useState(false)
  const [up, setUp] = useState(false)
  useEffect(() => {
    const h = () => setUp(window.scrollY > 32)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="mx-auto max-w-7xl px-6 pt-3">
        <nav className="flex items-center justify-between rounded-2xl px-5 h-14 transition-all duration-300"
          style={{
            background: up ? 'rgba(6,4,15,0.92)' : 'rgba(6,4,15,0.5)',
            backdropFilter: 'blur(24px) saturate(180%)',
            border: `1px solid ${up ? 'rgba(139,92,246,0.18)' : 'rgba(139,92,246,0.08)'}`,
            boxShadow: up ? '0 4px 40px rgba(0,0,0,0.6)' : 'none',
          }}>
          <Link href="/" className="flex items-center gap-2.5">
            <Logo size={28} />
            <span className="text-sm font-black text-white tracking-tight">FlowBot</span>
          </Link>

          <div className="hidden md:flex items-center gap-7">
            {[['Recursos', '#recursos'], ['Exemplos', '#como-funciona'], ['Templates', '#templates'], ['Preços', '#precos']].map(([l, h]) => (
              <a key={h} href={h} className="text-sm text-zinc-400 hover:text-white transition-colors font-medium">{l}</a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition-colors px-3 py-2">Entrar</Link>
            <Link href="/login"
              className="text-sm font-bold text-white rounded-xl px-4 py-2 transition-all hover:scale-[1.03] hover:brightness-110"
              style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', boxShadow: '0 4px 16px rgba(139,92,246,0.4)' }}>
              Começar grátis
            </Link>
          </div>

          <button className="md:hidden p-1.5 text-zinc-400 hover:text-white" onClick={() => setOpen(v => !v)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        {open && (
          <div className="md:hidden mt-2 rounded-2xl p-4 space-y-1"
            style={{ background: 'rgba(6,4,15,0.96)', border: '1px solid rgba(139,92,246,0.15)', backdropFilter: 'blur(24px)' }}>
            {[['Recursos', '#recursos'], ['Exemplos', '#como-funciona'], ['Templates', '#templates'], ['Preços', '#precos']].map(([l, h]) => (
              <a key={h} href={h} onClick={() => setOpen(false)} className="block text-sm text-zinc-400 px-3 py-2.5 rounded-xl hover:text-white hover:bg-white/[0.04] transition-all">{l}</a>
            ))}
            <div className="pt-2 space-y-2">
              <Link href="/login" className="block text-center rounded-xl border py-2.5 text-sm text-zinc-300"
                style={{ borderColor: 'rgba(139,92,246,0.2)' }}>Entrar</Link>
              <Link href="/login" className="block text-center rounded-xl py-2.5 text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)' }}>Começar grátis</Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

// ─── Phone Mockup ─────────────────────────────────────────────────────────────

const QR = [1,0,1,1,0,1,0,1,0,1,0,0,1,0,1,0,1,1,0,0,1,0,0,1,0,1,1,0,0,1,1,0,1,0,1,1,0,1,0,0,1,1,0,1,0,0,1,0,1,0,0,1,1,0,1,1,0,1,0,0,1,0,1,1]

const MSGS = [
  { from: 'user', text: '/start', delay: '0.3s' },
  { from: 'bot', text: '👋 Olá! Acesso ao canal VIP.\nEscolha seu plano:', delay: '0.9s', btns: true },
  { from: 'user', text: '💎 30 dias — R$ 59,90', delay: '1.8s' },
  { from: 'bot', text: '⚡ Gerando PIX...', delay: '2.5s' },
  { from: 'bot', qr: true, delay: '3.1s' },
  { from: 'bot', text: '✅ Pago! Seu acesso:\nt.me/+canal_vip', delay: '4.2s' },
] as const

function PhoneMockup() {
  return (
    <div className="relative mx-auto" style={{ width: 270, flexShrink: 0 }}>
      {/* Floating stat pills */}
      <div className="animate-float-a absolute -left-16 top-20 z-20 rounded-2xl px-3.5 py-2.5" style={cardStrong}>
        <p className="text-xl font-black text-white leading-none">+2.400</p>
        <p className="text-[10px] text-zinc-500 mt-0.5">bots criados</p>
      </div>
      <div className="animate-float-b absolute -right-14 top-40 z-20 rounded-2xl px-3.5 py-2.5" style={cardStrong}>
        <p className="text-xl font-black text-white leading-none">R$1,2M+</p>
        <p className="text-[10px] text-zinc-500 mt-0.5">em vendas</p>
      </div>
      <div className="animate-float-c absolute -left-14 bottom-36 z-20 rounded-2xl px-3.5 py-2.5" style={cardStrong}>
        <p className="text-xl font-black text-white leading-none">5 min</p>
        <p className="text-[10px] text-zinc-500 mt-0.5">para começar</p>
      </div>

      {/* Phone frame */}
      <div className="animate-pulse-glow rounded-[38px] overflow-hidden"
        style={{ background: '#0c0918', border: '2px solid rgba(139,92,246,0.25)', boxShadow: '0 40px 100px rgba(0,0,0,0.8), 0 0 80px rgba(139,92,246,0.12)' }}>
        {/* Notch */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-24 h-5 rounded-full" style={{ background: '#060410' }} />
        </div>
        {/* Chat header */}
        <div className="flex items-center gap-2 px-4 py-2"
          style={{ background: 'rgba(139,92,246,0.07)', borderBottom: '1px solid rgba(139,92,246,0.1)' }}>
          <div className="flex h-7 w-7 items-center justify-center rounded-full shrink-0"
            style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)' }}>
            <Bot className="h-3.5 w-3.5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white leading-none truncate">FlowBot Sales</p>
            <div className="flex items-center gap-1 mt-0.5">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-[9px] text-emerald-400">online agora</span>
            </div>
          </div>
        </div>
        {/* Messages */}
        <div className="px-3 py-3 space-y-2.5 min-h-[340px]" style={{ background: '#080615' }}>
          {MSGS.map((m, i) => (
            <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}
              style={{ animation: 'fade-in-up 0.4s ease-out forwards', animationDelay: m.delay, opacity: 0 }}>
              {'qr' in m && m.qr ? (
                <div className="rounded-xl p-2" style={{ background: 'rgba(139,92,246,0.09)', border: '1px solid rgba(139,92,246,0.18)' }}>
                  <div className="inline-block p-1.5 rounded" style={{ background: '#fff' }}>
                    <svg viewBox="0 0 8 8" width="60" height="60" shapeRendering="crispEdges">
                      {QR.map((f, j) => <rect key={j} x={j%8} y={Math.floor(j/8)} width="1" height="1" fill={f?'#06040f':'#fff'}/>)}
                    </svg>
                  </div>
                  <p className="text-[9px] text-zinc-600 mt-1 text-center">PIX copia e cola</p>
                </div>
              ) : m.from === 'user' ? (
                <div className="rounded-2xl rounded-br-sm px-3 py-1.5 max-w-[78%] text-xs text-white"
                  style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)' }}>
                  {'text' in m && m.text}
                </div>
              ) : (
                <div className="rounded-2xl rounded-bl-sm px-3 py-2 max-w-[84%] text-xs"
                  style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.16)', color: '#e2e8f0' }}>
                  {'text' in m && <p style={{ whiteSpace: 'pre-line', fontSize: 11 }}>{m.text}</p>}
                  {'btns' in m && m.btns && (
                    <div className="mt-2 space-y-1">
                      {['🔥 7 dias — R$ 24,90','💎 30 dias — R$ 59,90','👑 90 dias — R$ 139,90'].map(b => (
                        <div key={b} className="rounded-lg px-2 py-1.5 text-[10px] font-semibold text-center text-violet-300"
                          style={{ border: '1px solid rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.1)' }}>{b}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        {/* Input bar */}
        <div className="px-3 py-2 flex items-center gap-2" style={{ borderTop: '1px solid rgba(139,92,246,0.08)', background: '#0c0918' }}>
          <div className="flex-1 rounded-full px-3 py-1.5 text-[10px] text-zinc-600"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            Mensagem
          </div>
          <div className="flex h-7 w-7 items-center justify-center rounded-full"
            style={{ background: 'rgba(139,92,246,0.2)' }}>
            <Send className="h-3 w-3 text-violet-400" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative overflow-hidden" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      {/* Orbs */}
      <div className="blob-1 absolute -top-40 right-[-20%] w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.22) 0%, transparent 60%)', filter: 'blur(90px)' }} />
      <div className="blob-2 absolute top-[30%] -left-32 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(109,40,217,0.15) 0%, transparent 65%)', filter: 'blur(80px)' }} />
      <div className="blob-3 absolute bottom-[-10%] right-[20%] w-[350px] h-[350px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(192,132,252,0.1) 0%, transparent 65%)', filter: 'blur(70px)' }} />

      {/* Flow lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.1 }} aria-hidden="true">
        <defs>
          <linearGradient id="hg" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
        {[10,22,34,46,58,70,82,93].map((y, i) => (
          <line key={i} x1="0%" y1={`${y}%`} x2="100%" y2={`${y}%`}
            stroke="url(#hg)" strokeWidth="0.7" strokeDasharray="45 200"
            style={{ animation: `flow-dash ${3+i*0.7}s linear infinite`, animationDelay: `${-i*1.2}s` }} />
        ))}
      </svg>

      <div className="relative z-10 mx-auto max-w-7xl px-6 w-full py-24">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-16 xl:gap-24 items-center">
          {/* Left — Copy */}
          <div className="max-w-2xl">
            {/* Social badge */}
            <div className="inline-flex items-center gap-2.5 rounded-full px-4 py-2 mb-8 animate-fade-up"
              style={pill}>
              <div className="flex -space-x-1.5">
                {['#8b5cf6','#6d28d9','#a855f7'].map((c,i) => (
                  <div key={i} className="h-5 w-5 rounded-full border-2 flex items-center justify-center text-[8px] font-bold text-white"
                    style={{ background: c, borderColor: '#06040f' }}>V</div>
                ))}
              </div>
              <span className="text-xs font-semibold text-zinc-300">+2.400 vendedores já usam o FlowBot</span>
            </div>

            {/* H1 */}
            <h1 className="font-black tracking-tight leading-[1.04] mb-6 animate-fade-up"
              style={{ fontSize: 'clamp(2.6rem,5.5vw,4.5rem)' }}>
              <span className="text-white block">Nunca mais perca</span>
              <span className="text-white block">uma venda por</span>
              <span className="text-flow-gradient block">não estar online.</span>
            </h1>

            <p className="text-lg text-zinc-400 leading-relaxed mb-10 animate-fade-up-delay" style={{ maxWidth: 560 }}>
              Crie um bot no Telegram que <strong className="text-zinc-200">responde, cobra no PIX e entrega o conteúdo sozinho</strong> — 24h por dia.
              Do cadastro à primeira venda automática em menos de 5 minutos.
            </p>

            <div className="flex flex-wrap gap-4 mb-10 animate-fade-up-delay">
              <Link href="/login"
                className="flex items-center gap-2.5 rounded-2xl px-8 py-4 text-base font-black text-white transition-all hover:scale-[1.03] hover:brightness-110"
                style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', boxShadow: '0 8px 32px rgba(139,92,246,0.5)' }}>
                <Rocket className="h-5 w-5" />
                Criar meu bot grátis
              </Link>
              <a href="#como-funciona"
                className="flex items-center gap-2 rounded-2xl px-7 py-4 text-base font-semibold text-zinc-300 transition-all hover:text-white"
                style={{ border: '1px solid rgba(139,92,246,0.2)', background: 'rgba(139,92,246,0.05)' }}>
                Ver como funciona <ChevronRight className="h-4 w-4" />
              </a>
            </div>

            <div className="flex flex-wrap gap-5 animate-fade-up-delay">
              {[
                [BadgeCheck, 'Sem cartão de crédito'],
                [Clock, 'Bot no ar em 5 minutos'],
                [Lock, 'Sem precisar programar'],
              ].map(([Icon, label], i) => {
                const I = Icon as React.ElementType
                return (
                  <div key={i} className="flex items-center gap-2 text-sm text-zinc-500">
                    <I className="h-4 w-4 text-emerald-500 shrink-0" />
                    {label as string}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right — Phone */}
          <div className="hidden lg:flex justify-center animate-fade-up-delay" style={{ paddingLeft: 64, paddingRight: 16 }}>
            <PhoneMockup />
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Marquee ─────────────────────────────────────────────────────────────────

function Marquee() {
  const items = [
    { icon: Zap, text: 'PIX automático' },
    { icon: Bot, text: 'Bot 24h no ar' },
    { icon: GitBranch, text: 'Editor drag-and-drop' },
    { icon: FlaskConical, text: 'Teste A/B' },
    { icon: Shield, text: 'Anti-vazamento' },
    { icon: Users, text: 'CRM integrado' },
    { icon: Share2, text: 'Programa de afiliados' },
    { icon: Globe, text: 'Links por país' },
    { icon: Layers, text: '6 templates prontos' },
    { icon: Banknote, text: 'Sem taxa por mensagem' },
  ]
  return (
    <div className="relative overflow-hidden py-4" style={{ background: '#0c0918', borderTop: '1px solid rgba(139,92,246,0.09)', borderBottom: '1px solid rgba(139,92,246,0.09)' }}>
      <div className="flex animate-marquee whitespace-nowrap" style={{ gap: '3rem' }}>
        {[...items, ...items].map((item, i) => {
          const Icon = item.icon
          return (
            <div key={i} className="inline-flex items-center gap-2.5 shrink-0">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg shrink-0"
                style={{ background: 'rgba(139,92,246,0.15)' }}>
                <Icon className="h-3.5 w-3.5 text-violet-400" />
              </div>
              <span className="text-sm font-medium text-zinc-400">{item.text}</span>
              <div className="h-1 w-1 rounded-full mx-6 shrink-0" style={{ background: 'rgba(139,92,246,0.4)' }} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Before / After ───────────────────────────────────────────────────────────

function BeforeAfter() {
  const before = [
    'Responde cada cliente manualmente no Telegram',
    'Perde venda toda vez que está dormindo ou ocupado',
    'Manda link de acesso um por um após o PIX',
    'Não sabe quem comprou, quanto gastou ou quando cancelou',
    'Uma hora trabalhando, uma hora parado',
  ]
  const after = [
    'Bot responde, apresenta planos e cobra no PIX sozinho',
    'Vende 24h por dia — inclusive de madrugada',
    'Acesso liberado automaticamente em segundos',
    'Painel com histórico completo de cada cliente',
    'Você trabalha uma vez e recebe para sempre',
  ]
  return (
    <section className="py-24" style={{ background: '#06040f' }}>
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-14" data-animate>
          <p className="text-xs font-bold uppercase tracking-widest text-violet-500 mb-3">A transformação</p>
          <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
            Chega de depender<br />de você estar online.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-0 rounded-3xl overflow-hidden" data-animate>
          {/* Before */}
          <div className="p-8 md:p-10"
            style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)' }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <XCircle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="font-black text-white">Sem automação</p>
                <p className="text-xs text-zinc-500">Como a maioria ainda faz</p>
              </div>
            </div>
            <ul className="space-y-4">
              {before.map((t, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full shrink-0 mt-0.5 flex items-center justify-center"
                    style={{ background: 'rgba(239,68,68,0.12)' }}>
                    <div className="h-1.5 w-1.5 rounded-full bg-red-400" />
                  </div>
                  <span className="text-sm text-zinc-400 leading-relaxed">{t}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* After */}
          <div className="p-8 md:p-10 md:border-l"
            style={{ background: 'rgba(139,92,246,0.07)', borderColor: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.15)' }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: 'rgba(139,92,246,0.18)', border: '1px solid rgba(139,92,246,0.3)' }}>
                <Zap className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <p className="font-black text-white">Com FlowBot</p>
                <p className="text-xs text-zinc-500">Como você vai trabalhar</p>
              </div>
            </div>
            <ul className="space-y-4">
              {after.map((t, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full shrink-0 mt-0.5 flex items-center justify-center"
                    style={{ background: 'rgba(139,92,246,0.2)' }}>
                    <Check className="h-3 w-3 text-violet-400" />
                  </div>
                  <span className="text-sm text-zinc-300 leading-relaxed">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Feature Rows ─────────────────────────────────────────────────────────────

function FeatureRow({
  tag, title, desc, bullets, visual, reverse = false, bg = '#06040f',
}: {
  tag: string; title: React.ReactNode; desc: string; bullets: string[]
  visual: React.ReactNode; reverse?: boolean; bg?: string
}) {
  return (
    <div className="py-24" style={{ background: bg }}>
      <div className="mx-auto max-w-7xl px-6">
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-16 items-center ${reverse ? 'lg:[&>*:first-child]:order-2' : ''}`}>
          <div data-animate className="opacity-0">
            <p className="text-xs font-bold uppercase tracking-widest text-violet-500 mb-4">{tag}</p>
            <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-5">{title}</h2>
            <p className="text-zinc-400 leading-relaxed mb-8">{desc}</p>
            <ul className="space-y-3 mb-10">
              {bullets.map((b, i) => (
                <li key={i} className="flex items-center gap-3 text-zinc-300 text-sm">
                  <div className="h-5 w-5 rounded-full shrink-0 flex items-center justify-center"
                    style={{ background: 'rgba(139,92,246,0.2)' }}>
                    <Check className="h-3 w-3 text-violet-400" />
                  </div>
                  {b}
                </li>
              ))}
            </ul>
            <Link href="/login"
              className="inline-flex items-center gap-2 text-sm font-bold text-violet-400 hover:text-violet-300 transition-colors group">
              Experimentar agora <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div data-animate className="opacity-0">{visual}</div>
        </div>
      </div>
    </div>
  )
}

// ─── Flow Editor Mock ─────────────────────────────────────────────────────────

function FlowEditorMock() {
  const nodes = [
    { x: 24, y: 12, border: '#a78bfa', icon: MessageSquare, label: '/start recebido', dot: '#a78bfa' },
    { x: 180, y: 90, border: '#c084fc', icon: GitBranch, label: 'Apresentar planos', dot: '#c084fc' },
    { x: 24, y: 168, border: '#34d399', icon: CreditCard, label: 'Gerar PIX', dot: '#34d399' },
    { x: 180, y: 248, border: '#34d399', icon: Send, label: 'Liberar acesso', dot: '#34d399' },
  ]
  return (
    <div className="rounded-2xl p-5 relative overflow-hidden" style={{ ...cardStrong, minHeight: 360 }}>
      <div className="flex items-center gap-1.5 mb-4">
        <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
        <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
        <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
        <span className="ml-2 text-[10px] text-zinc-600 font-mono">flow-editor — bot_vip.flow</span>
      </div>
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0, top: 40 }}>
        <defs>
          <marker id="arr" markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="auto">
            <path d="M0,0 L0,5 L5,2.5 z" fill="rgba(139,92,246,0.5)" />
          </marker>
        </defs>
        {['M 132 42 C 178 42 175 108 188 120','M 118 198 C 165 198 178 225 188 268','M 118 120 C 62 140 62 162 118 190'].map((d,i) => (
          <path key={i} d={d} stroke="rgba(139,92,246,0.3)" strokeWidth="1.5" fill="none" markerEnd="url(#arr)" />
        ))}
      </svg>
      <div className="relative" style={{ zIndex: 1, height: 310 }}>
        {nodes.map((n, i) => (
          <div key={i} className="absolute flex items-center gap-2 rounded-xl px-3 py-2"
            style={{ left: n.x, top: n.y, background: 'rgba(139,92,246,0.08)', border: `1px solid ${n.border}45`, minWidth: 148 }}>
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg" style={{ background: `${n.border}15` }}>
              <n.icon className="h-3 w-3" style={{ color: n.border }} />
            </div>
            <span className="text-[11px] font-semibold text-zinc-300 flex-1">{n.label}</span>
            <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: n.dot, boxShadow: `0 0 5px ${n.dot}` }} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── PIX Flow Visual ─────────────────────────────────────────────────────────

function PixFlowVisual() {
  const steps = [
    { icon: MessageSquare, label: 'Cliente escolhe o plano', color: '#a78bfa' },
    { icon: CreditCard, label: 'QR Code gerado na hora', color: '#8b5cf6' },
    { icon: BadgeCheck, label: 'PIX confirmado automaticamente', color: '#34d399' },
    { icon: Send, label: 'Acesso liberado em segundos', color: '#34d399' },
  ]
  return (
    <div className="rounded-2xl p-7 space-y-4" style={cardStrong}>
      <p className="text-xs font-bold uppercase tracking-widest text-violet-500 mb-2">Fluxo de pagamento</p>
      {steps.map((s, i) => (
        <div key={i}>
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ background: `${s.color}15`, border: `1px solid ${s.color}28` }}>
              <s.icon className="h-5 w-5" style={{ color: s.color }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-zinc-200">{s.label}</p>
            </div>
            <div className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: s.color, background: `${s.color}15` }}>
              {['Cliente','Bot','Gateway','Bot'][i]}
            </div>
          </div>
          {i < steps.length - 1 && (
            <div className="ml-5 mt-1 mb-1 w-px h-4" style={{ background: 'rgba(139,92,246,0.2)' }} />
          )}
        </div>
      ))}
      <div className="mt-4 rounded-xl p-4" style={{ background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.18)' }}>
        <div className="flex items-center gap-2.5">
          <BadgeCheck className="h-5 w-5 text-emerald-400 shrink-0" />
          <div>
            <p className="text-sm font-bold text-white">Zero intervenção manual</p>
            <p className="text-xs text-zinc-500 mt-0.5">Da cobrança à entrega, tudo automático</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── CRM Mock ────────────────────────────────────────────────────────────────

function CrmMock() {
  const customers = [
    { name: 'Ana S.', spent: 'R$239', status: 'ativo', risk: 'baixo', color: '#34d399' },
    { name: 'Bruno T.', spent: 'R$59', status: 'ativo', risk: 'alto', color: '#f87171' },
    { name: 'Carla M.', spent: 'R$418', status: 'ativo', risk: 'baixo', color: '#34d399' },
    { name: 'Diego F.', spent: 'R$119', status: 'expirado', risk: 'médio', color: '#fbbf24' },
  ]
  return (
    <div className="rounded-2xl overflow-hidden" style={cardStrong}>
      <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(139,92,246,0.12)' }}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-white">CRM — Clientes</p>
          <span className="text-xs text-violet-400 font-semibold">4 ativos</span>
        </div>
      </div>
      <div className="p-4 grid grid-cols-3 gap-3 mb-3" style={{ borderBottom: '1px solid rgba(139,92,246,0.08)' }}>
        {[['R$835', 'Total recebido'], ['87%', 'Taxa de retenção'], ['2', 'Risco de cancelar']].map(([n, l]) => (
          <div key={l} className="rounded-xl p-3 text-center" style={{ background: 'rgba(139,92,246,0.08)' }}>
            <p className="text-lg font-black text-flow-gradient">{n}</p>
            <p className="text-[10px] text-zinc-500 mt-0.5 leading-tight">{l}</p>
          </div>
        ))}
      </div>
      <div className="px-4 pb-4 space-y-2">
        {customers.map((c, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2.5"
            style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-black text-white shrink-0"
              style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)' }}>
              {c.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white leading-none">{c.name}</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">{c.spent} gastos</p>
            </div>
            <div className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
              style={{ color: c.color, background: `${c.color}14` }}>
              {c.risk} risco
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Features Sections ────────────────────────────────────────────────────────

function Features() {
  return (
    <section id="recursos">
      <FeatureRow
        tag="Editor Visual"
        title={<>Monte qualquer roteiro de venda.<br /><span className="text-flow-gradient">Arrastando blocos.</span></>}
        desc="Nada de programar. Você cria a jornada do cliente conectando blocos visuais: mensagem de boas-vindas, apresentação dos planos, cobrança no PIX e entrega do acesso. Tudo visível na tela."
        bullets={[
          'Drag-and-drop igual ao N8N, mas focado em vendas',
          'Condições, bifurcações e delays configuráveis',
          'Veja o fluxo completo antes de publicar',
        ]}
        visual={<FlowEditorMock />}
        bg="#06040f"
      />
      <FeatureRow
        tag="PIX Automático"
        title={<>Cobrou. Confirmou.<br /><span className="text-flow-gradient">Entregou. Tudo sozinho.</span></>}
        desc="Seu bot gera o QR Code, aguarda a confirmação do gateway e libera o acesso imediatamente. Sem você tocar em nada. O cliente paga às 3h da manhã e o bot entrega na hora."
        bullets={[
          'QR Code e copia-e-cola gerados automaticamente',
          'Confirmação instantânea via AmloPay',
          'Entrega de link ou credenciais sem intervalo',
        ]}
        visual={<PixFlowVisual />}
        reverse
        bg="#0c0918"
      />
      <FeatureRow
        tag="CRM & Inteligência"
        title={<>Saiba exatamente<br /><span className="text-flow-gradient">quem são seus clientes.</span></>}
        desc="Painel com histórico de compras, total gasto por cliente, data de vencimento e alerta de quem está prestes a cancelar. Envie uma oferta de retenção antes que ele vá embora."
        bullets={[
          'Total gasto e histórico de cada assinante',
          'Alerta de risco de cancelamento',
          'Tags, notas e segmentação por comportamento',
        ]}
        visual={<CrmMock />}
        bg="#06040f"
      />
    </section>
  )
}

// ─── More Features Grid ───────────────────────────────────────────────────────

function MoreFeatures() {
  const items = [
    { icon: FlaskConical, color: '#c084fc', title: 'Teste qual versão vende mais', desc: 'Dois roteiros diferentes, tráfego dividido 50/50. O painel mostra qual converte mais — você desativa o pior.' },
    { icon: Shield, color: '#60a5fa', title: 'Conteúdo que não vaza', desc: 'Ative a proteção e ninguém consegue salvar, copiar ou encaminhar o que está no seu canal.' },
    { icon: Share2, color: '#a78bfa', title: 'Afiliados com comissão automática', desc: 'Transforme compradores em divulgadores. Cada um tem um link rastreado e recebe sua % na hora.' },
    { icon: Globe, color: '#67e8f9', title: 'Links inteligentes por país', desc: 'Visitantes de países diferentes vão para destinos diferentes. Protege seu tráfego pago de anúncios.' },
  ]
  return (
    <div className="py-20" style={{ background: '#0c0918' }}>
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-violet-500 mb-3">E mais</p>
          <h2 className="text-2xl md:text-3xl font-black text-white">Mais recursos que fazem diferença</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((f, i) => (
            <div key={i} data-animate className="opacity-0 rounded-2xl p-5 transition-all hover:scale-[1.01]" style={card}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl mb-4"
                style={{ background: `${f.color}14`, border: `1px solid ${f.color}28` }}>
                <f.icon className="h-5 w-5" style={{ color: f.color }} />
              </div>
              <h3 className="font-bold text-white text-sm mb-2 leading-snug">{f.title}</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── How It Works ─────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    { n: '01', icon: PlusCircle, title: 'Conecte seu bot do Telegram', desc: 'Crie um bot pelo BotFather, cole o token no FlowBot e escolha um template de nicho. 3 minutos.' },
    { n: '02', icon: GitBranch, title: 'Monte o roteiro de vendas', desc: 'Arraste os blocos no editor visual: boas-vindas, planos, PIX e entrega do acesso. Sem código.' },
    { n: '03', icon: TrendingUp, title: 'Ative e acompanhe as vendas', desc: 'Seu bot começa a vender imediatamente. Acompanhe conversões, receita e churn no painel.' },
  ]
  return (
    <section id="como-funciona" className="py-24" style={{ background: '#06040f' }}>
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-widest text-violet-500 mb-3">Simples assim</p>
          <h2 className="text-3xl md:text-4xl font-black text-white">3 passos. Bot vendendo.</h2>
          <p className="mt-4 text-zinc-400 max-w-xl mx-auto">Do cadastro à primeira venda automática em menos de 10 minutos.</p>
        </div>
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="hidden md:block absolute top-10 left-[20%] right-[20%] h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.3), transparent)' }} />
          {steps.map((s, i) => (
            <div key={i} data-animate className="opacity-0 text-center relative">
              <div className="relative inline-flex h-20 w-20 items-center justify-center rounded-2xl mb-6"
                style={cardStrong}>
                <s.icon className="h-9 w-9 text-violet-400" />
                <span className="absolute -top-3 -right-3 flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-black text-white"
                  style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)' }}>{s.n}</span>
              </div>
              <h3 className="text-base font-bold text-white mb-3">{s.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed max-w-xs mx-auto">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Templates ────────────────────────────────────────────────────────────────

function Templates() {
  const list = [
    { emoji: '🔥', name: 'Canal Hot', niche: 'Conteúdo Adulto', tips: ['Anti-vazamento ativo', 'Planos semanal, mensal, trimestral', 'Expulsão automática'] },
    { emoji: '👑', name: 'Grupo VIP', niche: 'Conteúdo Exclusivo', tips: ['Qualquer nicho', 'Renovação com desconto', 'Funil de apresentação'] },
    { emoji: '📺', name: 'Streaming', niche: 'Revenda de Contas', tips: ['Estoque gerenciado', 'Entrega imediata', 'Sem intervenção manual'] },
    { emoji: '💻', name: 'Software', niche: 'Revenda de Contas', tips: ['Login+senha pelo bot', 'Planos recorrentes', 'Reposição fácil'] },
    { emoji: '🎓', name: 'Curso Online', niche: 'Infoproduto', tips: ['Qualifica antes do preço', 'Acesso vitalício', 'Link externo'] },
    { emoji: '⚡', name: 'Mentoria', niche: 'Serviços', tips: ['Funil consultivo', 'Cobrança recorrente', 'Direciona para WhatsApp'] },
  ]
  return (
    <section id="templates" className="py-24" style={{ background: '#0c0918' }}>
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-violet-500 mb-3">Templates prontos</p>
          <h2 className="text-3xl md:text-4xl font-black text-white">Pronto para qualquer nicho.</h2>
          <p className="mt-4 text-zinc-400 max-w-xl mx-auto">Escolha um template, edite os textos e os preços. Isso é tudo.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {list.map((t, i) => (
            <div key={i} data-animate className="opacity-0 rounded-2xl p-6 flex flex-col transition-all hover:scale-[1.01]" style={card}>
              <div className="flex items-start gap-4 mb-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl text-xl shrink-0"
                  style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)' }}>
                  {t.emoji}
                </div>
                <div>
                  <h3 className="font-bold text-white leading-none">{t.name}</h3>
                  <p className="text-xs text-violet-400 mt-1">{t.niche}</p>
                </div>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {t.tips.map((tip, j) => (
                  <li key={j} className="flex items-center gap-2 text-xs text-zinc-500">
                    <Check className="h-3 w-3 text-emerald-500 shrink-0" />{tip}
                  </li>
                ))}
              </ul>
              <Link href="/login"
                className="block text-center rounded-xl py-2.5 text-sm font-bold text-violet-400 transition-all hover:text-white hover:bg-violet-500/10"
                style={{ border: '1px solid rgba(139,92,246,0.25)' }}>
                Usar template
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Social Proof Numbers ─────────────────────────────────────────────────────

function BigNumbers() {
  const stats = [
    { n: '+2.400', l: 'bots criados', sub: 'em todos os nichos' },
    { n: 'R$1,2M+', l: 'em vendas geradas', sub: 'pelos nossos usuários' },
    { n: '99,9%', l: 'uptime garantido', sub: 'nos últimos 12 meses' },
    { n: '5 min', l: 'para o primeiro bot', sub: 'do zero ao ar' },
  ]
  return (
    <section className="py-24 relative overflow-hidden" style={{ background: '#110e20' }}>
      <div className="blob-1 absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 50% 50%, rgba(139,92,246,0.12) 0%, transparent 60%)', filter: 'blur(60px)' }} />
      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s, i) => (
            <div key={i} data-animate className="opacity-0">
              <p className="text-flow-gradient font-black mb-1" style={{ fontSize: 'clamp(2rem,4vw,3rem)' }}>{s.n}</p>
              <p className="font-bold text-white text-sm">{s.l}</p>
              <p className="text-zinc-600 text-xs mt-1">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

function Testimonials() {
  // TODO: substituir por depoimentos reais
  const list = [
    { quote: 'Criei meu primeiro bot em 8 minutos. Na mesma semana já tinha vendas automáticas acontecendo enquanto eu dormia.', name: 'Carlos M.', niche: 'Conteúdo Digital', initials: 'CM' },
    { quote: 'O teste A/B mostrou que meu roteiro consultivo convertia 34% a mais. Sem o painel eu nunca saberia.', name: 'Rafaela T.', niche: 'Infoprodutos', initials: 'RT' },
    { quote: 'Migrei em um dia. O editor visual é mais rápido e o PIX cai certinho sem precisar monitorar nada.', name: 'Lucas A.', niche: 'Streaming', initials: 'LA' },
  ]
  return (
    <section className="py-24" style={{ background: '#06040f' }}>
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-black text-white">Quem já usa não volta para o manual</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {list.map((t, i) => (
            <div key={i} data-animate className="opacity-0 rounded-2xl p-7 flex flex-col" style={card}>
              <div className="flex gap-0.5 mb-5">
                {Array(5).fill(0).map((_,j) => <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-zinc-300 text-sm leading-relaxed flex-1 mb-6">"{t.quote}"</p>
              <div className="flex items-center gap-3 pt-5" style={{ borderTop: '1px solid rgba(139,92,246,0.1)' }}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
                  style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)' }}>{t.initials}</div>
                <div>
                  <p className="text-sm font-bold text-white">{t.name}</p>
                  <p className="text-xs text-zinc-500">{t.niche}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Pricing ─────────────────────────────────────────────────────────────────

function Pricing() {
  const features = [
    'Bots ilimitados',
    'Todos os tipos de fluxo',
    'Teste A/B de roteiros',
    'PIX automático (AmloPay)',
    'Histórico completo de clientes',
    'Programa de afiliados',
    'Links inteligentes por país',
    '6 templates inclusos',
    'Transmissões segmentadas',
    'Suporte prioritário',
  ]
  return (
    <section id="precos" className="py-24 relative overflow-hidden" style={{ background: '#0c0918' }}>
      <div className="blob-2 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 60%)', filter: 'blur(80px)' }} />
      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-violet-500 mb-3">Preço</p>
          <h2 className="text-3xl md:text-4xl font-black text-white">Um plano. Acesso a tudo.</h2>
          <p className="mt-4 text-zinc-400 max-w-lg mx-auto">Sem limite de bots, sem taxa por mensagem. Pague uma vez e use tudo.</p>
        </div>
        <div className="max-w-sm mx-auto">
          <div data-animate className="opacity-0 rounded-3xl p-8 relative"
            style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.28)', boxShadow: '0 0 100px rgba(139,92,246,0.15), inset 0 1px 0 rgba(255,255,255,0.06)' }}>
            <div className="absolute top-0 left-6 right-6 h-px rounded-full"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.8), transparent)' }} />
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold text-violet-300 mb-5" style={pill}>
                <BadgeCheck className="h-3.5 w-3.5" /> Acesso Completo
              </div>
              <div className="flex items-baseline justify-center gap-2.5 mb-1">
                <span className="text-zinc-600 line-through text-lg">R$ 197</span>
                <span className="text-white font-black" style={{ fontSize: '3.5rem', lineHeight: 1 }}>R$ 97</span>
              </div>
              <p className="text-zinc-500 text-sm">/mês</p>
            </div>
            <ul className="space-y-3 mb-8">
              {features.map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />{f}
                </li>
              ))}
            </ul>
            <Link href="/login"
              className="block text-center rounded-2xl py-4 text-base font-black text-white mb-4 transition-all hover:scale-[1.02] hover:brightness-110"
              style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', boxShadow: '0 8px 28px rgba(139,92,246,0.5)' }}>
              Começar agora — R$ 97/mês
            </Link>
            <p className="text-center text-xs text-zinc-600">Cancele quando quiser. Sem fidelidade.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

function FAQ() {
  const [open, setOpen] = useState<number | null>(null)
  const items = [
    { q: 'Preciso saber programar para usar o FlowBot?', a: 'Não. O editor é drag-and-drop — você arrasta blocos para montar o roteiro de vendas. Se sabe usar WhatsApp, sabe usar o FlowBot.' },
    { q: 'Quanto tempo leva para o bot entrar no ar?', a: 'Em média 5 minutos. Escolha um template, configure os planos, cole o token do Telegram e pronto — seu bot já aceita pedidos.' },
    { q: 'O PIX é confiável? Cai na hora?', a: 'Sim. Usamos a AmloPay, especializada em pagamentos para Telegram. A confirmação é instantânea e o acesso é liberado automaticamente na sequência.' },
    { q: 'Posso vender qualquer produto digital?', a: 'Qualquer produto digital: acesso a canal ou grupo, contas de streaming, softwares, cursos, mentorias. O bot entrega links ou credenciais automaticamente após o pagamento.' },
    { q: 'O que é o teste A/B?', a: 'Você cria dois roteiros de venda diferentes e o bot divide o tráfego 50/50 entre eles. Depois de alguns dias, o painel mostra qual converte mais e você desativa o pior.' },
    { q: 'Tem suporte?', a: 'Sim, via Telegram. Retorno em até 4 horas nos dias úteis. Clientes com plano ativo têm prioridade.' },
  ]
  return (
    <section id="faq" className="py-24" style={{ background: '#06040f' }}>
      <div className="mx-auto max-w-2xl px-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-black text-white">Dúvidas frequentes</h2>
        </div>
        <div className="space-y-2.5">
          {items.map((item, i) => (
            <div key={i} data-animate className="opacity-0 rounded-2xl overflow-hidden" style={card}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left gap-4 hover:bg-white/[0.02] transition-colors">
                <span className="text-sm font-semibold text-white">{item.q}</span>
                <ChevronDown className="h-4 w-4 text-violet-500 shrink-0 transition-transform duration-200"
                  style={{ transform: open === i ? 'rotate(180deg)' : 'none' }} />
              </button>
              <div style={{ maxHeight: open === i ? 200 : 0, overflow: 'hidden', transition: 'max-height 0.25s ease' }}>
                <p className="px-5 pb-4 text-sm text-zinc-400 leading-relaxed">{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Footer CTA ───────────────────────────────────────────────────────────────

function FooterCTA() {
  return (
    <section className="relative py-32 overflow-hidden" style={{ background: '#110e20' }}>
      <div className="blob-1 absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(139,92,246,0.18) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-violet-500 mb-5">Comece hoje</p>
        <h2 className="font-black text-white leading-tight mb-5" style={{ fontSize: 'clamp(2rem,5vw,3.5rem)' }}>
          Seu próximo cliente vai comprar<br />
          <span className="text-flow-gradient">sem você fazer nada.</span>
        </h2>
        <p className="text-zinc-400 mb-10 text-lg max-w-xl mx-auto">Configure uma vez. Venda para sempre. O bot trabalha enquanto você vive.</p>
        <Link href="/login"
          className="inline-flex items-center gap-3 rounded-2xl px-10 py-5 text-lg font-black text-white transition-all hover:scale-[1.03] hover:brightness-110"
          style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', boxShadow: '0 12px 48px rgba(139,92,246,0.55)' }}>
          <Rocket className="h-6 w-6" /> Criar meu bot grátis agora
        </Link>
        <p className="mt-5 text-sm text-zinc-600">Sem cartão de crédito. Bot no ar em 5 minutos.</p>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="py-14" style={{ background: '#06040f', borderTop: '1px solid rgba(139,92,246,0.08)' }}>
      <div className="mx-auto max-w-7xl px-6 grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2.5 mb-3">
            <Logo size={26} />
            <span className="text-sm font-black text-white">FlowBot</span>
          </div>
          <p className="text-xs text-zinc-600 leading-relaxed max-w-[180px]">Automação de vendas para o Telegram. Rápido, seguro e sem código.</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-4">Produto</p>
          <div className="space-y-2.5">
            {[['Recursos','#recursos'],['Templates','#templates'],['Como funciona','#como-funciona'],['Preços','#precos']].map(([l,h]) => (
              <a key={h} href={h} className="block text-sm text-zinc-500 hover:text-white transition-colors">{l}</a>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-4">Legal</p>
          <div className="space-y-2.5">
            {[['Termos de uso','#'],['Política de privacidade','#'],['Contato','#']].map(([l,h]) => (
              <a key={l} href={h} className="block text-sm text-zinc-500 hover:text-white transition-colors">{l}</a>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-4">Contato</p>
          <div className="space-y-3">
            <a href="https://t.me/flowbot_suporte" className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors">
              <Send className="h-3.5 w-3.5 text-violet-500 shrink-0" /> Telegram
            </a>
            <a href="mailto:contato@flowbot.com.br" className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors">
              <Mail className="h-3.5 w-3.5 text-purple-500 shrink-0" /> E-mail
            </a>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-3 pt-8"
        style={{ borderTop: '1px solid rgba(139,92,246,0.07)' }}>
        <p className="text-xs text-zinc-700">© {new Date().getFullYear()} FlowBot. Todos os direitos reservados.</p>
        <p className="text-xs text-zinc-700">Feito com <Zap className="inline h-3 w-3 text-violet-700" /> no Brasil</p>
      </div>
    </footer>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function LandingPage() {
  useScrollEntrance()
  return (
    <main style={{ background: 'var(--background)' }}>
      <Navbar />
      <Hero />
      <Marquee />
      <BeforeAfter />
      <Features />
      <MoreFeatures />
      <HowItWorks />
      <Templates />
      <BigNumbers />
      <Testimonials />
      <Pricing />
      <FAQ />
      <FooterCTA />
      <Footer />
    </main>
  )
}
