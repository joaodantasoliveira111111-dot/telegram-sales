export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromCookies, getUserBotIds } from '@/lib/session'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { PaymentStatus } from '@/types'
import { DollarSign, TrendingUp, Clock, XCircle } from 'lucide-react'
import Link from 'next/link'
import { PaymentsFilters } from './payments-filters'

const statusConfig: Record<PaymentStatus, { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' | 'outline' }> = {
  paid: { label: 'Pago', variant: 'success' },
  pending: { label: 'Pendente', variant: 'warning' },
  canceled: { label: 'Cancelado', variant: 'destructive' },
  refunded: { label: 'Reembolsado', variant: 'secondary' },
  chargeback: { label: 'Chargeback', variant: 'destructive' },
}

// filterUrl used only for pagination links
function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color: string
}) {
  return (
    <div
      className="rounded-2xl p-4 flex items-start gap-3"
      style={{ background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.84)' }}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ background: `${color}20`, border: `1px solid ${color}40` }}
      >
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

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; bot_id?: string }>
}) {
  const cookieStore = await cookies()
  const session = await getSessionFromCookies(cookieStore)

  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1'))
  const limit = 25
  const offset = (page - 1) * limit

  // Resolve bot IDs for scoping
  let userBotIds: string[] | null = null
  if (session?.type === 'user') {
    userBotIds = await getUserBotIds(session.userId!)
  }

  // Stats query (all time)
  let statsQ = supabaseAdmin.from('payments').select('status, plan:plans(price)')
  if (userBotIds !== null) {
    if (userBotIds.length === 0) statsQ = statsQ.in('bot_id', ['__none__'])
    else statsQ = statsQ.in('bot_id', userBotIds)
  }
  const { data: statsData } = await statsQ

  const paid = (statsData ?? []).filter(p => p.status === 'paid')
  const pending = (statsData ?? []).filter(p => p.status === 'pending')
  const refunded = (statsData ?? []).filter(p => p.status === 'refunded' || p.status === 'chargeback')

  type PlanSnap = { price: number } | null
  const sumPaid = paid.reduce((a, p) => a + ((p.plan as unknown as PlanSnap)?.price ?? 0), 0)
  const sumPending = pending.reduce((a, p) => a + ((p.plan as unknown as PlanSnap)?.price ?? 0), 0)

  // Bots for filter dropdown (scoped)
  let botsQ = supabaseAdmin.from('bots').select('id, name').order('name')
  if (userBotIds !== null) {
    if (userBotIds.length === 0) botsQ = botsQ.in('id', ['__none__'])
    else botsQ = botsQ.in('id', userBotIds)
  }
  const { data: bots } = await botsQ

  // Main query with filters
  let query = supabaseAdmin
    .from('payments')
    .select('*, plan:plans(name, price), bot:bots(name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (userBotIds !== null) {
    if (userBotIds.length === 0) query = query.in('bot_id', ['__none__'])
    else query = query.in('bot_id', userBotIds)
  }
  if (params.status) query = query.eq('status', params.status)
  if (params.bot_id) query = query.eq('bot_id', params.bot_id)

  const { data: payments, count } = await query
  const total = count ?? 0
  const totalPages = Math.ceil(total / limit)

  function filterUrl(overrides: Record<string, string | undefined>) {
    const q = new URLSearchParams()
    const merged = { status: params.status, bot_id: params.bot_id, page: '1', ...overrides }
    Object.entries(merged).forEach(([k, v]) => { if (v) q.set(k, v) })
    return `?${q.toString()}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Pagamentos</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Histórico de todas as transações</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={DollarSign} label="Receita Total" value={formatCurrency(sumPaid)} sub={`${paid.length} vendas`} color="#22c55e" />
        <StatCard icon={TrendingUp} label="Total de Vendas" value={String(paid.length)} sub="pagamentos confirmados" color="#8b5cf6" />
        <StatCard icon={Clock} label="Pendentes" value={formatCurrency(sumPending)} sub={`${pending.length} aguardando`} color="#f59e0b" />
        <StatCard icon={XCircle} label="Estornos" value={String(refunded.length)} sub="reembolsos + chargebacks" color="#ef4444" />
      </div>

      {/* Filters */}
      <PaymentsFilters
        currentStatus={params.status}
        currentBotId={params.bot_id}
        bots={bots ?? []}
      />

      {/* Table */}
      <div
        className="overflow-x-auto rounded-2xl"
        style={{ border: '1px solid rgba(255,255,255,0.84)' }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.80)', background: 'rgba(255,255,255,0.72)' }}>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Telegram ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Bot</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Plano</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Valor</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Data</th>
            </tr>
          </thead>
          <tbody>
            {(payments ?? []).map((p, i) => {
              const status = p.status as PaymentStatus
              const cfg = statusConfig[status] ?? { label: status, variant: 'outline' as const }
              return (
                <tr
                  key={p.id}
                  className="table-row-hover transition-colors"
                  style={{ borderBottom: i < (payments ?? []).length - 1 ? '1px solid rgba(255,255,255,0.78)' : undefined }}
                >
                  <td className="px-4 py-3 font-mono text-xs text-zinc-400">{p.telegram_id}</td>
                  <td className="px-4 py-3 text-zinc-300 text-xs">{(p.bot as { name: string } | null)?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{(p.plan as { name: string } | null)?.name ?? '—'}</td>
                  <td className="px-4 py-3 font-semibold text-emerald-400 text-xs">
                    {formatCurrency((p.plan as { price: number } | null)?.price ?? 0)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">{formatDate(p.created_at)}</td>
                </tr>
              )
            })}
            {(payments ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-zinc-600">
                  Nenhum pagamento encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-500">{total} registros · página {page} de {totalPages}</p>
          <div className="flex gap-1.5">
            {page > 1 && (
              <Link
                href={filterUrl({ page: String(page - 1) })}
                className="rounded-xl px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.88)' }}
              >
                Anterior
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={filterUrl({ page: String(page + 1) })}
                className="rounded-xl px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.88)' }}
              >
                Próximo
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
