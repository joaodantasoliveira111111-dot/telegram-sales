'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Users, Plus, Copy, Check, Trash2, Pencil, X, DollarSign, TrendingUp, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Affiliate {
  id: string
  bot_id: string
  name: string
  code: string
  telegram_id: string | null
  commission_pct: number
  total_sales: number
  total_earned: number
  total_paid: number
  is_active: boolean
  created_at: string
}

interface Props {
  initialAffiliates: Affiliate[]
  bots: { id: string; name: string }[]
  baseUrl: string
}

function glass(active = false) {
  return active
    ? { background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }
    : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }
}

function AffiliateForm({ bots, initial, onSave, onCancel }: {
  bots: Props['bots']
  initial?: Partial<Affiliate>
  onSave: (a: Affiliate) => void
  onCancel: () => void
}) {
  const isEdit = !!initial?.id
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    bot_id: initial?.bot_id ?? '',
    name: initial?.name ?? '',
    commission_pct: initial?.commission_pct ?? 10,
    telegram_id: initial?.telegram_id ?? '',
  })

  function set(k: string, v: string | number) { setForm(f => ({ ...f, [k]: v })) }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const url = isEdit ? `/api/affiliates/${initial!.id}` : '/api/affiliates'
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, telegram_id: form.telegram_id || null }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success(isEdit ? 'Afiliado atualizado!' : 'Afiliado criado!')
      onSave(data)
    } finally { setLoading(false) }
  }

  return (
    <div className="rounded-2xl p-5 space-y-4" style={glass()}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">{isEdit ? 'Editar afiliado' : 'Novo afiliado'}</h3>
        <button onClick={onCancel} className="text-slate-500 hover:text-slate-300"><X className="h-4 w-4" /></button>
      </div>
      <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Nome do afiliado</Label>
          <Input placeholder="Ex: João Silva" value={form.name} onChange={e => set('name', e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Bot vinculado</Label>
          <select value={form.bot_id} onChange={e => set('bot_id', e.target.value)} required
            className="w-full rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <option value="">— Selecione —</option>
            {bots.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Comissão (%)</Label>
          <Input type="number" min={1} max={99} value={form.commission_pct} onChange={e => set('commission_pct', Number(e.target.value))} required />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Telegram ID do afiliado <span className="text-slate-600">(opcional — para notificações)</span></Label>
          <Input placeholder="Ex: 123456789" value={form.telegram_id} onChange={e => set('telegram_id', e.target.value)} />
        </div>
        <div className="sm:col-span-2 flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancelar</Button>
          <Button type="submit" size="sm" disabled={loading}>{loading ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar afiliado'}</Button>
        </div>
      </form>
    </div>
  )
}

function AffiliateCard({ affiliate, baseUrl, bots, onUpdate, onDelete }: {
  affiliate: Affiliate
  baseUrl: string
  bots: Props['bots']
  onUpdate: (a: Affiliate) => void
  onDelete: (id: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [copied, setCopied] = useState(false)
  const botName = bots.find(b => b.id === affiliate.bot_id)?.name ?? '—'
  const balance = affiliate.total_earned - affiliate.total_paid

  function copy() {
    const link = `${baseUrl}/api/telegram/${affiliate.bot_id}?ref=${affiliate.code}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    toast.success('Link copiado!')
    setTimeout(() => setCopied(false), 2000)
  }

  async function del() {
    if (!confirm(`Excluir afiliado "${affiliate.name}"?`)) return
    await fetch(`/api/affiliates/${affiliate.id}`, { method: 'DELETE' })
    onDelete(affiliate.id)
    toast.success('Afiliado excluído')
  }

  if (editing) return <AffiliateForm bots={bots} initial={affiliate} onSave={a => { onUpdate(a); setEditing(false) }} onCancel={() => setEditing(false)} />

  return (
    <div className="rounded-2xl p-5 space-y-4" style={glass(affiliate.is_active)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-slate-200">{affiliate.name}</p>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>{affiliate.code}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', color: '#64748b' }}>{botName}</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{affiliate.commission_pct}% de comissão por venda</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={copy} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-200" style={{ background: 'rgba(255,255,255,0.04)' }} title="Copiar link">
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          <button onClick={() => setEditing(true)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-200" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={del} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-red-400" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: TrendingUp, label: 'Vendas', value: affiliate.total_sales, color: 'text-blue-400' },
          { icon: DollarSign, label: 'Ganhou', value: `R$ ${Number(affiliate.total_earned).toFixed(2).replace('.', ',')}`, color: 'text-emerald-400' },
          { icon: DollarSign, label: 'A pagar', value: `R$ ${Number(balance).toFixed(2).replace('.', ',')}`, color: balance > 0 ? 'text-yellow-400' : 'text-slate-600' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="rounded-xl px-3 py-2.5 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <Icon className={`h-3.5 w-3.5 mx-auto mb-1 ${color}`} />
            <p className={`text-sm font-bold ${color}`}>{value}</p>
            <p className="text-[10px] text-slate-600">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-600">
        <LinkIcon className="h-3 w-3" />
        <span className="font-mono truncate">t.me/seubot?start=ref_{affiliate.code}</span>
      </div>
    </div>
  )
}

export function AffiliatesClient({ initialAffiliates, bots, baseUrl }: Props) {
  const [affiliates, setAffiliates] = useState(initialAffiliates)
  const [creating, setCreating] = useState(false)

  const totalEarned = affiliates.reduce((s, a) => s + Number(a.total_earned), 0)
  const totalOwed = affiliates.reduce((s, a) => s + Number(a.total_earned) - Number(a.total_paid), 0)

  const handleCreate = useCallback((a: Affiliate) => { setAffiliates(p => [a, ...p]); setCreating(false) }, [])
  const handleUpdate = useCallback((a: Affiliate) => { setAffiliates(p => p.map(x => x.id === a.id ? a : x)) }, [])
  const handleDelete = useCallback((id: string) => { setAffiliates(p => p.filter(x => x.id !== id)) }, [])

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-400" />
            Afiliados
          </h2>
          <p className="text-sm text-slate-500 mt-1">Gerencie afiliados e acompanhe comissões em tempo real.</p>
        </div>
        <Button onClick={() => setCreating(true)} className="gap-2" disabled={creating}>
          <Plus className="h-4 w-4" />Novo afiliado
        </Button>
      </div>

      {affiliates.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Total pago em comissões', value: `R$ ${totalEarned.toFixed(2).replace('.', ',')}`, color: 'text-emerald-400' },
            { label: 'A pagar agora', value: `R$ ${totalOwed.toFixed(2).replace('.', ',')}`, color: totalOwed > 0 ? 'text-yellow-400' : 'text-slate-500' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[11px] text-slate-500">{label}</p>
              <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {creating && <AffiliateForm bots={bots} onSave={handleCreate} onCancel={() => setCreating(false)} />}

      {affiliates.length === 0 && !creating ? (
        <div className="flex flex-col items-center justify-center rounded-2xl py-16 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
          <Users className="h-10 w-10 text-slate-700 mb-3" />
          <p className="text-slate-400 font-medium">Nenhum afiliado cadastrado</p>
          <p className="text-sm text-slate-600 mt-1">Crie afiliados para ampliar suas vendas automaticamente</p>
          <Button className="mt-5 gap-2" onClick={() => setCreating(true)}><Plus className="h-4 w-4" />Criar primeiro afiliado</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {affiliates.map(a => <AffiliateCard key={a.id} affiliate={a} baseUrl={baseUrl} bots={bots} onUpdate={handleUpdate} onDelete={handleDelete} />)}
        </div>
      )}
    </div>
  )
}
