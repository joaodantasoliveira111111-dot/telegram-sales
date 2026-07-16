export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromCookies, getUserBotIds } from '@/lib/session'
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
  const cookieStore = await cookies()
  const session = await getSessionFromCookies(cookieStore)

  let userBotIds: string[] | null = null
  if (session?.type === 'user') {
    userBotIds = await getUserBotIds(session.userId!)
  }

  const params = await searchParams
  const page = parseInt(params.page ?? '1')
  const limit = 20
  const offset = (page - 1) * limit

  let query = supabaseAdmin
    .from('subscriptions')
    .select('*, plan:plans(name, duration_days), bot:bots(name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (userBotIds !== null) {
    if (userBotIds.length === 0) query = query.in('bot_id', ['__none__'])
    else query = query.in('bot_id', userBotIds)
  }
  if (params.status) query = query.eq('status', params.status)

  const { data: subscriptions, count } = await query
  const total = count ?? 0

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold" style={{ color: '#1a1625' }}>Assinaturas</h2>
        <p className="text-sm" style={{ color: '#71717a' }}>{total} assinatura(s) encontrada(s)</p>
      </div>

      <div className="mb-4 flex gap-2">
        {(['', 'active', 'expired', 'canceled'] as const).map((s) => (
          <a
            key={s}
            href={s ? `?status=${s}` : '?'}
            className="rounded-full border px-3 py-1 text-xs transition-colors"
            style={
              params.status === s || (!params.status && !s)
                ? { borderColor: '#2563eb', background: '#2563eb', color: '#fff' }
                : { borderColor: 'rgba(0,0,0,0.12)', color: '#71717a' }
            }
          >
            {s === '' ? 'Todas' : statusConfig[s]?.label ?? s}
          </a>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: 'rgba(0,0,0,0.08)', background: 'rgba(0,0,0,0.03)' }}>
              <th className="px-4 py-3 text-left font-medium" style={{ color: '#71717a' }}>Telegram ID</th>
              <th className="px-4 py-3 text-left font-medium" style={{ color: '#71717a' }}>Bot</th>
              <th className="px-4 py-3 text-left font-medium" style={{ color: '#71717a' }}>Plano</th>
              <th className="px-4 py-3 text-left font-medium" style={{ color: '#71717a' }}>Status</th>
              <th className="px-4 py-3 text-left font-medium" style={{ color: '#71717a' }}>Expira em</th>
              <th className="px-4 py-3 text-left font-medium" style={{ color: '#71717a' }}>Criado em</th>
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
                <tr key={s.id} className="border-b transition-colors hover:bg-black/[0.02]" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: '#3f3f46' }}>{s.telegram_id}</td>
                  <td className="px-4 py-3" style={{ color: '#3f3f46' }}>
                    {(s.bot as { name: string } | null)?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3" style={{ color: '#3f3f46' }}>
                    {(s.plan as { name: string } | null)?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </td>
                  <td className="px-4 py-3" style={{ color: isExpiringSoon ? '#b45309' : '#52525b', fontWeight: isExpiringSoon ? 500 : 400 }}>
                    {formatDate(s.expires_at)}
                    {isExpiringSoon && ' ⚠️'}
                  </td>
                  <td className="px-4 py-3" style={{ color: '#52525b' }}>{formatDate(s.created_at)}</td>
                </tr>
              )
            })}
            {(subscriptions ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center" style={{ color: '#a1a1aa' }}>
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
              className="rounded-md border px-3 py-1 text-sm transition-colors hover:bg-black/5"
              style={{ borderColor: 'rgba(0,0,0,0.12)', color: '#3f3f46' }}
            >
              Anterior
            </a>
          )}
          {offset + limit < total && (
            <a
              href={`?page=${page + 1}`}
              className="rounded-md border px-3 py-1 text-sm transition-colors hover:bg-black/5"
              style={{ borderColor: 'rgba(0,0,0,0.12)', color: '#3f3f46' }}
            >
              Próximo
            </a>
          )}
        </div>
      )}
    </div>
  )
}
