'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ChevronRight, CheckCircle2, XCircle, AlertTriangle, TrendingDown,
  Bot, BarChart3, GitBranch, FlaskConical, CreditCard, Shield, Users, Globe,
  PlusCircle, TrendingUp, MessageSquare, Send, ArrowDown, Share2, Percent,
  BarChart2, DollarSign, Tag, FileText, Star, ChevronDown, Check, Mail,
  Rocket, Menu, X, Zap,
} from 'lucide-react'

// ─── Inline logo (F-mark, purple gradient) ──────────────────────────────────

function FlowBotLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 500 500" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="lgFront" x1="0.85" y1="0.05" x2="0.15" y2="0.95">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="42%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
        <linearGradient id="lgBack" x1="0.85" y1="0.05" x2="0.15" y2="0.95">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#4c1d95" />
        </linearGradient>
      </defs>
      <g fill="url(#lgBack)" opacity="0.55" transform="translate(20, 14)">
        <rect x="118" y="88" width="56" height="315" rx="28" />
        <rect x="118" y="88" width="262" height="56" rx="28" />
        <rect x="118" y="195" width="208" height="50" rx="25" />
      </g>
      <g fill="url(#lgFront)">
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
          e.target.classList.remove('opacity-0')
          e.target.classList.add('animate-fade-up')
          io.unobserve(e.target)
        }
      }),
      { threshold: 0.08, rootMargin: '0px 0px -32px 0px' }
    )
    document.querySelectorAll('[data-animate]').forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const glass: React.CSSProperties = {
  background: 'rgba(139,92,246,0.06)',
  border: '1px solid rgba(139,92,246,0.14)',
  backdropFilter: 'blur(24px) saturate(160%)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 8px 40px rgba(0,0,0,0.4)',
}

const glassMid: React.CSSProperties = {
  background: 'rgba(139,92,246,0.09)',
  border: '1px solid rgba(139,92,246,0.2)',
  backdropFilter: 'blur(24px) saturate(160%)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07), 0 12px 48px rgba(0,0,0,0.5)',
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function SectionBadge({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold text-violet-300 mb-6"
      style={{ borderColor: 'rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.1)', backdropFilter: 'blur(12px)' }}>
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

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  return (
    <nav className="sticky top-0 z-50 w-full transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(6,4,15,0.9)' : 'rgba(6,4,15,0.4)',
        backdropFilter: 'blur(22px) saturate(160%)',
        borderBottom: `1px solid ${scrolled ? 'rgba(139,92,246,0.15)' : 'rgba(139,92,246,0.08)'}`,
        boxShadow: scrolled ? '0 4px 32px rgba(0,0,0,0.6)' : 'none',
      }}>
      <div className="mx-auto max-w-7xl px-6 flex items-center justify-between h-16">
        <div className="flex items-center gap-3">
          <FlowBotLogo size={30} />
          <span className="text-base font-black text-white tracking-tight">FlowBot</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {[['Recursos', '#recursos'], ['Como funciona', '#como-funciona'], ['Templates', '#templates'], ['Preços', '#precos']].map(([l, h]) => (
            <a key={h} href={h} className="text-sm text-zinc-400 hover:text-white transition-colors font-medium">{l}</a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition-colors font-medium px-4 py-2">Entrar</Link>
          <Link href="/login"
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all hover:scale-[1.02] hover:brightness-110"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', boxShadow: '0 4px 18px rgba(139,92,246,0.45)' }}>
            Começar grátis
          </Link>
        </div>

        <button className="md:hidden p-2 text-zinc-400 hover:text-white" onClick={() => setMobileOpen(v => !v)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden px-6 pb-6 space-y-3 pt-4" style={{ borderTop: '1px solid rgba(139,92,246,0.1)' }}>
          {[['Recursos', '#recursos'], ['Como funciona', '#como-funciona'], ['Templates', '#templates'], ['Preços', '#precos']].map(([l, h]) => (
            <a key={h} href={h} onClick={() => setMobileOpen(false)} className="block text-sm text-zinc-400 py-2 hover:text-white transition-colors">{l}</a>
          ))}
          <div className="pt-2 flex flex-col gap-2">
            <Link href="/login" className="text-center rounded-xl border py-2.5 text-sm text-zinc-300 font-medium"
              style={{ borderColor: 'rgba(139,92,246,0.2)' }}>Entrar</Link>
            <Link href="/login" className="text-center rounded-xl py-2.5 text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>Começar grátis</Link>
          </div>
        </div>
      )}
    </nav>
  )
}

// ─── Bot Simulation ───────────────────────────────────────────────────────────

const QR_PATTERN = [1,0,1,1,0,1,0,1,0,1,0,0,1,0,1,0,1,1,0,0,1,0,0,1,0,1,1,0,0,1,1,0,1,0,1,1,0,1,0,0,1,1,0,1,0,0,1,0,1,0,0,1,1,0,1,1,0,1,0,0,1,0,1,1]

function QRPlaceholder() {
  return (
    <div className="inline-block p-2 rounded-lg" style={{ background: '#fff' }}>
      <svg viewBox="0 0 8 8" width="72" height="72" shapeRendering="crispEdges">
        {QR_PATTERN.map((fill, i) => (
          <rect key={i} x={i % 8} y={Math.floor(i / 8)} width="1" height="1" fill={fill ? '#06040f' : '#fff'} />
        ))}
      </svg>
    </div>
  )
}

const SIM_MESSAGES = [
  { from: 'user', text: '/start', delay: '0.4s' },
  { from: 'bot', text: '👋 Olá! Seja bem-vindo ao canal VIP.\n\nConteúdo exclusivo, atualizado toda semana. Escolha seu plano:', delay: '1.0s', hasButtons: true },
  { from: 'user', text: '💎 30 dias — R$ 59,90', delay: '2.0s' },
  { from: 'bot', text: '⚡ Gerando seu PIX...', delay: '2.7s' },
  { from: 'bot', isQR: true, delay: '3.3s' },
  { from: 'bot', text: '✅ Pagamento confirmado!\n\nSeu link de acesso:\nt.me/+canal_vip_xyz\n\n⚠️ Link único — não compartilhe', delay: '4.4s' },
] as const

function BotSimulation() {
  return (
    <div className="animate-pulse-glow rounded-2xl overflow-hidden w-full max-w-sm mx-auto"
      style={{
        background: '#0c0918',
        border: '1px solid rgba(139,92,246,0.22)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 60px rgba(139,92,246,0.12)',
      }}>
      <div className="flex items-center gap-2 px-4 py-3"
        style={{ background: 'rgba(139,92,246,0.07)', borderBottom: '1px solid rgba(139,92,246,0.1)' }}>
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-500/70" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
          <div className="h-3 w-3 rounded-full bg-green-500/70" />
        </div>
        <div className="flex items-center gap-2 ml-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
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

      <div className="p-4 space-y-3 min-h-[360px]" style={{ background: '#080615' }}>
        {SIM_MESSAGES.map((msg, i) => (
          <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
            style={{ animation: 'fade-in-up 0.4s ease-out forwards', animationDelay: msg.delay, opacity: 0 }}>
            {'isQR' in msg && msg.isQR ? (
              <div className="rounded-2xl rounded-bl-sm p-3"
                style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.18)' }}>
                <QRPlaceholder />
                <p className="text-[10px] text-zinc-500 mt-2 text-center">Pix copia e cola abaixo</p>
              </div>
            ) : msg.from === 'user' ? (
              <div className="rounded-2xl rounded-br-sm px-3.5 py-2 max-w-[75%] text-sm text-white"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
                {'text' in msg && msg.text}
              </div>
            ) : (
              <div className="rounded-2xl rounded-bl-sm px-3.5 py-2.5 max-w-[82%] text-sm"
                style={{ background: 'rgba(139,92,246,0.09)', border: '1px solid rgba(139,92,246,0.16)', color: '#e2e8f0' }}>
                {'text' in msg && <p style={{ whiteSpace: 'pre-line' }}>{msg.text}</p>}
                {'hasButtons' in msg && msg.hasButtons && (
                  <div className="mt-3 space-y-1.5">
                    {['🔥 7 dias — R$ 24,90', '💎 30 dias — R$ 59,90', '👑 90 dias — R$ 139,90'].map(b => (
                      <div key={b} className="rounded-xl px-3 py-2 text-xs font-semibold text-center text-violet-300"
                        style={{ border: '1px solid rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.1)' }}>{b}</div>
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

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pb-28">
      {/* Animated orbs */}
      <div className="blob-1 absolute -top-32 -left-32 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 65%)', filter: 'blur(100px)' }} />
      <div className="blob-2 absolute -top-16 -right-32 w-[550px] h-[550px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(109,40,217,0.18) 0%, transparent 65%)', filter: 'blur(90px)' }} />
      <div className="blob-3 absolute bottom-0 left-1/3 w-[450px] h-[450px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(192,132,252,0.1) 0%, transparent 65%)', filter: 'blur(80px)' }} />

      {/* Flow lines — give the "em movimento" feel */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.14 }} aria-hidden="true">
        <defs>
          <linearGradient id="flowLineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
        {[8, 18, 28, 40, 52, 63, 74, 84, 93].map((y, i) => (
          <line key={i} x1="0%" y1={`${y}%`} x2="100%" y2={`${y}%`}
            stroke="url(#flowLineGrad)" strokeWidth="0.8"
            strokeDasharray="50 200"
            style={{ animation: `flow-dash ${3.5 + i * 0.65}s linear infinite`, animationDelay: `${-i * 1.15}s` }} />
        ))}
      </svg>

      <div className="relative z-10 mx-auto max-w-5xl px-6 text-center w-full">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold text-violet-300 mb-10 animate-fade-up"
          style={{ borderColor: 'rgba(139,92,246,0.35)', background: 'rgba(139,92,246,0.1)', backdropFilter: 'blur(12px)' }}>
          <Zap className="h-3.5 w-3.5" />
          Automação de vendas para o Telegram
        </div>

        {/* H1 */}
        <h1 className="text-5xl lg:text-[76px] font-black leading-[1.02] tracking-tight mb-7 animate-fade-up">
          <span className="text-flow-gradient">Venda em fluxo.</span>
          <br />
          <span className="text-white">24h por dia.</span>
          <br />
          <span style={{ color: '#a78bfa' }}>No Telegram.</span>
        </h1>

        <p className="text-lg md:text-xl text-zinc-400 leading-relaxed max-w-2xl mx-auto mb-10 animate-fade-up-delay">
          FlowBot coloca um vendedor automático no seu Telegram — responde na hora, cobra pelo PIX e libera o acesso sozinho.
          Você só aparece para ver o dinheiro entrar.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10 animate-fade-up-delay">
          <Link href="/login"
            className="flex items-center justify-center gap-2.5 rounded-2xl px-8 py-4 text-base font-bold text-white transition-all hover:scale-[1.03] hover:brightness-110"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', boxShadow: '0 8px 32px rgba(139,92,246,0.5)' }}>
            <Rocket className="h-5 w-5" />
            Criar meu bot grátis
          </Link>
          <a href="#como-funciona"
            className="flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-base font-semibold text-zinc-300 transition-all hover:text-white"
            style={{ border: '1px solid rgba(139,92,246,0.2)', background: 'rgba(139,92,246,0.06)', backdropFilter: 'blur(12px)' }}>
            Ver como funciona <ChevronRight className="h-4 w-4" />
          </a>
        </div>

        <div className="flex flex-wrap gap-6 justify-center mb-20 animate-fade-up-delay">
          {['Sem cartão de crédito', 'Bot no ar em 5 minutos', 'Suporte via Telegram'].map(t => (
            <div key={t} className="flex items-center gap-2 text-sm text-zinc-500">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />{t}
            </div>
          ))}
        </div>

        {/* Bot Simulation — below center, floating */}
        <div className="animate-fade-up-delay flex justify-center">
          <BotSimulation />
        </div>
      </div>
    </section>
  )
}

// ─── Social Proof ─────────────────────────────────────────────────────────────

function SocialProof() {
  const stats = [
    { n: '+2.400', l: 'bots criados' },
    { n: 'R$ 1,2M+', l: 'em vendas geradas' },
    { n: '99,9%', l: 'disponibilidade garantida' },
    { n: '< 5 min', l: 'do zero ao bot no ar' },
  ]
  return (
    <section className="py-14"
      style={{ background: '#0c0918', borderTop: '1px solid rgba(139,92,246,0.08)', borderBottom: '1px solid rgba(139,92,246,0.08)' }}>
      <div className="mx-auto max-w-7xl px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {stats.map((s, i) => (
          <div key={i} data-animate className="opacity-0">
            <p className="text-4xl font-black text-flow-gradient">{s.n}</p>
            <p className="mt-2 text-sm text-zinc-500">{s.l}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Problem → Solution ───────────────────────────────────────────────────────

function ProblemSolution() {
  const pains = [
    { icon: XCircle, title: 'Respondendo tudo no manual', desc: 'Cada cliente depende de você estar online. Perde venda quando está dormindo, viajando ou simplesmente ocupado.' },
    { icon: AlertTriangle, title: 'PIX recebido, entrega na mão', desc: 'Confirmou o pagamento? Agora precisa mandar o link ou as credenciais um por um. Isso não escala.' },
    { icon: TrendingDown, title: 'Sem dados, sem controle', desc: 'Sem histórico, sem relatório, sem métricas. Impossível crescer o que você não consegue enxergar.' },
  ]
  const solutions = [
    { icon: Bot, bg: 'rgba(167,139,250,0.07)', bdr: 'rgba(167,139,250,0.2)', color: '#a78bfa', title: 'Bot que vende enquanto você dorme', desc: 'Recebe o cliente, mostra os planos, cobra no PIX e libera o acesso — 100% automático, sem parar.' },
    { icon: Zap, bg: 'rgba(52,211,153,0.07)', bdr: 'rgba(52,211,153,0.2)', color: '#34d399', title: 'PIX confirmado → acesso em segundos', desc: 'O sistema detecta o pagamento e manda o link ou as credenciais na hora. Zero trabalho manual.' },
    { icon: BarChart3, bg: 'rgba(192,132,252,0.07)', bdr: 'rgba(192,132,252,0.2)', color: '#c084fc', title: 'Painel completo de quem comprou', desc: 'Histórico de cada cliente, quem está prestes a cancelar e campanhas de retenção com um clique.' },
  ]

  return (
    <section id="como-funciona" className="py-28" style={{ background: '#06040f' }}>
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-3">Você ainda perde tempo com isso?</h2>
          <p className="text-zinc-500">Se reconhece qualquer um desses cenários, o FlowBot resolve.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          {pains.map((p, i) => (
            <div key={i} data-animate className="opacity-0 rounded-2xl p-6"
              style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.14)', backdropFilter: 'blur(20px)' }}>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl mb-4"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.18)' }}>
                <p.icon className="h-5 w-5 text-red-400" />
              </div>
              <h3 className="font-bold text-white mb-2">{p.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-center mb-12">
          <div className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', boxShadow: '0 8px 28px rgba(139,92,246,0.45)' }}>
            <ArrowDown className="h-6 w-6 text-white" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {solutions.map((s, i) => (
            <div key={i} data-animate className="opacity-0 rounded-2xl p-6"
              style={{ background: s.bg, border: `1px solid ${s.bdr}`, backdropFilter: 'blur(20px)' }}>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl mb-4"
                style={{ background: `${s.bg}`, border: `1px solid ${s.bdr}` }}>
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

// ─── Features ─────────────────────────────────────────────────────────────────

function Features() {
  const features = [
    { icon: GitBranch, color: '#a78bfa', title: 'Monte o roteiro de vendas arrastando blocos', desc: 'Editor visual drag-and-drop: mensagem, pergunta, PIX, entrega de acesso. Você decide o script e a ordem — sem escrever código.', badge: 'Exclusivo' },
    { icon: FlaskConical, color: '#c084fc', title: 'Teste qual abordagem vende mais', desc: 'Crie duas versões do bot, divida o tráfego 50/50 e descubra em dados qual converte mais. Chega de achismo.', badge: 'Diferencial' },
    { icon: CreditCard, color: '#34d399', title: 'PIX direto na sua conta, sem intermediário', desc: 'QR code gerado na hora, confirmação automática e acesso liberado em segundos. Ninguém segura seu dinheiro.', badge: null },
    { icon: Shield, color: '#60a5fa', title: 'Conteúdo que não vaza', desc: 'Ative a proteção e ninguém consegue salvar, encaminhar ou copiar o que está no seu canal. Seu produto fica seu.', badge: null },
    { icon: Users, color: '#a78bfa', title: 'Histórico de clientes + programa de afiliados', desc: 'Veja quanto cada pessoa gastou, quem está sumindo, e transforme compradores em divulgadores com comissão automática.', badge: null },
    { icon: Globe, color: '#67e8f9', title: 'Links que mudam de destino por país', desc: 'Proteja seu tráfego pago com links inteligentes. Visitantes de países diferentes são redirecionados automaticamente.', badge: null },
  ]

  return (
    <section id="recursos" className="py-28" style={{ background: '#0c0918' }}>
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          badge="Recursos"
          badgeIcon={Zap}
          title="Tudo que você precisa. Nada que você não vai usar."
          subtitle="Cada ferramenta foi construída para resolver um problema real de quem vende no Telegram."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div key={i} data-animate className="opacity-0 rounded-2xl p-6 transition-all hover:scale-[1.01]" style={glass}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{ background: `${f.color}14`, border: `1px solid ${f.color}28` }}>
                  <f.icon className="h-5 w-5" style={{ color: f.color }} />
                </div>
                {f.badge && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(139,92,246,0.15)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.25)' }}>
                    {f.badge}
                  </span>
                )}
              </div>
              <h3 className="font-bold text-white mb-2 leading-snug">{f.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── How It Works (vertical timeline) ────────────────────────────────────────

function HowItWorks() {
  const steps = [
    { n: '01', icon: PlusCircle, title: 'Conecte seu bot do Telegram', desc: 'Crie um bot pelo BotFather, cole o token no FlowBot e escolha um template de nicho. Leva 3 minutos.' },
    { n: '02', icon: GitBranch, title: 'Monte o roteiro de vendas', desc: 'Use o editor visual para criar a jornada: boas-vindas, planos, cobrança no PIX e entrega automática do acesso.' },
    { n: '03', icon: TrendingUp, title: 'Ative e acompanhe em tempo real', desc: 'Seu bot começa a vender imediatamente. Veja conversões, receita e quem está prestes a cancelar no painel.' },
  ]
  return (
    <section className="py-28" style={{ background: '#06040f' }}>
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader title="Em 3 passos, seu bot vendendo" subtitle="Do cadastro à primeira venda automática em menos de 10 minutos." />
        <div className="relative max-w-2xl mx-auto">
          {/* Vertical connector */}
          <div className="absolute left-10 top-12 bottom-12 w-px hidden md:block"
            style={{ background: 'linear-gradient(180deg, rgba(139,92,246,0) 0%, rgba(139,92,246,0.3) 25%, rgba(139,92,246,0.3) 75%, rgba(139,92,246,0) 100%)' }} />
          <div className="space-y-10">
            {steps.map((s, i) => (
              <div key={i} data-animate className="opacity-0 flex gap-6 items-start">
                <div className="relative shrink-0">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl"
                    style={glassMid}>
                    <s.icon className="h-8 w-8 text-violet-400" />
                  </div>
                  <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black text-white"
                    style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>{s.n}</span>
                </div>
                <div className="flex-1 pt-3">
                  <h3 className="text-lg font-bold text-white mb-2">{s.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Flow Editor Highlight ────────────────────────────────────────────────────

function FlowEditorHighlight() {
  const nodes = [
    { x: 28, y: 18, border: '#a78bfa', icon: MessageSquare, label: '/start recebido' },
    { x: 195, y: 105, border: '#c084fc', icon: GitBranch, label: 'Apresentar planos' },
    { x: 28, y: 195, border: '#34d399', icon: CreditCard, label: 'Gerar PIX' },
    { x: 195, y: 285, border: '#34d399', icon: Send, label: 'Entregar acesso' },
  ]
  const curves = [
    'M 148 48 C 195 48 185 125 205 135',
    'M 133 225 C 183 225 195 255 205 295',
    'M 133 135 C 75 155 75 180 133 205',
  ]
  return (
    <section className="py-28" style={{ background: '#110e20' }}>
      <div className="mx-auto max-w-7xl px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div data-animate className="opacity-0">
          <SectionBadge icon={GitBranch}>Editor Visual de Fluxos</SectionBadge>
          <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-6">
            Monte qualquer roteiro de vendas.<br />
            <span className="text-flow-gradient">Sem escrever uma linha de código.</span>
          </h2>
          <div className="space-y-4 mb-10">
            {[
              'Arraste e solte blocos para montar a jornada do cliente',
              'Condições, bifurcações e pausas configuráveis visualmente',
              'Conecte mensagens, pagamento PIX e entrega de conteúdo',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-zinc-300">{item}</p>
              </div>
            ))}
          </div>
          <Link href="/login"
            className="inline-flex items-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-bold text-white transition-all hover:scale-[1.03]"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', boxShadow: '0 8px 24px rgba(139,92,246,0.4)' }}>
            <Rocket className="h-4 w-4" /> Explorar o editor
          </Link>
        </div>

        <div data-animate className="opacity-0 rounded-2xl p-6 relative overflow-hidden" style={{ ...glassMid, minHeight: 380 }}>
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
            <defs>
              <marker id="arrowV" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="rgba(167,139,250,0.6)" />
              </marker>
            </defs>
            {curves.map((d, i) => (
              <path key={i} d={d} stroke="rgba(139,92,246,0.35)" strokeWidth="1.5" fill="none" markerEnd="url(#arrowV)" />
            ))}
          </svg>
          <div className="relative" style={{ zIndex: 1, height: 360 }}>
            {nodes.map((n, i) => (
              <div key={i} className="absolute flex items-center gap-2.5 rounded-xl px-3.5 py-2.5"
                style={{ left: n.x, top: n.y, background: 'rgba(139,92,246,0.08)', border: `1px solid ${n.border}50`, backdropFilter: 'blur(12px)', minWidth: 155 }}>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: `${n.border}18` }}>
                  <n.icon className="h-3.5 w-3.5" style={{ color: n.border }} />
                </div>
                <span className="text-xs font-semibold text-zinc-300">{n.label}</span>
                <div className="ml-auto h-2 w-2 rounded-full shrink-0" style={{ background: n.border, boxShadow: `0 0 6px ${n.border}` }} />
              </div>
            ))}
          </div>
          <p className="absolute bottom-4 left-0 right-0 text-center text-[10px] text-zinc-700">Editor interativo disponível no painel</p>
        </div>
      </div>
    </section>
  )
}

// ─── Templates ────────────────────────────────────────────────────────────────

function Templates() {
  const templates = [
    { emoji: '🔥', name: 'Canal de Conteúdo Hot', niche: 'Conteúdo Adulto', desc: 'Alta conversão com planos escalonados e proteção ativada por padrão.', tips: ['Anti-vazamento ativo por padrão', 'Planos semanal, mensal e trimestral', 'Expulsão automática no vencimento'] },
    { emoji: '👑', name: 'Grupo VIP', niche: 'Conteúdo Exclusivo', desc: 'Para qualquer nicho: finanças, games, culinária, lifestyle.', tips: ['Funciona para qualquer conteúdo', 'Renovação com desconto automático', 'Funil de apresentação incluso'] },
    { emoji: '📺', name: 'Contas Streaming', niche: 'Revenda de Contas', desc: 'Netflix, Spotify, Disney+ com entrega automática após o PIX.', tips: ['Estoque de contas gerenciado', 'Acesso enviado imediatamente', 'Sem intervenção manual'] },
    { emoji: '💻', name: 'Contas Software', niche: 'Revenda de Contas', desc: 'Ferramentas e softwares premium, login e senha entregues na hora.', tips: ['Credenciais enviadas pelo bot', 'Planos mensais e trimestrais', 'Reposição de estoque fácil'] },
    { emoji: '🎓', name: 'Curso Online', niche: 'Infoproduto', desc: 'Funil que gera curiosidade antes de mostrar o preço.', tips: ['Apresentação que qualifica antes', 'Acesso vitalício ou recorrente', 'Link de plataforma externo'] },
    { emoji: '⚡', name: 'Mentoria e Serviços', niche: 'Serviços', desc: 'Fluxo consultivo para mentorias e consultorias recorrentes.', tips: ['Qualifica leads antes do preço', 'Cobrança mensal ou trimestral', 'Direciona para WhatsApp'] },
  ]
  return (
    <section id="templates" className="py-28" style={{ background: '#0c0918' }}>
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader badge="Templates" badgeIcon={Zap}
          title="Pronto para qualquer nicho. Desde o primeiro dia."
          subtitle="6 roteiros de venda otimizados — só editar os textos, configurar os preços e ativar." />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {templates.map((t, i) => (
            <div key={i} data-animate className="opacity-0 rounded-2xl p-6 flex flex-col transition-all hover:scale-[1.01]" style={glass}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
                  style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                  {t.emoji}
                </div>
                <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full text-violet-400"
                  style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
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
                className="block text-center rounded-xl py-2.5 text-sm font-semibold text-violet-400 transition-all hover:text-white"
                style={{ border: '1px solid rgba(139,92,246,0.25)', background: 'rgba(139,92,246,0.07)' }}>
                Usar este template
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── CRM + Afiliados ──────────────────────────────────────────────────────────

function CrmAfiliados() {
  const crmItems = [
    { icon: TrendingUp, title: 'Total gasto por cliente', desc: 'Veja quanto cada pessoa já pagou no seu negócio.' },
    { icon: AlertTriangle, title: 'Quem está prestes a cancelar', desc: 'Identifique clientes sumindo antes que vão embora.' },
    { icon: Tag, title: 'Etiquetas e segmentação', desc: 'Organize por comportamento, nicho ou data de entrada.' },
    { icon: FileText, title: 'Anotações manuais', desc: 'Adicione contexto de conversas para acompanhamento futuro.' },
  ]
  const afilItems = [
    { icon: Percent, title: 'Comissão configurável por plano', desc: 'Defina porcentagem diferente para cada produto.' },
    { icon: GitBranch, title: 'Link rastreado por afiliado', desc: 'Cada divulgador tem seu código único de indicação.' },
    { icon: BarChart2, title: 'Relatório de conversões', desc: 'Saiba exatamente quanto cada afiliado gerou.' },
    { icon: DollarSign, title: 'Controle de pagamentos', desc: 'Gerencie os repasses de comissão pelo painel.' },
  ]

  return (
    <section className="py-28" style={{ background: '#06040f' }}>
      <div className="mx-auto max-w-7xl px-6 grid grid-cols-1 md:grid-cols-2 gap-10">
        <div data-animate className="opacity-0 rounded-2xl p-8" style={glassMid}>
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}>
              <Users className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <h3 className="font-bold text-white">CRM que você vai realmente usar</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Inteligência de clientes embutida no painel</p>
            </div>
          </div>
          <div className="space-y-5">
            {crmItems.map((item, i) => (
              <div key={i} className="flex items-start gap-3.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5"
                  style={{ background: 'rgba(139,92,246,0.1)' }}>
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

        <div data-animate className="opacity-0 rounded-2xl p-8" style={glassMid}>
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: 'rgba(192,132,252,0.15)', border: '1px solid rgba(192,132,252,0.3)' }}>
              <Share2 className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h3 className="font-bold text-white">Sistema de afiliados sem complicação</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Transforme compradores em divulgadores</p>
            </div>
          </div>
          <div className="space-y-5">
            {afilItems.map((item, i) => (
              <div key={i} className="flex items-start gap-3.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5"
                  style={{ background: 'rgba(192,132,252,0.1)' }}>
                  <item.icon className="h-4 w-4 text-purple-400" />
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

// ─── Testimonials ─────────────────────────────────────────────────────────────

function Testimonials() {
  // TODO: substituir por depoimentos reais
  const testimonials = [
    { quote: 'Criei meu primeiro bot em 8 minutos. Na mesma semana já tinha vendas automáticas acontecendo enquanto eu dormia.', name: 'Carlos M.', niche: 'Conteúdo Digital', initials: 'CM' },
    { quote: 'O teste A/B me mostrou que meu fluxo consultivo convertia 34% a mais. Nunca teria descoberto sem os dados do painel.', name: 'Rafaela T.', niche: 'Infoprodutos', initials: 'RT' },
    { quote: 'Migrei de outra plataforma em um dia. O editor visual é mais rápido e o PIX cai certinho sem precisar ficar monitorando.', name: 'Lucas A.', niche: 'Contas Streaming', initials: 'LA' },
  ]
  const gradients = [
    'linear-gradient(135deg, #8b5cf6, #6d28d9)',
    'linear-gradient(135deg, #a855f7, #7c3aed)',
    'linear-gradient(135deg, #c084fc, #8b5cf6)',
  ]
  return (
    <section className="py-28" style={{ background: '#0c0918' }}>
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader title="Quem já usa o FlowBot não volta para o manual" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <div key={i} data-animate className="opacity-0 rounded-2xl p-7 flex flex-col" style={glass}>
              <div className="flex gap-0.5 mb-5">
                {Array(5).fill(0).map((_, j) => <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-zinc-300 text-sm leading-relaxed flex-1 mb-6">"{t.quote}"</p>
              <div className="flex items-center gap-3" style={{ borderTop: '1px solid rgba(139,92,246,0.12)', paddingTop: 20 }}>
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

// ─── Pricing ──────────────────────────────────────────────────────────────────

function Pricing() {
  const features = [
    'Bots ilimitados', 'Todos os tipos de fluxo', 'Teste A/B de roteiros',
    'PIX automático via AmloPay', 'Histórico completo de clientes', 'Sistema de afiliados',
    'Links com redirecionamento por país', '6 templates inclusos', 'Transmissões segmentadas', 'Suporte prioritário',
  ]
  return (
    <section id="precos" className="py-28" style={{ background: '#06040f' }}>
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader badge="Preços" badgeIcon={Zap}
          title="Um plano. Acesso completo."
          subtitle="Sem limite de bots, sem cobrança por mensagem. Pague uma vez e use tudo." />
        <div className="max-w-md mx-auto">
          <div data-animate className="opacity-0 rounded-3xl p-8 relative overflow-hidden"
            style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.28)', boxShadow: '0 0 80px rgba(139,92,246,0.15), inset 0 1px 0 rgba(255,255,255,0.06)' }}>
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl"
              style={{ background: 'linear-gradient(90deg, #6d28d9, #8b5cf6, #c084fc, #8b5cf6, #6d28d9)' }} />
            <div className="text-center mb-8">
              <span className="inline-block rounded-full px-4 py-1.5 text-xs font-bold text-violet-300 mb-4"
                style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}>
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
              className="block text-center rounded-2xl py-4 text-base font-bold text-white mb-4 transition-all hover:scale-[1.02] hover:brightness-110"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', boxShadow: '0 8px 28px rgba(139,92,246,0.45)' }}>
              Começar agora — R$ 97/mês
            </Link>
            <p className="text-center text-xs text-zinc-600">Cancele quando quiser. Sem fidelidade. Sem burocracia.</p>
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
    { q: 'Preciso saber programar para usar o FlowBot?', a: 'Não. O editor é drag-and-drop — você monta o roteiro de vendas como montar blocos. Sem código, sem linha de comando. Se você sabe usar WhatsApp, você sabe usar o FlowBot.' },
    { q: 'Quanto tempo leva para colocar o primeiro bot no ar?', a: 'Em média 5 minutos. Escolha um template, configure os planos e preços, cole o token do Telegram. Pronto — seu bot já está aceitando pedidos.' },
    { q: 'O pagamento via PIX é confiável? Cai na hora?', a: 'Sim. Usamos a AmloPay, gateway especializado para Telegram. A confirmação é instantânea e a entrega do acesso acontece automaticamente na sequência. Nenhuma intervenção manual.' },
    { q: 'Posso vender qualquer tipo de produto digital?', a: 'Qualquer produto digital: acesso a canal ou grupo, contas de streaming, softwares, cursos, mentorias. O FlowBot entrega links ou credenciais automaticamente após o pagamento.' },
    { q: 'O que é o teste A/B e como funciona?', a: 'Você cria dois roteiros diferentes e o bot divide o tráfego 50/50. Depois de alguns dias, o painel mostra qual converte mais — e você desativa o que performa pior. Decisão por dados, não achismo.' },
    { q: 'Tem suporte se eu tiver problemas?', a: 'Sim. Suporte via Telegram com retorno em até 4 horas em dias úteis. Clientes com plano ativo têm prioridade.' },
  ]
  return (
    <section id="faq" className="py-28" style={{ background: '#0c0918' }}>
      <div className="mx-auto max-w-3xl px-6">
        <SectionHeader title="Dúvidas antes de começar" subtitle="Respondemos o que as pessoas mais perguntam antes de criar o primeiro bot." />
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} data-animate className="opacity-0 rounded-2xl overflow-hidden transition-all" style={glass}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left gap-4 hover:bg-white/[0.02] transition-colors">
                <span className="text-sm font-semibold text-white">{item.q}</span>
                <ChevronDown className="h-4 w-4 text-violet-500 shrink-0 transition-transform duration-200"
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

// ─── Footer CTA ───────────────────────────────────────────────────────────────

function FooterCTA() {
  return (
    <section className="relative py-28 overflow-hidden" style={{ background: '#110e20' }}>
      <div className="blob-1 absolute top-0 left-1/4 w-[450px] h-[450px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      <div className="blob-2 absolute bottom-0 right-1/4 w-[360px] h-[360px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(109,40,217,0.15) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-black text-white mb-5 leading-tight">
          Seu próximo cliente já está<br />
          <span className="text-flow-gradient">esperando no Telegram.</span>
        </h2>
        <p className="text-zinc-400 mb-10 text-lg">Crie seu bot hoje. Veja a primeira venda acontecer sozinha.</p>
        <Link href="/login"
          className="inline-flex items-center gap-3 rounded-2xl px-10 py-4 text-lg font-black text-white transition-all hover:scale-[1.03] hover:brightness-110"
          style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', boxShadow: '0 12px 48px rgba(139,92,246,0.5)' }}>
          <Rocket className="h-6 w-6" /> Criar meu bot grátis agora
        </Link>
        <p className="mt-5 text-sm text-zinc-600">Sem cartão de crédito. Cancele quando quiser.</p>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="py-16" style={{ background: '#06040f', borderTop: '1px solid rgba(139,92,246,0.08)' }}>
      <div className="mx-auto max-w-7xl px-6 grid grid-cols-2 md:grid-cols-4 gap-10 mb-14">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2.5 mb-4">
            <FlowBotLogo size={28} />
            <span className="text-base font-black text-white">FlowBot</span>
          </div>
          <p className="text-sm text-zinc-600 leading-relaxed max-w-[200px]">Automação de vendas para o Telegram. Rápido, seguro e sem código.</p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-600 mb-4">Produto</p>
          <div className="space-y-3">
            {[['Recursos', '#recursos'], ['Templates', '#templates'], ['Como funciona', '#como-funciona'], ['Preços', '#precos']].map(([l, h]) => (
              <a key={h} href={h} className="block text-sm text-zinc-500 hover:text-white transition-colors">{l}</a>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-600 mb-4">Legal</p>
          <div className="space-y-3">
            {[['Termos de uso', '#'], ['Política de privacidade', '#'], ['Contato', '#']].map(([l, h]) => (
              <a key={l} href={h} className="block text-sm text-zinc-500 hover:text-white transition-colors">{l}</a>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-600 mb-4">Contato</p>
          <div className="space-y-3">
            <a href="https://t.me/flowbot_suporte" className="flex items-center gap-2.5 text-sm text-zinc-500 hover:text-white transition-colors">
              <Send className="h-4 w-4 text-violet-500" /> Suporte no Telegram
            </a>
            <a href="mailto:contato@flowbot.com.br" className="flex items-center gap-2.5 text-sm text-zinc-500 hover:text-white transition-colors">
              <Mail className="h-4 w-4 text-purple-500" /> contato@flowbot.com.br
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-3"
        style={{ borderTop: '1px solid rgba(139,92,246,0.07)', paddingTop: 32 }}>
        <p className="text-xs text-zinc-700">© {new Date().getFullYear()} FlowBot. Todos os direitos reservados.</p>
        <div className="flex items-center gap-2 text-xs text-zinc-700">
          Feito com <Zap className="h-3 w-3 text-violet-600" /> no Brasil
        </div>
      </div>
    </footer>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────

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
