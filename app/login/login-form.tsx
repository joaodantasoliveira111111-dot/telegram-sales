'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Eye, EyeOff, ArrowRight } from 'lucide-react'

type LoginMode = 'user' | 'admin'

export function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [mode, setMode] = useState<LoginMode>('user')
  const [identifier, setIdentifier] = useState('')  // email (user) or username (admin)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const isAdmin = mode === 'admin'
      const endpoint = isAdmin ? '/api/auth/login' : '/api/auth/user-login'
      const body = isAdmin
        ? { username: identifier, password }
        : { email: identifier, password }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Erro ao fazer login')
        return
      }

      const from = params.get('from') ?? '/dashboard'
      router.push(from)
      router.refresh()
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = "w-full rounded-xl border px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-all bg-white/5 focus:ring-2 focus:ring-violet-500/30"
  const inputStyle = { borderColor: 'rgba(255,255,255,0.1)' }

  return (
    <div className="flex min-h-screen items-center justify-center px-4"
      style={{ background: 'var(--background)' }}>

      {/* Bg blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)' }} />
      </div>

      <div className="relative w-full max-w-sm animate-fade-up">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl overflow-hidden"
            style={{ boxShadow: '0 0 32px rgba(139,92,246,0.4)', border: '1px solid rgba(139,92,246,0.3)' }}>
            <img src="/logo.svg" alt="FlowBot" className="h-14 w-14" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">FlowBot</h1>
          <p className="mt-1 text-sm text-zinc-500">Acesse seu painel</p>
        </div>

        {/* Mode tabs */}
        <div
          className="flex gap-1 rounded-xl p-1 mb-6"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {(['user', 'admin'] as LoginMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError(''); setIdentifier(''); setPassword('') }}
              className="flex-1 rounded-lg py-2 text-xs font-semibold transition-all duration-150"
              style={mode === m ? {
                background: 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(99,102,241,0.15))',
                color: '#a78bfa',
                border: '1px solid rgba(139,92,246,0.3)',
              } : { color: '#71717a' }}
            >
              {m === 'user' ? 'Minha Conta' : 'Admin'}
            </button>
          ))}
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-7"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {mode === 'user' ? 'E-mail' : 'Usuário'}
              </label>
              <input
                type={mode === 'user' ? 'email' : 'text'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={mode === 'user' ? 'seu@email.com' : 'admin'}
                required
                autoComplete={mode === 'user' ? 'email' : 'username'}
                className={inputCls}
                style={inputStyle}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  required
                  autoComplete="current-password"
                  className={`${inputCls} pr-10`}
                  style={inputStyle}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl px-4 py-3 text-sm text-red-400"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', boxShadow: '0 4px 20px rgba(139,92,246,0.35)' }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        {mode === 'user' && (
          <p className="mt-5 text-center text-xs text-zinc-600">
            Não tem conta?{' '}
            <Link href="/register" className="text-violet-400 hover:text-violet-300 transition-colors font-medium">
              Criar conta grátis
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
