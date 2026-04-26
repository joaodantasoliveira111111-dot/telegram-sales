'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Eye, EyeOff, Pencil, Trash2, Ban, Package, AlertTriangle, RefreshCw, Send } from 'lucide-react'
import { AccountStock, AccountStatus } from '@/types'
import { AccountForm } from './account-form'
import { CsvImport } from './csv-import'
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
  plans: { id: string; name: string; bot_id: string }[]
}

export function AccountStockList({ initialAccounts, stats, lowStockPlans, bots, plans }: AccountStockListProps) {
  const [accounts, setAccounts] = useState(initialAccounts)
  const [currentStats, setCurrentStats] = useState(stats)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<AccountStock | null>(null)
  const [showCsv, setShowCsv] = useState(false)
  const [filterStatus, setFilterStatus] = useState<AccountStatus | 'all'>('all')
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set())
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, string>>({})

  const filtered = filterStatus === 'all' ? accounts : accounts.filter((a) => a.status === filterStatus)

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
    if (!confirm('Excluir esta conta?')) return
    const res = await fetch(`/api/account-stock/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setAccounts((prev) => prev.filter((a) => a.id !== id))
      toast.success('Conta excluída')
    }
  }

  async function handleResend(account: AccountStock) {
    if (!account.delivered_to_telegram_id) return
    const botId = account.bot_id
    if (!botId) { toast.error('Conta sem bot vinculado'); return }
    const { data: bot } = await fetch(`/api/bots`).then(r => r.json()).then((bots: {id: string; telegram_token: string}[]) => ({ data: bots.find(b => b.id === botId) }))
    if (!bot) { toast.error('Bot não encontrado'); return }

    const res = await fetch(`/api/account-stock/${account.id}/reveal`)
    const { password } = await res.json()

    const msg = `✅ *Reenvio de acesso*\n\n📧 Login: \`${account.login}\`\n🔑 Senha: \`${password}\`${account.extra_info ? `\n📋 Extra: ${account.extra_info}` : ''}`
    await fetch(`https://api.telegram.org/bot${(bot as {telegram_token: string}).telegram_token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: account.delivered_to_telegram_id, text: msg, parse_mode: 'Markdown' }),
    })
    toast.success('Dados reenviados ao cliente')
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
          <div className="flex items-center gap-2 text-yellow-400">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-sm font-medium">Estoque baixo</p>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {lowStockPlans.map((p) => (
              <span key={p.name} className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs text-yellow-300">
                {p.name}: {p.available} conta(s)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Disponíveis', value: currentStats.available, color: 'text-green-400', status: 'available' as const },
          { label: 'Entregues', value: currentStats.delivered, color: 'text-blue-400', status: 'delivered' as const },
          { label: 'Bloqueadas', value: currentStats.blocked, color: 'text-red-400', status: 'blocked' as const },
          { label: 'Total', value: currentStats.total, color: 'text-zinc-300', status: 'all' as const },
        ].map(({ label, value, color, status }) => (
          <Card
            key={label}
            className={`cursor-pointer border-zinc-800 bg-zinc-900/60 transition-colors ${filterStatus === status ? 'ring-1 ring-blue-500' : ''}`}
            onClick={() => setFilterStatus(status)}
          >
            <CardContent className="p-4 text-center">
              <p className="text-xs text-zinc-500">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={() => setShowCsv(!showCsv)}>
          <Package className="mr-2 h-4 w-4" />
          Importar CSV
        </Button>
        <Button onClick={() => { setEditing(null); setShowForm(true) }}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Conta
        </Button>
      </div>

      {showCsv && (
        <CsvImport bots={bots} plans={plans} onImported={handleImported} />
      )}

      {(showForm || editing) && (
        <AccountForm
          bots={bots}
          plans={plans}
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
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${filterStatus === s ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
          >
            {s === 'all' ? 'Todos' : statusConfig[s as AccountStatus]?.label ?? s}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card className="border-zinc-800 bg-zinc-900/60">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Produto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Login</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Senha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Plano</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Entregue a</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Data</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-zinc-600">Nenhuma conta encontrada</td></tr>
                ) : filtered.map((account) => {
                  const isRevealed = revealedIds.has(account.id)
                  const cfg = statusConfig[account.status]
                  return (
                    <tr key={account.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-zinc-200">{account.product_name}</p>
                        {account.extra_info && <p className="text-xs text-zinc-500">{account.extra_info}</p>}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-300">{account.login}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs text-zinc-400">
                            {isRevealed ? revealedPasswords[account.id] : '••••••••'}
                          </span>
                          <button onClick={() => handleReveal(account.id)} className="text-zinc-500 hover:text-zinc-300">
                            {isRevealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-400">{(account.plan as { name: string } | null)?.name ?? '—'}</td>
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
                            <Button size="sm" variant="outline" onClick={() => handleResend(account)} title="Reenviar ao cliente">
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
