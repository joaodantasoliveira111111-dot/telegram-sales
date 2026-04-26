'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { AccountStock } from '@/types'

interface AccountFormProps {
  bots: { id: string; name: string }[]
  plans: { id: string; name: string; bot_id: string }[]
  account?: AccountStock
  onSaved: (a: AccountStock) => void
  onCancel: () => void
}

export function AccountForm({ bots, plans, account, onSaved, onCancel }: AccountFormProps) {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    product_name: account?.product_name ?? '',
    bot_id: account?.bot_id ?? (bots[0]?.id ?? ''),
    plan_id: account?.plan_id ?? '',
    login: account?.login ?? '',
    password: account?.password ?? '',
    extra_info: account?.extra_info ?? '',
    notes: account?.notes ?? '',
    warranty_days: '',
  })

  const botPlans = plans.filter((p) => p.bot_id === form.bot_id)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const url = account ? `/api/account-stock/${account.id}` : '/api/account-stock'
      const method = account ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          plan_id: form.plan_id || null,
          bot_id: form.bot_id || null,
          extra_info: form.extra_info || null,
          notes: form.notes || null,
          warranty_days: form.warranty_days ? Number(form.warranty_days) : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erro ao salvar'); return }
      onSaved(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900/60">
      <CardHeader>
        <CardTitle className="text-zinc-100">{account ? 'Editar Conta' : 'Nova Conta'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="rounded-md bg-red-900/40 px-4 py-2 text-sm text-red-300">{error}</p>}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Produto / Nome</Label>
              <Input placeholder="CapCut Pro" value={form.product_name} onChange={(e) => setForm({ ...form, product_name: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Bot</Label>
              <Select value={form.bot_id} onValueChange={(v) => setForm({ ...form, bot_id: v, plan_id: '' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {bots.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Plano vinculado</Label>
            <Select value={form.plan_id || 'none'} onValueChange={(v) => setForm({ ...form, plan_id: v === 'none' ? '' : v })}>
              <SelectTrigger><SelectValue placeholder="Selecione um plano..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem vínculo</SelectItem>
                {botPlans.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-zinc-500">Vincular ao plano permite entrega automática após pagamento.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Login / E-mail</Label>
              <Input placeholder="usuario@email.com" value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Senha</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  className="pr-10"
                />
                <button type="button" className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Informações extras</Label>
              <Input placeholder="Ex: PIN, código de backup..." value={form.extra_info} onChange={(e) => setForm({ ...form, extra_info: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Garantia (dias)</Label>
              <Input type="number" min="0" placeholder="30" value={form.warranty_days} onChange={(e) => setForm({ ...form, warranty_days: e.target.value })} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Observações internas</Label>
            <Textarea placeholder="Notas internas sobre esta conta..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="min-h-[60px]" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {account ? 'Salvar' : 'Cadastrar Conta'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
