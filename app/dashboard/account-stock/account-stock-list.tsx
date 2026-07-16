'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Eye, EyeOff, Pencil, Trash2, Ban, Package, AlertTriangle, RefreshCw, Send } from 'lucide-react'
import { AccountStock, AccountStatus, ProductType } from '@/types'
import { AccountForm } from './account-form'
import { XlsxImport } from './xlsx-import'
import { formatDate } from '@/lib/utils'

const statusConfig: Record<AccountStatus, { label: string; variant: 'success' | 'warning' | 'secondary' | 'destructive' | 'outline' }> = {
  available: { label: 'Disponível', variant: 'success' },
  reserved: { label: 'Reservada', variant: 'warning' },
  delivered: { label: 'Entregue', variant: 'secondary' },
  replaced: { label: 'Substituída', variant: 'outline' },
  blocked: { label: 'Bloqueada', variant: 'destructive' },
}

interface Stats { available: number; delivered: number; blocked: number; total: number }

interface AccountStockListProps {
  initialAccounts: AccountStock[]
  stats: Stats
  lowStockPlans: { name: string; available: number }[]
  bots: { id: string; name: string }[]
  plans: { id: string; name: string; bot_id: string; product_type_id: string | null }[]
  productTypes: ProductType[]
}

export function AccountStockList({ initialAccounts, stats, lowStockPlans, bots, plans, productTypes }: AccountStockListProps) {
  const [accounts, setAccounts] = useState(initialAccounts)
  const [currentStats, setCurrentStats] = useState(stats)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<AccountStock | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [filterStatus, setFilterStatus] = useState<AccountStatus | 'all'>('all')
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set())
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, string>>({})
  const [resendingId, setResendingId] = useState<string | null>(null)

  const filtered = filterStatus === 'all' ? accounts : accounts.filter((a) => a.status === filterStatus)

  function productTypeFor(account: AccountStock): ProductType | null {
    const planTypeId = (account.plan as { product_type_id?: string | null } | undefined)?.product_type_id
      ?? plans.find((p) => p.id === account.plan_id)?.product_type_id
    return planTypeId ? productTypes.find((pt) => pt.id === planTypeId) ?? null : null
  }

  async function handleReveal(id: string) {
    if (revealedIds.has(id)) {
      setRevealedIds((prev) => { const s = new Set(prev); s.delete(id); return s })
      return
    }
    const res = await fetch(`/api/account-stock/${id}/reveal`)
    const data = await res.json()
    if (res.ok) {
      setRevealedPasswords((prev) => ({ ...prev, [id]: data.password }))
      setRevealedIds((prev) => new Set(prev).add(id))
    }
  }

  async function handleStatusChange(id: string, status: AccountStatus) {
    const res = await fetch(`/api/account-stock/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      setAccounts((prev) => prev.map((a) => a.id === id ? { ...a, status } : a))
      toast.success('Status atualizado')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este item?')) return
    const res = await fetch(`/api/account-stock/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setAccounts((prev) => prev.filter((a) => a.id !== id))
      toast.success('Item excluído')
    }
  }

  async function handleResend(account: AccountStock) {
    setResendingId(account.id)
    try {
      const res = await fetch(`/api/account-stock/${account.id}/resend`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Erro ao reenviar'); return }
      toast.success('Dados reenviados ao cliente')
    } finally {
      setResendingId(null)
    }
  }

  function handleSaved(account: AccountStock) {
    if (editing) {
      setAccounts((prev) => prev.map((a) => a.id === account.id ? account : a))
    } else {
      setAccounts((prev) => [account, ...prev])
      setCurrentStats((s) => ({ ...s, available: s.available + 1, total: s.total + 1 }))
    }
    setShowForm(false)
    setEditing(null)
  }

  async function handleImported() {
    const res = await fetch('/api/account-stock')
    const data = await res.json()
    setAccounts(data)
  }

  return (
    <div className="space-y-6">
      {/* Low stock alerts */}
      {lowStockPlans.length > 0 && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
          <div className="flex items-center gap-2 text-yellow-600">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-sm font-medium">Estoque baixo</p>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {lowStockPlans.map((p) => (
              <span key={p.name} className="rounded-full px-3 py-1 text-xs" style={{ background: 'rgba(234,179,8,0.12)', color: '#92400e' }}>
                {p.name}: {p.available} item(ns)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Disponíveis', value: currentStats.available, color: '#16a34a', status: 'available' as const },
          { label: 'Entregues', value: currentStats.delivered, color: '#2563eb', status: 'delivered' as const },
          { label: 'Bloqueadas', value: currentStats.blocked, color: '#dc2626', status: 'blocked' as const },
          { label: 'Total', value: currentStats.total, color: '#3f3f46', status: 'all' as const },
        ].map(({ label, value, color, status }) => (
          <Card
            key={label}
            className="cursor-pointer transition-colors"
            style={filterStatus === status ? { boxShadow: '0 0 0 1px #7c3aed' } : undefined}
            onClick={() => setFilterStatus(status)}
          >
            <CardContent className="p-4 text-center">
              <p className="text-xs text-zinc-500">{label}</p>
              <p className="text-2xl font-bold" style={{ color }}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={() => setShowImport(!showImport)}>
          <Package className="mr-2 h-4 w-4" />
          Importar Planilha
        </Button>
        <Button onClick={() => { setEditing(null); setShowForm(true) }}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Item
        </Button>
      </div>

      {showImport && (
        <XlsxImport bots={bots} plans={plans} productTypes={productTypes} onImported={handleImported} />
      )}

      {(showForm || editing) && (
        <AccountForm
          bots={bots}
          plans={plans}
          productTypes={productTypes}
          account={editing ?? undefined}
          onSaved={handleSaved}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      )}

      {/* Filter tabs */}
      <div className="flex gap-1">
        {(['all', 'available', 'delivered', 'reserved', 'blocked', 'replaced'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
            style={filterStatus === s ? { background: '#7c3aed', color: '#fff' } : { background: 'rgba(0,0,0,0.05)', color: '#71717a' }}
          >
            {s === 'all' ? 'Todos' : statusConfig[s as AccountStatus]?.label ?? s}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Produto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Dados</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Plano</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Entregue a</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Data</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-zinc-500">Nenhum item encontrado</td></tr>
                ) : filtered.map((account) => {
                  const isRevealed = revealedIds.has(account.id)
                  const cfg = statusConfig[account.status]
                  const pt = productTypeFor(account)
                  return (
                    <tr key={account.id} className="border-b transition-colors hover:bg-black/[0.02]" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-zinc-700">{account.product_name}</p>
                        {account.extra_info && <p className="text-xs text-zinc-500">{account.extra_info}</p>}
                      </td>
                      <td className="px-4 py-3">
                        {pt ? (
                          <div className="space-y-0.5">
                            {pt.fields.map((f) => (
                              <p key={f.key} className="font-mono text-xs text-zinc-500">
                                <span className="text-zinc-400">{f.label}:</span> {account.custom_fields?.[f.key] || '—'}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <p className="font-mono text-xs text-zinc-600">{account.login}</p>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs text-zinc-500">
                                {isRevealed ? revealedPasswords[account.id] : '••••••••'}
                              </span>
                              <button onClick={() => handleReveal(account.id)} className="text-zinc-400 hover:text-zinc-600">
                                {isRevealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-500">{(account.plan as { name: string } | null)?.name ?? '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-500">{account.delivered_to_telegram_id ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-zinc-500">
                        {account.delivered_at ? formatDate(account.delivered_at) : account.created_at ? formatDate(account.created_at) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {account.status === 'delivered' && (
                            <Button size="sm" variant="outline" onClick={() => handleResend(account)} disabled={resendingId === account.id} title="Reenviar ao cliente">
                              <Send className="h-3 w-3" />
                            </Button>
                          )}
                          {account.status !== 'blocked' && account.status !== 'delivered' && (
                            <Button size="sm" variant="outline" onClick={() => handleStatusChange(account.id, 'blocked')} title="Bloquear">
                              <Ban className="h-3 w-3" />
                            </Button>
                          )}
                          {account.status === 'blocked' && (
                            <Button size="sm" variant="outline" onClick={() => handleStatusChange(account.id, 'available')} title="Reativar">
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => { setEditing(account); setShowForm(false) }}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(account.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
