'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Smartphone, CheckCircle, LogOut, Loader2, Lock,
  MessageSquare, AlertTriangle, Zap, Info,
} from 'lucide-react'

interface Session {
  phone: string
  account_name: string
  account_username: string
  updated_at: string
}

interface Props {
  initialSession: Session | null
  hasApiKeys: boolean
}

type Step = 'idle' | 'sent_code' | 'needs_2fa' | 'connected'

const glassCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.72)',
  border: '1px solid rgba(255,255,255,0.84)',
  backdropFilter: 'blur(20px)',
}

export function TelegramConnectClient({ initialSession, hasApiKeys }: Props) {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(initialSession)
  const [step, setStep] = useState<Step>(initialSession ? 'connected' : 'idle')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRequestCode(e: React.FormEvent) {
    e.preventDefault()
    if (!phone) return
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/telegram-connect/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      toast.success('Código enviado! Verifique seu Telegram.')
      setStep('sent_code')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/telegram-connect/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), code: code.trim(), password: password || undefined }),
      })
      const data = await res.json()
      if (data.requires2FA) {
        setStep('needs_2fa')
        toast.info('Autenticação em 2 fatores necessária.')
        return
      }
      if (!res.ok) { setError(data.error); return }
      toast.success(data.message)
      setSession({ phone, account_name: data.accountName, account_username: data.accountUsername, updated_at: new Date().toISOString() })
      setStep('connected')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function handleDisconnect() {
    if (!confirm('Desconectar a conta do Telegram?')) return
    await fetch('/api/telegram-connect/status', { method: 'DELETE' })
    setSession(null)
    setStep('idle')
    setPhone('')
    setCode('')
    router.refresh()
    toast.success('Conta desconectada.')
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 animate-fade-up">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100">Conectar Telegram</h1>
        <p className="mt-1 text-sm text-slate-500">
          Conecte sua conta pessoal do Telegram para criar bots, canais e grupos diretamente pelo sistema.
        </p>
      </div>

      {/* API Keys Warning */}
      {!hasApiKeys && (
        <div
          className="flex items-start gap-3 rounded-2xl p-4"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-amber-300">Variáveis de ambiente necessárias</p>
            <p className="text-xs text-slate-400">
              Adicione no Vercel:<br />
              <code className="text-amber-400">TELEGRAM_API_ID</code> e{' '}
              <code className="text-amber-400">TELEGRAM_API_HASH</code>
            </p>
            <p className="text-xs text-slate-500">
              Obtenha em{' '}
              <a href="https://my.telegram.org/apps" target="_blank" rel="noopener" className="text-blue-400 hover:underline">
                my.telegram.org/apps
              </a>
            </p>
          </div>
        </div>
      )}

      {/* Connected state */}
      {step === 'connected' && session && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(52,211,153,0.2), rgba(16,185,129,0.1))',
                  border: '1px solid rgba(52,211,153,0.3)',
                  boxShadow: '0 0 20px rgba(52,211,153,0.15)',
                }}
              >
                <CheckCircle className="h-6 w-6 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-slate-100">{session.account_name}</p>
                  <Badge variant="success">Conectado</Badge>
                </div>
                {session.account_username && (
                  <p className="text-sm text-slate-400">@{session.account_username}</p>
                )}
                <p className="text-xs text-slate-600 mt-0.5">{session.phone}</p>
              </div>
            </div>

            <div
              className="mt-5 rounded-xl p-4 space-y-2"
              style={{ background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(255,255,255,0.80)' }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">O que você pode fazer</p>
              {[
                'Criar novos bots via @BotFather automaticamente',
                'Criar canais e grupos privados',
                'Alterar foto, nome e descrição de grupos',
                'Obter IDs de canais automaticamente',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-slate-400">
                  <Zap className="h-3.5 w-3.5 shrink-0 text-blue-400" />
                  {item}
                </div>
              ))}
              <p className="text-xs text-slate-600 mt-2">
                Funcionalidades avançadas em breve!
              </p>
            </div>

            <Button
              variant="destructive"
              size="sm"
              onClick={handleDisconnect}
              className="mt-4"
            >
              <LogOut className="h-4 w-4" />
              Desconectar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step: request phone */}
      {step === 'idle' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}
              >
                <Smartphone className="h-4.5 w-4.5 text-blue-400" />
              </div>
              <CardTitle className="text-base">Entrar com telefone</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRequestCode} className="space-y-4">
              {error && (
                <p className="rounded-xl px-4 py-2.5 text-sm text-red-300" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</p>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="phone">Número de telefone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+5511999999999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  disabled={!hasApiKeys}
                />
                <p className="text-xs text-slate-600">
                  Com código do país. Ex: +55 para Brasil
                </p>
              </div>
              <Button type="submit" disabled={loading || !hasApiKeys} className="w-full">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                Enviar código
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step: verify code */}
      {(step === 'sent_code' || step === 'needs_2fa') && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}
              >
                <Lock className="h-4.5 w-4.5 text-violet-400" />
              </div>
              <div>
                <CardTitle className="text-base">
                  {step === 'needs_2fa' ? 'Senha de duas etapas' : 'Confirmar código'}
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  {step === 'needs_2fa'
                    ? 'Sua conta tem verificação em 2 etapas ativada'
                    : `Código enviado para ${phone}`}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerifyCode} className="space-y-4">
              {error && (
                <p className="rounded-xl px-4 py-2.5 text-sm text-red-300" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</p>
              )}

              {step === 'sent_code' && (
                <div className="space-y-1.5">
                  <Label htmlFor="code">Código do Telegram</Label>
                  <Input
                    id="code"
                    placeholder="12345"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    maxLength={6}
                    required
                    autoFocus
                  />
                  <p className="text-xs text-slate-600">
                    Abra o Telegram e veja a mensagem com o código
                  </p>
                </div>
              )}

              {step === 'needs_2fa' && (
                <div className="space-y-1.5">
                  <Label htmlFor="password">Senha de duas etapas</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Sua senha do Telegram"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setStep('idle'); setCode(''); setError('') }}
                  className="flex-1"
                >
                  Voltar
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  {step === 'needs_2fa' ? 'Confirmar senha' : 'Verificar código'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Info card */}
      <div
        className="flex items-start gap-3 rounded-2xl p-4"
        style={{ background: 'rgba(255,255,255,0.68)', border: '1px solid rgba(255,255,255,0.80)' }}
      >
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
        <div className="space-y-1 text-xs text-slate-600">
          <p>A sessão é armazenada de forma segura no banco de dados.</p>
          <p>Esta é sua conta pessoal — o sistema age em seu nome para criar bots e canais.</p>
          <p>Você pode desconectar a qualquer momento.</p>
        </div>
      </div>
    </div>
  )
}
