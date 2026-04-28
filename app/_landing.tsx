'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Zap, ChevronRight, CheckCircle2, XCircle, AlertTriangle, TrendingDown,
  Bot, BarChart3, GitBranch, FlaskConical, CreditCard, Shield, Users, Globe,
  PlusCircle, TrendingUp, MessageSquare, Send, ArrowDown, Share2, Percent,
  BarChart2, DollarSign, Tag, FileText, Star, ChevronDown, Check, Mail,
  Rocket, Menu, X,
} from 'lucide-react'

// ─── Scroll entrance ────────────────────────────────────────────────────────────

function useScrollEntrance() {
  useEffect(() => {
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.remove('opacity-0')
          e.target.classList.add('animate-fade-up')
          io.unobserve(e.target)
        }
      }),
      { threshold: 0.1, rootMargin: '0px 0px -32px 0px' }
    )
    document.querySelectorAll('[data-animate]').forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])
}

// ─── Shared primitives ──────────────────────────────────────────────────────────

const glass = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }
const glassHover = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }

function SectionBadge({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold text-blue-400 mb-6"
      style={{ borderColor: 'rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.08)' }}>
      <Icon className="h-3.5 w-3.5" />{children}
    </div>
  )
}

function SectionHeader({ badge, badgeIcon, title, subtitle, center = true }: {
  badge?: string; badgeIcon?: React.ElementType; title: React.ReactNode; subtitle?: string; center?: boolean
}) {
  return (
    <div className={`mb-16 ${center ? 'text-center' : ''}`}>
      {badge && badgeIcon && <div className={center ? 'flex justify-center' : ''}><SectionBadge icon={badgeIcon}>{badge}</SectionBadge></div>}
      <h2 className="text-3xl md:text-4xl font-black text-white leading-tight tracking-tight">{title}</h2>
      {subtitle && <p className="mt-4 text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">{subtitle}</p>}
    </div>
  )
}

// ─── Navbar ─────────────────────────────────────────────────────────────────────

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <nav className="sticky top-0 z-50 w-full"
      style={{ background: 'rgba(7,7,26,0.8)', backdropFilter: 'blur(18px)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="mx-auto max-w-7xl px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-black text-white tracking-tight">FlowBot</span>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {[['Recursos', '#recursos'], ['Como funciona', '#como-funciona'], ['Templates', '#templates'], ['Preços', '#precos']].map(([l, h]) => (
            <a key={h} href={h} className="text-sm text-zinc-400 hover:text-white transition-colors font-medium">{l}</a>
          ))}
        </div>

        {/* CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition-colors font-medium px-4 py-2">Entrar</Link>
          <Link href="/login"
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all hover:scale-[1.02]"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', boxShadow: '0 4px 16px rgba(59,130,246,0.35)' }}>
            Começar grátis
          </Link>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden p-2 text-zinc-400 hover:text-white" onClick={() => setMobileOpen(v => !v)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden px-6 pb-6 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {[['Recursos', '#recursos'], ['Como funciona', '#como-funciona'], ['Templates', '#templates'], ['Preços', '#precos']].map(([l, h]) => (
            <a key={h} href={h} onClick={() => setMobileOpen(false)} className="block text-sm text-zinc-400 py-2 hover:text-white transition-colors">{l}</a>
          ))}
          <div className="pt-2 flex flex-col gap-2">
            <Link href="/login" className="text-center rounded-xl border border-white/10 py-2.5 text-sm text-zinc-300 font-medium">Entrar</Link>
            <Link href="/login" className="text-center rounded-xl py-2.5 text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>Começar grátis</Link>
          </div>
        </div>
      )}
    </nav>
  )
}

// ─── Bot Simulation ─────────────────────────────────────────────────────────────

const QR_PATTERN = [1,0,1,1,0,1,0,1,0,1,0,0,1,0,1,0,1,1,0,0,1,0,0,1,0,1,1,0,0,1,1,0,1,0,1,1,0,1,0,0,1,1,0,1,0,0,1,0,1,0,0,1,1,0,1,1,0,1,0,0,1,0,1,1]

function QRPlaceholder() {
  return (
    <div className="inline-block p-2 rounded-lg" style={{ background: '#fff' }}>
      <svg viewBox="0 0 8 8" width="72" height="72" shapeRendering="crispEdges">
        {QR_PATTERN.map((fill, i) => (
          <rect key={i} x={i % 8} y={Math.floor(i / 8)} width="1" height="1" fill={fill ? '#1a1a2e' : '#fff'} />
        ))}
      </svg>
    </div>
  )
}

const SIM_MESSAGES = [
  { from: 'user', text: '/start', delay: '0.4s' },
  { from: 'bot', text: '🔥 Olá! Acesso VIP ao canal privado.\n\nConteúdo exclusivo, atualizado toda semana. Escolha seu plano:', delay: '1.0s', hasButtons: true },
  { from: 'user', text: '💎 30 dias — R$ 59,90', delay: '2.0s' },
  { from: 'bot', text: '⚡ Gerando seu PIX...', delay: '2.7s' },
  { from: 'bot', isQR: true, delay: '3.3s' },
  { from: 'bot', text: '✅ Pagamento confirmado!\n\nSeu link exclusivo:\nt.me/+canal_vip_xyz\n\n⚠️ Link único — não compartilhe', delay: '4.4s' },
] as const

function BotSimulation() {
  return (
    <div className="animate-pulse-glow rounded-2xl overflow-hidden w-full max-w-sm mx-auto"
      style={{ background: '#0e1120', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
      {/* Window bar */}
      <div className="flex items-center gap-2 px-4 py-3" style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-500/70" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
          <div className="h-3 w-3 rounded-full bg-green-500/70" />
        </div>
        <div className="flex items-center gap-2 ml-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
            <Bot className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white leading-none">FlowBot Sales</p>
            <div className="flex items-center gap-1 mt-0.5">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 4px rgba(52,211,153,0.8)' }} />
              <span className="text-[10px] text-emerald-400">online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="p-4 space-y-3 min-h-[360px]" style={{ background: '#0a0d1a' }}>
        {SIM_MESSAGES.map((msg, i) => (
          <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
            style={{ animation: 'fade-in-up 0.4s ease-out forwards', animationDelay: msg.delay, opacity: 0 }}>
            {'isQR' in msg && msg.isQR ? (
              <div className="rounded-2xl rounded-bl-sm p-3" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <QRPlaceholder />
                <p className="text-[10px] text-zinc-500 mt-2 text-center">Pix copia e cola abaixo</p>
              </div>
            ) : msg.from === 'user' ? (
              <div className="rounded-2xl rounded-br-sm px-3.5 py-2 max-w-[75%] text-sm text-white"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #4f46e5)' }}>
                {'text' in msg && msg.text}
              </div>
            ) : (
              <div className="rounded-2xl rounded-bl-sm px-3.5 py-2.5 max-w-[82%] text-sm"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }}>
                {'text' in msg && <p style={{ whiteSpace: 'pre-line' }}>{msg.text}</p>}
                {'hasButtons' in msg && msg.hasButtons && (
                  <div className="mt-3 space-y-1.5">
                    {['🔥 7 dias — R$ 24,90', '💎 30 dias — R$ 59,90', '👑 90 dias — R$ 139,90'].map(b => (
                      <div key={b} className="rounded-xl px-3 py-2 text-xs font-semibold text-center text-blue-300"
                        style={{ border: '1px solid rgba(96,165,250,0.35)', background: 'rgba(96,165,250,0.08)' }}>{b}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Hero ────────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Blobs */}
      <div className="blob-1 absolute top-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      <div className="blob-2 absolute top-0 right-0 w-[420px] h-[420px] rounded-full pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      <div className="blob-3 absolute bottom-0 left-1/2 w-[360px] h-[360px] rounded-full pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', filter: 'blur(60px)' }} />

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">
        {/* Left */}
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold text-blue-400 mb-8 animate-fade-up"
            style={{ borderColor: 'rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.08)' }}>
            <Zap className="h-3.5 w-3.5" />
            Automação de vendas para o Telegram
          </div>

          <h1 className="text-5xl lg:text-[68px] font-black leading-[1.04] tracking-tight mb-6 animate-fade-up">
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-blue-300 bg-clip-text text-transparent">
              Venda no automático.
            </span>
            <br />
            <span className="text-white">Qualquer nicho.</span>
            <br />
            <span className="text-white">Resultado real.</span>
          </h1>

          <p className="text-lg text-zinc-400 leading-relaxed max-w-lg mb-10 animate-fade-up-delay">
            FlowBot cria seu bot de vendas no Telegram em minutos — com PIX automático, entrega de conteúdo e CRM integrado. Sem precisar de programador.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-10 animate-fade-up-delay">
            <Link href="/login"
              className="flex items-center justify-center gap-2.5 rounded-2xl px-8 py-3.5 text-base font-bold text-white transition-all hover:scale-[1.03] hover:shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', boxShadow: '0 8px 32px rgba(59,130,246,0.4)' }}>
              <Rocket className="h-5 w-5" />
              Criar meu bot grátis
            </Link>
            <a href="#como-funciona"
              className="flex items-center justify-center gap-2 rounded-2xl px-8 py-3.5 text-base font-semibold text-zinc-300 transition-all hover:text-white"
              style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)' }}>
              Ver como funciona <ChevronRight className="h-4 w-4" />
            </a>
          </div>

          {/* Trust */}
          <div className="flex flex-wrap gap-5 animate-fade-up-delay">
            {['Sem cartão de crédito', 'Configurado em 5 minutos', 'Suporte incluído'].map(t => (
              <div key={t} className="flex items-center gap-2 text-sm text-zinc-500">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* Right — Bot Simulation */}
        <div className="flex justify-center lg:justify-end animate-fade-up-delay">
          <BotSimulation />
        </div>
      </div>
    </section>
  )
}

// ─── Social Proof ────────────────────────────────────────────────────────────────

function SocialProof() {
  const stats = [
    { n: '+2.400', l: 'bots criados' },
    { n: 'R$ 1,2M+', l: 'em vendas processadas' },
    { n: '99,9%', l: 'uptime garantido' },
    { n: '< 5 min', l: 'para criar seu bot' },
  ]
  return (
    <section style={{ background: '#0a0a1f', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      className="py-14">
      <div className="mx-auto max-w-7xl px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {stats.map((s, i) => (
          <div key={i} data-animate className="opacity-0">
            <p className="text-4xl font-black bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">{s.n}</p>
            <p className="mt-1.5 text-sm text-zinc-500">{s.l}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Problem → Solution ──────────────────────────────────────────────────────────

function ProblemSolution() {
  const pains = [
    { icon: XCircle, color: '#f87171', title: 'Responde cliente manualmente', desc: 'Cada venda depende de você estar online. Perde pedido quando dorme, viaja ou está ocupado.' },
    { icon: AlertTriangle, color: '#fbbf24', title: 'PIX caído, sem entrega automática', desc: 'Recebe o pagamento e precisa enviar o link ou conta na mão. Um por um. Sempre você.' },
    { icon: TrendingDown, color: '#f87171', title: 'Sem dados, sem controle', desc: 'Sem CRM, sem histórico, sem métricas. Não tem como crescer o que você não consegue medir.' },
  ]
  const solutions = [
    { icon: Bot, color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', title: 'Bot que vende enquanto você dorme', desc: 'Responde, apresenta planos, cobra no PIX e entrega o acesso — 100% automático, 24h por dia.' },
    { icon: Zap, color: '#34d399', bg: 'rgba(52,211,153,0.1)', title: 'PIX + entrega em segundos', desc: 'Pagamento confirmado → bot envia o link ou as credenciais na hora. Zero intervenção manual.' },
    { icon: BarChart3, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', title: 'CRM com LTV e churn score', desc: 'Veja quanto cada cliente já gastou, quando foi a última compra e quem está prestes a cancelar.' },
  ]

  return (
    <section id="como-funciona" className="py-28" style={{ background: '#07071a' }}>
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-white">Você ainda perde vendas assim?</h2>
          <p className="mt-3 text-zinc-400">Reconhece algum desses cenários?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          {pains.map((p, i) => (
            <div key={i} data-animate className="opacity-0 rounded-2xl p-6 transition-all" style={glass}>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl mb-4"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <p.icon className="h-5 w-5" style={{ color: p.color }} />
              </div>
              <h3 className="font-bold text-white mb-2">{p.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-center mb-14">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <ArrowDown className="h-5 w-5 text-blue-400" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {solutions.map((s, i) => (
            <div key={i} data-animate className="opacity-0 rounded-2xl p-6 transition-all"
              style={{ background: s.bg, border: `1px solid ${s.color}30` }}>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl mb-4"
                style={{ background: `${s.color}18`, border: `1px solid ${s.color}30` }}>
                <s.icon className="h-5 w-5" style={{ color: s.color }} />
              </div>
              <h3 className="font-bold text-white mb-2">{s.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Features ────────────────────────────────────────────────────────────────────

function Features() {
  const features = [
    { icon: GitBranch, color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', title: '4 tipos de fluxo visual', desc: 'Direto, Apresentação, Consultivo ou Visual drag-and-drop. Escolha o estilo que converte mais para o seu nicho.', badge: 'Diferencial' },
    { icon: FlaskConical, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', title: 'Teste A/B integrado', desc: 'Divida o tráfego 50/50 entre dois fluxos e veja qual converte mais. Decisão por dados, não por achismo.', badge: 'Exclusivo' },
    { icon: CreditCard, color: '#34d399', bg: 'rgba(52,211,153,0.1)', title: 'PIX via AmloPay', desc: 'QR code e copia-e-cola gerados na hora. Confirmação automática. Entrega imediata. Sem intermediários no seu bolso.', badge: null },
    { icon: Shield, color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', title: 'Anti-fraude nativo', desc: 'protect_content bloqueia encaminhamento e download dentro do canal. Seu conteúdo fica só seu.', badge: null },
    { icon: Users, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', title: 'CRM + Afiliados', desc: 'LTV, churn score, tags e notas por cliente. Mais sistema de afiliados com comissão percentual configurável.', badge: null },
    { icon: Globe, color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', title: 'URL Cloaker com geo', desc: 'Links seguros com HMAC e redirecionamento por país. Protege seu tráfego e aumenta aprovação em campanhas de anúncios.', badge: null },
  ]

  return (
    <section id="recursos" className="py-28" style={{ background: '#0a0a1f' }}>
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          badge="Recursos"
          badgeIcon={Zap}
          title="Tudo que você precisa. Nada que você não vai usar."
          subtitle="Cada funcionalidade foi construída para resolver um problema real de quem vende no Telegram."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} data-animate className="opacity-0 rounded-2xl p-6 group transition-all hover:scale-[1.01]"
              style={glass}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{ background: f.bg, border: `1px solid ${f.color}30` }}>
                  <f.icon className="h-5 w-5" style={{ color: f.color }} />
                </div>
                {f.badge && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(139,92,246,0.15)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.25)' }}>
                    {f.badge}
                  </span>
                )}
              </div>
              <h3 className="font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── How it works ────────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    { n: '01', icon: PlusCircle, title: 'Crie seu bot em minutos', desc: 'Conecte seu token do Telegram, escolha um template de nicho e configure os planos e preços. Sem código.' },
    { n: '02', icon: GitBranch, title: 'Personalize o fluxo de venda', desc: 'Use o editor visual para montar a jornada do cliente — mensagens, botões, condições e pagamento PIX.' },
    { n: '03', icon: TrendingUp, title: 'Ative e acompanhe os resultados', desc: 'Seu bot começa a vender imediatamente. Acompanhe conversões, receita e churn no painel em tempo real.' },
  ]
  return (
    <section className="py-28" style={{ background: '#07071a' }}>
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader title="Em 3 passos, seu bot vendendo" subtitle="Do cadastro à primeira venda em menos de 10 minutos." />
        <div className="relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-12 left-[calc(16.666%-1px)] right-[calc(16.666%-1px)] h-px"
            style={{ borderTop: '1px dashed rgba(255,255,255,0.1)' }} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {steps.map((s, i) => (
              <div key={i} data-animate className="opacity-0 text-center relative">
                <div className="relative inline-flex h-24 w-24 items-center justify-center rounded-full mb-6"
                  style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
                  <s.icon className="h-9 w-9 text-blue-400" />
                  <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-black text-white"
                    style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>{s.n}</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-3">{s.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed max-w-xs mx-auto">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Flow Editor Highlight ───────────────────────────────────────────────────────

function FlowEditorHighlight() {
  const nodes = [
    { x: 40, y: 20, border: '#60a5fa', icon: MessageSquare, label: '/start recebido' },
    { x: 200, y: 110, border: '#a78bfa', icon: GitBranch, label: 'Apresentar planos' },
    { x: 40, y: 200, border: '#34d399', icon: CreditCard, label: 'Gerar PIX' },
    { x: 200, y: 290, border: '#34d399', icon: Send, label: 'Entregar acesso' },
  ]
  const curves = [
    'M 150 50 C 200 50 190 130 210 140',
    'M 145 230 C 195 230 200 260 210 300',
    'M 145 140 C 80 160 80 185 145 210',
  ]

  return (
    <section className="py-28" style={{ background: '#050514' }}>
      <div className="mx-auto max-w-7xl px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Copy */}
        <div data-animate className="opacity-0">
          <SectionBadge icon={GitBranch}>Editor Visual de Fluxos</SectionBadge>
          <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-6">
            Monte qualquer funil.<br />
            <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
              Sem escrever uma linha de código.
            </span>
          </h2>
          <div className="space-y-4 mb-10">
            {[
              'Arrastar e soltar — igual ao N8N, mas focado em vendas',
              'Condições, ramificações e delays visuais',
              'Conecte nós de mensagem, PIX, entrega e redirecionamento',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-zinc-300">{item}</p>
              </div>
            ))}
          </div>
          <Link href="/login"
            className="inline-flex items-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-bold text-white transition-all hover:scale-[1.03]"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', boxShadow: '0 8px 24px rgba(59,130,246,0.3)' }}>
            <Rocket className="h-4 w-4" /> Explorar o editor
          </Link>
        </div>

        {/* Mock flow editor */}
        <div data-animate className="opacity-0 rounded-2xl p-6 relative overflow-hidden"
          style={{ background: 'rgba(10,13,26,0.98)', border: '1px solid rgba(255,255,255,0.08)', minHeight: 380 }}>
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
            <defs>
              <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="rgba(96,165,250,0.5)" />
              </marker>
            </defs>
            {curves.map((d, i) => (
              <path key={i} d={d} stroke="rgba(96,165,250,0.3)" strokeWidth="1.5" fill="none" markerEnd="url(#arrow)" />
            ))}
          </svg>
          <div className="relative" style={{ zIndex: 1, height: 360 }}>
            {nodes.map((n, i) => (
              <div key={i} className="absolute flex items-center gap-2.5 rounded-xl px-3.5 py-2.5"
                style={{ left: n.x, top: n.y, background: 'rgba(255,255,255,0.05)', border: `1px solid ${n.border}40`, backdropFilter: 'blur(10px)', minWidth: 160 }}>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: `${n.border}18` }}>
                  <n.icon className="h-3.5 w-3.5" style={{ color: n.border }} />
                </div>
                <span className="text-xs font-semibold text-zinc-300">{n.label}</span>
                <div className="ml-auto h-2 w-2 rounded-full" style={{ background: n.border, boxShadow: `0 0 6px ${n.border}` }} />
              </div>
            ))}
          </div>
          <p className="absolute bottom-4 left-0 right-0 text-center text-[10px] text-zinc-700">Editor visual interativo disponível no dashboard</p>
        </div>
      </div>
    </section>
  )
}

// ─── Templates ───────────────────────────────────────────────────────────────────

function Templates() {
  const templates = [
    { emoji: '🔥', name: 'Nicho Hot', niche: 'Conteúdo Adulto', desc: 'Alta conversão com copy direto e planos escalonados.', tips: ['Anti-fraude ativado por padrão', 'Planos semanal, mensal e trimestral', 'Kick automático no vencimento'] },
    { emoji: '👑', name: 'Grupo VIP', niche: 'Conteúdo Exclusivo', desc: 'Para qualquer nicho: finanças, games, culinária, lifestyle.', tips: ['Funciona para qualquer conteúdo', 'Renovação com desconto automático', 'Funil de apresentação'] },
    { emoji: '📺', name: 'Contas Streaming', niche: 'Venda de Contas', desc: 'Netflix, Spotify, Disney+ com entrega automática.', tips: ['Estoque de contas gerenciado', 'Entrega imediata após PIX', 'Sem intervenção manual'] },
    { emoji: '💻', name: 'Contas Software', niche: 'Venda de Contas', desc: 'Softwares e ferramentas premium, credenciais na hora.', tips: ['Login/senha entregues pelo bot', 'Planos mensais e trimestrais', 'Reposição de estoque fácil'] },
    { emoji: '🎓', name: 'Curso Online', niche: 'Infoproduto', desc: 'Funil consultivo que qualifica o aluno antes do preço.', tips: ['Fluxo que gera curiosidade', 'Acesso vitalício ou recorrente', 'Link de plataforma externo'] },
    { emoji: '⚡', name: 'Mentoria / Serviço', niche: 'Serviços', desc: 'Consultivo para mentorias e consultorias recorrentes.', tips: ['Qualifica leads antes de mostrar preço', 'Cobrança mensal ou trimestral', 'Direcionamento para WhatsApp'] },
  ]
  return (
    <section id="templates" className="py-28" style={{ background: '#07071a' }}>
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader badge="Templates" badgeIcon={Zap}
          title="Pronto para qualquer nicho. Desde o primeiro dia."
          subtitle="6 templates otimizados para conversão — só editar os textos e ativar." />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((t, i) => (
            <div key={i} data-animate className="opacity-0 rounded-2xl p-6 flex flex-col transition-all hover:scale-[1.01]" style={glass}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {t.emoji}
                </div>
                <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full text-zinc-400"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {t.niche}
                </span>
              </div>
              <h3 className="font-bold text-white mb-1.5">{t.name}</h3>
              <p className="text-sm text-zinc-500 mb-4 leading-relaxed">{t.desc}</p>
              <ul className="space-y-2 mb-6 flex-1">
                {t.tips.map((tip, j) => (
                  <li key={j} className="flex items-center gap-2 text-xs text-zinc-500">
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />{tip}
                  </li>
                ))}
              </ul>
              <Link href="/login"
                className="block text-center rounded-xl py-2.5 text-sm font-semibold text-blue-400 transition-all hover:text-white"
                style={{ border: '1px solid rgba(96,165,250,0.25)', background: 'rgba(96,165,250,0.06)' }}>
                Usar este template
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── CRM + Afiliados ─────────────────────────────────────────────────────────────

function CrmAfiliados() {
  const crmItems = [
    { icon: TrendingUp, title: 'LTV por cliente', desc: 'Veja o valor total que cada usuário já gerou.' },
    { icon: AlertTriangle, title: 'Churn score', desc: 'Identifique quem está prestes a sair antes que vá.' },
    { icon: Tag, title: 'Tags e segmentação', desc: 'Organize clientes por comportamento e histórico.' },
    { icon: FileText, title: 'Notas manuais', desc: 'Adicione contexto de conversas para acompanhamento.' },
  ]
  const afilItems = [
    { icon: Percent, title: 'Comissão configurável', desc: 'Defina % por produto ou plano individualmente.' },
    { icon: GitBranch, title: 'Código único por afiliado', desc: 'Rastreamento automático de cada indicação.' },
    { icon: BarChart2, title: 'Relatório de conversões', desc: 'Saiba exatamente quanto cada afiliado gerou.' },
    { icon: DollarSign, title: 'Controle de pagamentos', desc: 'Gerencie os pagamentos de comissão pelo painel.' },
  ]

  return (
    <section className="py-28" style={{ background: '#0a0a1f' }}>
      <div className="mx-auto max-w-7xl px-6 grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* CRM */}
        <div data-animate className="opacity-0 rounded-2xl p-8" style={glass}>
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)' }}>
              <Users className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-white">CRM que você vai realmente usar</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Inteligência de clientes embutida</p>
            </div>
          </div>
          <div className="space-y-5">
            {crmItems.map((item, i) => (
              <div key={i} className="flex items-start gap-3.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5"
                  style={{ background: 'rgba(96,165,250,0.1)' }}>
                  <item.icon className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-200">{item.title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Afiliados */}
        <div data-animate className="opacity-0 rounded-2xl p-8" style={glass}>
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)' }}>
              <Share2 className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <h3 className="font-bold text-white">Sistema de afiliados sem complicação</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Transforme clientes em vendedores</p>
            </div>
          </div>
          <div className="space-y-5">
            {afilItems.map((item, i) => (
              <div key={i} className="flex items-start gap-3.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5"
                  style={{ background: 'rgba(167,139,250,0.1)' }}>
                  <item.icon className="h-4 w-4 text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-200">{item.title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Testimonials ────────────────────────────────────────────────────────────────

function Testimonials() {
  // TODO: substituir por depoimentos reais
  const testimonials = [
    { quote: 'Criei meu primeiro bot em 8 minutos. Na mesma semana já tinha vendas automáticas acontecendo enquanto eu dormia.', name: 'Carlos M.', niche: 'Conteúdo Digital', initials: 'CM' },
    { quote: 'O teste A/B me mostrou que meu fluxo consultivo convertia 34% a mais que o direto. Nunca teria descoberto sem os dados.', name: 'Rafaela T.', niche: 'Infoprodutos', initials: 'RT' },
    { quote: 'Migrei de outra plataforma em um dia. O editor visual é mais rápido e o PIX cai certinho sem precisar ficar monitorando.', name: 'Lucas A.', niche: 'Contas Streaming', initials: 'LA' },
  ]
  const gradients = [
    'linear-gradient(135deg, #3b82f6, #6366f1)',
    'linear-gradient(135deg, #8b5cf6, #ec4899)',
    'linear-gradient(135deg, #06b6d4, #3b82f6)',
  ]
  return (
    <section className="py-28" style={{ background: '#07071a' }}>
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader title="Quem já usa o FlowBot não volta para o manual" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} data-animate className="opacity-0 rounded-2xl p-7 flex flex-col" style={glass}>
              <div className="flex gap-0.5 mb-5">
                {Array(5).fill(0).map((_, j) => <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-zinc-300 text-sm leading-relaxed flex-1 mb-6">"{t.quote}"</p>
              <div className="flex items-center gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 20 }}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: gradients[i] }}>
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
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

// ─── Pricing ─────────────────────────────────────────────────────────────────────

function Pricing() {
  const features = ['Bots ilimitados', 'Todos os tipos de fluxo', 'Teste A/B integrado', 'PIX via AmloPay', 'CRM com LTV e churn', 'Sistema de afiliados', 'URL Cloaker com geo', '6 templates inclusos', 'Broadcasts segmentados', 'Suporte prioritário']
  return (
    <section id="precos" className="py-28" style={{ background: '#0a0a1f' }}>
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader badge="Preços" badgeIcon={Zap}
          title="Um plano. Acesso completo."
          subtitle="Sem limitações de bots, sem cobrança por mensagem. Pague uma vez e use tudo." />
        <div className="max-w-md mx-auto">
          <div data-animate className="opacity-0 rounded-3xl p-8 relative overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.3)', boxShadow: '0 0 60px rgba(59,130,246,0.1)' }}>
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl"
              style={{ background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #3b82f6)' }} />
            <div className="text-center mb-8">
              <span className="inline-block rounded-full px-4 py-1.5 text-xs font-bold text-blue-300 mb-4"
                style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>
                Acesso Completo
              </span>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-lg text-zinc-600 line-through">R$ 197</span>
                <span className="text-6xl font-black text-white">R$ 97</span>
              </div>
              <p className="text-zinc-500 mt-1">/mês</p>
            </div>
            <ul className="space-y-3 mb-8">
              {features.map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />{f}
                </li>
              ))}
            </ul>
            <Link href="/login"
              className="block text-center rounded-2xl py-4 text-base font-bold text-white mb-4 transition-all hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', boxShadow: '0 8px 24px rgba(59,130,246,0.35)' }}>
              Começar agora — R$ 97/mês
            </Link>
            <p className="text-center text-xs text-zinc-600">Cancele quando quiser. Sem fidelidade. Sem burocracia.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────────

function FAQ() {
  const [open, setOpen] = useState<number | null>(null)
  const items = [
    { q: 'Preciso saber programar para usar o FlowBot?', a: 'Não. O editor visual é drag-and-drop — você monta o fluxo de vendas como montar blocos. Sem código, sem linha de comando. Se você sabe usar WhatsApp, você sabe usar o FlowBot.' },
    { q: 'Quanto tempo leva para colocar o primeiro bot no ar?', a: 'Em média 5 minutos. Escolha um template, configure os planos e preços, conecte o token do Telegram. Pronto. Seu bot já estará aceitando pedidos.' },
    { q: 'O pagamento PIX é confiável? Cai na hora?', a: 'Sim. Usamos a AmloPay, gateway especializado em Telegram. A confirmação é instantânea e a entrega acontece automaticamente logo depois. Nenhuma intervenção manual necessária.' },
    { q: 'Posso vender qualquer tipo de produto digital?', a: 'Qualquer produto digital — acesso a canal ou grupo, contas de streaming, softwares, cursos online, mentorias. O FlowBot entrega links ou credenciais automaticamente após o pagamento.' },
    { q: 'O que é o teste A/B e como funciona?', a: 'Você cria dois fluxos diferentes e o bot divide o tráfego 50/50. Após alguns dias, o painel mostra qual fluxo converte mais — e você desativa o que performa pior. Decisão baseada em dados reais.' },
    { q: 'Tem suporte se eu tiver problemas?', a: 'Sim. Suporte via Telegram com tempo de resposta de até 4 horas em dias úteis. Clientes com plano ativo têm prioridade no atendimento.' },
  ]
  return (
    <section id="faq" className="py-28" style={{ background: '#07071a' }}>
      <div className="mx-auto max-w-3xl px-6">
        <SectionHeader title="Dúvidas frequentes" subtitle="Respondemos as perguntas mais comuns antes que você precise perguntar." />
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} data-animate className="opacity-0 rounded-2xl overflow-hidden transition-all" style={glass}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left gap-4 hover:bg-white/[0.02] transition-colors">
                <span className="text-sm font-semibold text-white">{item.q}</span>
                <ChevronDown className="h-4 w-4 text-zinc-500 shrink-0 transition-transform duration-200"
                  style={{ transform: open === i ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </button>
              <div style={{ maxHeight: open === i ? 200 : 0, overflow: 'hidden', transition: 'max-height 0.25s ease' }}>
                <p className="px-6 pb-5 text-sm text-zinc-400 leading-relaxed">{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Footer CTA ──────────────────────────────────────────────────────────────────

function FooterCTA() {
  return (
    <section className="relative py-28 overflow-hidden" style={{ background: '#050514' }}>
      <div className="blob-1 absolute top-0 left-1/4 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      <div className="blob-2 absolute bottom-0 right-1/4 w-[320px] h-[320px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-black text-white mb-5 leading-tight">
          Seu próximo cliente está<br />
          <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            esperando no Telegram.
          </span>
        </h2>
        <p className="text-zinc-400 mb-10 text-lg">Crie seu bot hoje. Veja a primeira venda acontecer sozinha.</p>
        <Link href="/login"
          className="inline-flex items-center gap-3 rounded-2xl px-10 py-4 text-lg font-black text-white transition-all hover:scale-[1.03]"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', boxShadow: '0 12px 40px rgba(59,130,246,0.45)' }}>
          <Rocket className="h-6 w-6" /> Criar meu bot grátis agora
        </Link>
        <p className="mt-5 text-sm text-zinc-600">Sem cartão de crédito. Cancele quando quiser.</p>
      </div>
    </section>
  )
}

// ─── Footer ──────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="py-16" style={{ background: '#07071a', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="mx-auto max-w-7xl px-6 grid grid-cols-2 md:grid-cols-4 gap-10 mb-14">
        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-black text-white">FlowBot</span>
          </div>
          <p className="text-sm text-zinc-600 leading-relaxed max-w-[200px]">Automação de vendas para o Telegram. Rápido, seguro e sem código.</p>
        </div>

        {/* Product */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-600 mb-4">Produto</p>
          <div className="space-y-3">
            {[['Recursos', '#recursos'], ['Templates', '#templates'], ['Como funciona', '#como-funciona'], ['Preços', '#precos']].map(([l, h]) => (
              <a key={h} href={h} className="block text-sm text-zinc-500 hover:text-white transition-colors">{l}</a>
            ))}
          </div>
        </div>

        {/* Legal */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-600 mb-4">Legal</p>
          <div className="space-y-3">
            {[['Termos de uso', '#'], ['Política de privacidade', '#'], ['Contato', '#']].map(([l, h]) => (
              <a key={l} href={h} className="block text-sm text-zinc-500 hover:text-white transition-colors">{l}</a>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-600 mb-4">Contato</p>
          <div className="space-y-3">
            <a href="https://t.me/flowbot_suporte" className="flex items-center gap-2.5 text-sm text-zinc-500 hover:text-white transition-colors">
              <Send className="h-4 w-4 text-blue-500" /> Suporte no Telegram
            </a>
            <a href="mailto:contato@flowbot.com.br" className="flex items-center gap-2.5 text-sm text-zinc-500 hover:text-white transition-colors">
              <Mail className="h-4 w-4 text-violet-500" /> contato@flowbot.com.br
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 32 }}>
        <p className="text-xs text-zinc-700">© {new Date().getFullYear()} FlowBot. Todos os direitos reservados.</p>
        <div className="flex items-center gap-2 text-xs text-zinc-700">
          Feito com <Zap className="h-3 w-3 text-blue-600" /> no Brasil
        </div>
      </div>
    </footer>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────────

export function LandingPage() {
  useScrollEntrance()
  return (
    <main className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Navbar />
      <Hero />
      <SocialProof />
      <ProblemSolution />
      <Features />
      <HowItWorks />
      <FlowEditorHighlight />
      <Templates />
      <CrmAfiliados />
      <Testimonials />
      <Pricing />
      <FAQ />
      <FooterCTA />
      <Footer />
    </main>
  )
}
