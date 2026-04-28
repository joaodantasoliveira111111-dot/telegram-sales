'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Eye, EyeOff, Check, Zap, ArrowRight, Copy, CheckCircle2, RefreshCw } from 'lucide-react'

const PLANS = [
  {
    id: 'pay_per_use',
    name: 'Free',
    price: 'Grátis',
    per: 'para começar',
    monthly: null,
    fee: 'R$ 0,49 / venda',
    desc: 'Sem mensalidade. Pague apenas quando vender.',
    features: ['Sem mensalidade', 'R$ 0,49 por venda', 'Todos os recursos', 'Suporte incluso'],
    highlight: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 'R$ 97',
    per: '/mês',
    monthly: 97,
    fee: 'R$ 0,39 / venda',
    desc: 'Para quem já tem volume. Reduza o custo por venda.',
    features: ['R$ 97/mês fixo', 'R$ 0,39 por venda', 'Todos os recursos', 'Suporte prioritário'],
    highlight: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'R$ 197',
    per: '/mês',
    monthly: 197,
    fee: 'R$ 0,29 / venda',
    desc: 'Alto volume. Menor taxa por venda.',
    features: ['R$ 197/mês fixo', 'R$ 0,29 por venda', 'Todos os recursos', 'Suporte VIP'],
    highlight: false,
  },
]

function formatCPF(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 14)
  if (digits.length <= 11) return digits.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  return digits.replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}
function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 10) return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
}

// ── PIX waiting screen ────────────────────────────────────────────────────────
function PixWaiting({ pixCode, pixQr, amount, planName }: {
  pixCode: string; pixQr: string; amount: number; planName: string
}) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [checking, setChecking] = useState(true)

  function copy() {
    navigator.clipboard.writeText(pixCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/saas/activate')
        const data = await res.json()
        if (data.active) {
          clearInterval(interval)
          router.push('/dashboard')
          router.refresh()
        }
      } catch {}
    }, 4000)
    return () => clearInterval(interval)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--background)' }}>
      <div className="relative w-full max-w-md animate-fade-up text-center">
        <div className="mb-6">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
            <Zap className="h-8 w-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-100">Quase lá!</h1>
          <p className="text-zinc-500 mt-1 text-sm">
            Pague R$ {amount},00 no PIX para ativar o plano <strong className="text-violet-400">{planName}</strong>
          </p>
        </div>

        <div className="rounded-2xl p-6 mb-4"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
          {/* QR Code */}
          {pixQr && (
            <div className="mb-4 flex justify-center">
              <div className="rounded-xl overflow-hidden bg-white p-3 inline-block">
                <img src={`data:image/png;base64,${pixQr}`} alt="QR Code PIX" className="h-40 w-40" />
              </div>
            </div>
          )}

          {/* PIX code */}
          <div className="mb-4 rounded-xl p-3 text-left"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-xs text-zinc-500 mb-1">Código PIX Copia e Cola</p>
            <p className="text-xs text-zinc-300 font-mono break-all leading-relaxed">{pixCode}</p>
          </div>

          <button
            onClick={copy}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all"
            style={{ background: copied ? 'rgba(34,197,94,0.2)' : 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)', color: copied ? '#4ade80' : '#a78bfa' }}
          >
            {copied ? <><CheckCircle2 className="h-4 w-4" /> Copiado!</> : <><Copy className="h-4 w-4" /> Copiar código PIX</>}
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-zinc-500">
          <RefreshCw className={`h-3.5 w-3.5 ${checking ? 'animate-spin' : ''}`} />
          Aguardando confirmação do pagamento...
        </div>

        <p className="mt-3 text-xs text-zinc-600">
          Já pagou?{' '}
          <button onClick={() => window.location.reload()} className="text-violet-400 hover:underline">
            Verificar novamente
          </button>
        </p>
      </div>
    </div>
  )
}

// ── Main registration form ────────────────────────────────────────────────────
export function RegisterForm() {
  const router = useRouter()
  const [step, setStep] = useState<'plan' | 'form'>('plan')
  const [selectedPlan, setSelectedPlan] = useState('pay_per_use')
  const [form, setForm] = useState({
    name: '', email: '', phone: '', cpf_cnpj: '', password: '', confirmPassword: '',
  })
  const [showPw, setShowPw] = useState(false)
  const [showPw2, setShowPw2] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [pixData, setPixData] = useState<{ pix_code: string; pix_qr: string; amount: number } | null>(null)

  function field(key: keyof typeof form, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) { setError('As senhas não coincidem'); return }
    if (form.password.length < 6) { setError('Senha deve ter pelo menos 6 caracteres'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name, email: form.email, phone: form.phone,
          cpf_cnpj: form.cpf_cnpj, password: form.password, plan_type: selectedPlan,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erro ao criar conta'); return }

      if (data.requires_payment) {
        setPixData({ pix_code: data.pix_code, pix_qr: data.pix_qr, amount: data.amount })
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Show PIX waiting screen
  if (pixData) {
    const planName = PLANS.find(p => p.id === selectedPlan)?.name ?? selectedPlan
    return <PixWaiting pixCode={pixData.pix_code} pixQr={pixData.pix_qr} amount={pixData.amount} planName={planName} />
  }

  const inputCls = "w-full rounded-xl border px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-all bg-white/5 focus:ring-2 focus:ring-violet-500/30"
  const inputStyle = { borderColor: 'rgba(255,255,255,0.1)' }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ background: 'var(--background)' }}>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)' }} />
      </div>

      <div className="relative w-full max-w-4xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl overflow-hidden"
            style={{ boxShadow: '0 0 32px rgba(139,92,246,0.4)', border: '1px solid rgba(139,92,246,0.3)' }}>
            <img src="/logo.svg" alt="FlowBot" className="h-12 w-12" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-100">Criar sua conta FlowBot</h1>
          <p className="text-sm text-zinc-500 mt-1">Comece a vender no Telegram em minutos</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {['Escolher plano', 'Criar conta'].map((s, i) => {
            const current = step === 'plan' ? 0 : 1
            return (
              <div key={s} className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
                    style={i <= current ? { background: '#8b5cf6', color: 'white' } : { background: 'rgba(255,255,255,0.08)', color: '#52525b' }}>
                    {i < current ? <Check className="h-3 w-3" /> : i + 1}
                  </div>
                  <span className="text-xs" style={{ color: i <= current ? '#a78bfa' : '#52525b' }}>{s}</span>
                </div>
                {i < 1 && <div className="w-8 h-px" style={{ background: i < current ? '#8b5cf6' : 'rgba(255,255,255,0.1)' }} />}
              </div>
            )
          })}
        </div>

        {step === 'plan' && (
          <div className="animate-fade-up">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {PLANS.map((plan) => (
                <button key={plan.id} type="button" onClick={() => setSelectedPlan(plan.id)}
                  className="relative rounded-2xl p-5 text-left transition-all duration-200"
                  style={{
                    background: selectedPlan === plan.id ? 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(99,102,241,0.08))' : 'rgba(255,255,255,0.03)',
                    border: selectedPlan === plan.id ? '1px solid rgba(139,92,246,0.4)' : '1px solid rgba(255,255,255,0.08)',
                    boxShadow: selectedPlan === plan.id ? '0 0 24px rgba(139,92,246,0.15)' : undefined,
                  }}>
                  {plan.highlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-bold text-white"
                      style={{ background: 'linear-gradient(90deg, #8b5cf6, #6d28d9)' }}>Popular</span>
                  )}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-zinc-100">{plan.name}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{plan.desc}</p>
                    </div>
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all"
                      style={{ borderColor: selectedPlan === plan.id ? '#8b5cf6' : 'rgba(255,255,255,0.2)', background: selectedPlan === plan.id ? '#8b5cf6' : 'transparent' }}>
                      {selectedPlan === plan.id && <Check className="h-3 w-3 text-white" />}
                    </div>
                  </div>
                  <div className="mb-1">
                    <span className="text-2xl font-black text-zinc-100">{plan.price}</span>
                    <span className="text-xs text-zinc-500 ml-1">{plan.per}</span>
                  </div>
                  <p className="text-xs text-violet-400 font-medium mb-3">{plan.fee}</p>
                  <ul className="space-y-1.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-zinc-400">
                        <Check className="h-3 w-3 shrink-0 text-violet-400" />{f}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
            <div className="flex justify-center">
              <button type="button" onClick={() => setStep('form')}
                className="flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', boxShadow: '0 4px 24px rgba(139,92,246,0.4)' }}>
                Continuar com {PLANS.find(p => p.id === selectedPlan)?.name}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {step === 'form' && (
          <div className="animate-fade-up mx-auto max-w-md">
            <div className="mb-6 flex items-center gap-3">
              <button type="button" onClick={() => setStep('plan')} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">← Voltar</button>
              <span className="rounded-full px-3 py-1 text-xs font-medium text-violet-300"
                style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}>
                Plano: {PLANS.find(p => p.id === selectedPlan)?.name}
                {PLANS.find(p => p.id === selectedPlan)?.monthly && (
                  <> — R$ {PLANS.find(p => p.id === selectedPlan)!.monthly}/mês</>
                )}
              </span>
            </div>

            <div className="rounded-2xl p-7" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Nome completo *</label>
                  <input type="text" value={form.name} onChange={(e) => field('name', e.target.value)} placeholder="Seu nome" required autoComplete="name" className={inputCls} style={inputStyle} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">CPF / CNPJ</label>
                    <input type="text" value={form.cpf_cnpj} onChange={(e) => field('cpf_cnpj', formatCPF(e.target.value))} placeholder="000.000.000-00" className={inputCls} style={inputStyle} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Telefone</label>
                    <input type="tel" value={form.phone} onChange={(e) => field('phone', formatPhone(e.target.value))} placeholder="(11) 99999-9999" autoComplete="tel" className={inputCls} style={inputStyle} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">E-mail *</label>
                  <input type="email" value={form.email} onChange={(e) => field('email', e.target.value)} placeholder="seu@email.com" required autoComplete="email" className={inputCls} style={inputStyle} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Senha *</label>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} value={form.password} onChange={(e) => field('password', e.target.value)} placeholder="Mínimo 6 caracteres" required autoComplete="new-password" className={`${inputCls} pr-10`} style={inputStyle} />
                    <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Confirmar senha *</label>
                  <div className="relative">
                    <input type={showPw2 ? 'text' : 'password'} value={form.confirmPassword} onChange={(e) => field('confirmPassword', e.target.value)} placeholder="Repita a senha" required autoComplete="new-password" className={`${inputCls} pr-10`} style={inputStyle} />
                    <button type="button" onClick={() => setShowPw2(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                      {showPw2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                {error && (
                  <div className="rounded-xl px-4 py-3 text-sm text-red-400" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</div>
                )}
                <button type="submit" disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', boxShadow: '0 4px 20px rgba(139,92,246,0.35)' }}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                  {loading ? 'Criando conta...' : PLANS.find(p => p.id === selectedPlan)?.monthly ? `Criar conta e pagar R$ ${PLANS.find(p => p.id === selectedPlan)!.monthly}` : 'Criar minha conta'}
                </button>
              </form>
            </div>
            <p className="mt-5 text-center text-xs text-zinc-600">
              Já tem conta? <Link href="/login" className="text-violet-400 hover:text-violet-300 transition-colors">Entrar</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
