'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Users, DollarSign, Clock, TrendingUp, Search, Filter,
  CheckCircle2, XCircle, MoreHorizontal, Send, Ban, RefreshCw
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

const PLAN_LABELS: Record<string, string> = {
  pay_per_use: 'Pay-per-use',
  starter: 'Starter',
  pro: 'Pro',
}
const PLAN_COLORS: Record<string, string> = {
  pay_per_use: 'secondary',
  starter: 'warning',
  pro: 'success',
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color: string
}) {
  return (
    <div className="rounded-2xl p-4 flex items-start gap-3"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <div>
        <p className="text-xs text-zinc-500">{label}</p>
        <p className="text-lg font-bold text-zinc-100 leading-tight">{value}</p>
        {sub && <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

interface SaasUser {
  id: string
  name: string
  email: string
  phone: string | null
  cpf_cnpj: string | null
  plan_type: string
  is_active: boolean
  sales_count_cycle: number
  pending_fee_total: number
  payout_pending: number
  payout_total_released: number
  created_at: string
}

interface Props {
  users: SaasUser[]
  total: number
  page: number
  limit: number
  stats: {
    total: number
    active: number
    pendingFees: number
    payoutPending: number
    totalReleased: number
  }
  filters: { plan?: string; status?: string; q?: string }
}

export function UsersClient({ users, total, page, limit, stats, filters }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [search, setSearch] = useState(filters.q ?? '')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const totalPages = Math.ceil(total / limit)

  function filterUrl(overrides: Record<string, string | undefined>) {
    const q = new URLSearchParams()
    const merged = { plan: filters.plan, status: filters.status, q: filters.q, page: '1', ...overrides }
    Object.entries(merged).forEach(([k, v]) => { if (v) q.set(k, v) })
    return `/dashboard/users?${q.toString()}`
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    router.push(filterUrl({ q: search || undefined }))
  }

  async function toggleActive(userId: string, currentlyActive: boolean) {
    setActionLoading(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentlyActive }),
      })
      if (!res.ok) { toast.error('Erro ao atualizar usuário'); return }
      toast.success(currentlyActive ? 'Usuário desativado' : 'Usuário ativado')
      startTransition(() => router.refresh())
    } finally {
      setActionLoading(null)
    }
  }

  async function releasePayout(userId: string, amount: number) {
    if (!confirm(`Liberar ${formatCurrency(amount)} para este produtor?`)) return
    setActionLoading(`payout-${userId}`)
    try {
      const res = await fetch(`/api/admin/users/${userId}/payout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      })
      if (!res.ok) { toast.error('Erro ao liberar pagamento'); return }
      toast.success(`${formatCurrency(amount)} marcado como liberado!`)
      startTransition(() => router.refresh())
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Usuários</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Gerenciar produtores e repasses</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard icon={Users} label="Total" value={String(stats.total)} sub={`${stats.active} ativos`} color="#8b5cf6" />
        <StatCard icon={TrendingUp} label="Planos Ativos" value={String(stats.active)} color="#22c55e" />
        <StatCard icon={Clock} label="Taxas Pendentes" value={formatCurrency(stats.pendingFees)} sub="a cobrar" color="#f59e0b" />
        <StatCard icon={DollarSign} label="A Repassar" value={formatCurrency(stats.payoutPending)} sub="produtores" color="#ef4444" />
        <StatCard icon={CheckCircle2} label="Total Liberado" value={formatCurrency(stats.totalReleased)} color="#06b6d4" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl p-3"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <Filter className="h-3.5 w-3.5 text-zinc-500 shrink-0" />

        {/* Search */}
        <form onSubmit={handleSearch} className="flex items-center gap-1">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nome ou e-mail..."
            className="rounded-lg px-3 py-1 text-xs bg-white/5 border text-zinc-300 placeholder-zinc-600 outline-none"
            style={{ borderColor: 'rgba(255,255,255,0.1)' }}
          />
          <button type="submit" className="rounded-lg p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors">
            <Search className="h-3.5 w-3.5" />
          </button>
        </form>

        <div className="w-px h-4 bg-white/10" />

        {/* Plan filter */}
        {['', 'pay_per_use', 'starter', 'pro'].map((p) => (
          <Link key={p} href={filterUrl({ plan: p || undefined })}
            className="rounded-lg px-2.5 py-1 text-xs font-medium transition-all"
            style={(filters.plan ?? '') === p
              ? { background: 'rgba(139,92,246,0.2)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)' }
              : { background: 'rgba(255,255,255,0.04)', color: '#71717a', border: '1px solid rgba(255,255,255,0.07)' }}>
            {p === '' ? 'Todos os planos' : PLAN_LABELS[p]}
          </Link>
        ))}

        <div className="w-px h-4 bg-white/10" />

        {/* Status filter */}
        {[['', 'Todos'], ['active', 'Ativos'], ['inactive', 'Inativos']].map(([v, l]) => (
          <Link key={v} href={filterUrl({ status: v || undefined })}
            className="rounded-lg px-2.5 py-1 text-xs font-medium transition-all"
            style={(filters.status ?? '') === v
              ? { background: 'rgba(139,92,246,0.2)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)' }
              : { background: 'rgba(255,255,255,0.04)', color: '#71717a', border: '1px solid rgba(255,255,255,0.07)' }}>
            {l}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)' }}>
              {['Usuário', 'Plano', 'Vendas/Ciclo', 'Taxas Pendentes', 'A Repassar', 'Status', 'Cadastro', 'Ações'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user, i) => (
              <tr key={user.id} className="table-row-hover transition-colors"
                style={{ borderBottom: i < users.length - 1 ? '1px solid rgba(255,255,255,0.05)' : undefined }}>
                <td className="px-4 py-3">
                  <div>
                    <p className="text-xs font-medium text-zinc-200">{user.name}</p>
                    <p className="text-xs text-zinc-500">{user.email}</p>
                    {user.phone && <p className="text-xs text-zinc-600">{user.phone}</p>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={(PLAN_COLORS[user.plan_type] ?? 'secondary') as 'secondary'}>
                    {PLAN_LABELS[user.plan_type] ?? user.plan_type}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-xs text-zinc-300 font-mono">{user.sales_count_cycle}</td>
                <td className="px-4 py-3 text-xs font-semibold text-amber-400">{formatCurrency(user.pending_fee_total)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-emerald-400">{formatCurrency(user.payout_pending)}</span>
                    {user.payout_pending > 0 && (
                      <button
                        onClick={() => releasePayout(user.id, user.payout_pending)}
                        disabled={actionLoading === `payout-${user.id}`}
                        className="rounded-lg px-2 py-0.5 text-xs font-medium text-white transition-all hover:opacity-80 disabled:opacity-50"
                        style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.3)' }}
                        title="Marcar como liberado"
                      >
                        <Send className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className={`h-1.5 w-1.5 rounded-full ${user.is_active ? 'bg-emerald-400' : 'bg-zinc-600'}`}
                      style={user.is_active ? { boxShadow: '0 0 6px rgba(52,211,153,0.5)' } : undefined} />
                    <span className={`text-xs ${user.is_active ? 'text-emerald-400' : 'text-zinc-500'}`}>
                      {user.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-zinc-500">{formatDate(user.created_at)}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(user.id, user.is_active)}
                    disabled={actionLoading === user.id}
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all hover:opacity-80 disabled:opacity-50"
                    style={user.is_active
                      ? { background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }
                      : { background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' }}
                  >
                    {actionLoading === user.id ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : user.is_active ? (
                      <><Ban className="h-3 w-3" /> Desativar</>
                    ) : (
                      <><CheckCircle2 className="h-3 w-3" /> Ativar</>
                    )}
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-zinc-600 text-sm">
                  Nenhum usuário encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-500">{total} usuários · página {page} de {totalPages}</p>
          <div className="flex gap-1.5">
            {page > 1 && (
              <Link href={filterUrl({ page: String(page - 1) })}
                className="rounded-xl px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                Anterior
              </Link>
            )}
            {page < totalPages && (
              <Link href={filterUrl({ page: String(page + 1) })}
                className="rounded-xl px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                Próximo
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
