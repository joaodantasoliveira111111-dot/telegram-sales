export const dynamic = 'force-dynamic'

import { supabaseAdmin } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { SubscriptionStatus } from '@/types'

const statusConfig: Record<SubscriptionStatus, { label: string; variant: 'success' | 'secondary' | 'destructive' }> = {
  active: { label: 'Ativa', variant: 'success' },
  expired: { label: 'Expirada', variant: 'secondary' },
  canceled: { label: 'Cancelada', variant: 'destructive' },
}

export default async function SubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>
}) {
  const params = await searchParams
  const page = parseInt(params.page ?? '1')
  const limit = 20
  const offset = (page - 1) * limit

  let query = supabaseAdmin
    .from('subscriptions')
    .select('*, plan:plans(name, duration_days), bot:bots(name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (params.status) query = query.eq('status', params.status)

  const { data: subscriptions, count } = await query
  const total = count ?? 0

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Assinaturas</h2>
        <p className="text-sm text-zinc-400">{total} assinatura(s) encontrada(s)</p>
      </div>

      <div className="mb-4 flex gap-2">
        {(['', 'active', 'expired', 'canceled'] as const).map((s) => (
          <a
            key={s}
            href={s ? `?status=${s}` : '?'}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              params.status === s || (!params.status && !s)
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            {s === '' ? 'Todas' : statusConfig[s]?.label ?? s}
          </a>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50">
              <th className="px-4 py-3 text-left font-medium text-zinc-400">Telegram ID</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-400">Bot</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-400">Plano</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-400">Status</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-400">Expira em</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-400">Criado em</th>
            </tr>
          </thead>
          <tbody>
            {(subscriptions ?? []).map((s) => {
              const status = s.status as SubscriptionStatus
              const cfg = statusConfig[status] ?? { label: status, variant: 'outline' as const }
              const isExpiringSoon =
                status === 'active' &&
                new Date(s.expires_at) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)

              return (
                <tr key={s.id} className="border-b border-zinc-800/60 hover:bg-zinc-900/40">
                  <td className="px-4 py-3 font-mono text-xs text-zinc-300">{s.telegram_id}</td>
                  <td className="px-4 py-3 text-zinc-300">
                    {(s.bot as { name: string } | null)?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-zinc-300">
                    {(s.plan as { name: string } | null)?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </td>
                  <td className={`px-4 py-3 ${isExpiringSoon ? 'text-yellow-400 font-medium' : 'text-zinc-400'}`}>
                    {formatDate(s.expires_at)}
                    {isExpiringSoon && ' ⚠️'}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{formatDate(s.created_at)}</td>
                </tr>
              )
            })}
            {(subscriptions ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                  Nenhuma assinatura encontrada
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {total > limit && (
        <div className="mt-4 flex justify-center gap-2">
          {page > 1 && (
            <a
              href={`?page=${page - 1}`}
              className="rounded-md border border-zinc-700 px-3 py-1 text-sm hover:bg-zinc-800"
            >
              Anterior
            </a>
          )}
          {offset + limit < total && (
            <a
              href={`?page=${page + 1}`}
              className="rounded-md border border-zinc-700 px-3 py-1 text-sm hover:bg-zinc-800"
            >
              Próximo
            </a>
          )}
        </div>
      )}
    </div>
  )
}
