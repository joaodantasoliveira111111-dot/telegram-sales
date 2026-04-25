export const dynamic = 'force-dynamic'

import { supabaseAdmin } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { PaymentStatus } from '@/types'

const statusConfig: Record<PaymentStatus, { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' | 'outline' }> = {
  paid: { label: 'Pago', variant: 'success' },
  pending: { label: 'Pendente', variant: 'warning' },
  canceled: { label: 'Cancelado', variant: 'destructive' },
  refunded: { label: 'Reembolsado', variant: 'secondary' },
  chargeback: { label: 'Chargeback', variant: 'destructive' },
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; bot_id?: string }>
}) {
  const params = await searchParams
  const page = parseInt(params.page ?? '1')
  const limit = 20
  const offset = (page - 1) * limit

  let query = supabaseAdmin
    .from('payments')
    .select('*, plan:plans(name, price), bot:bots(name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (params.status) query = query.eq('status', params.status)
  if (params.bot_id) query = query.eq('bot_id', params.bot_id)

  const { data: payments, count } = await query
  const total = count ?? 0

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Pagamentos</h2>
        <p className="text-sm text-zinc-400">{total} pagamento(s) encontrado(s)</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50">
              <th className="px-4 py-3 text-left font-medium text-zinc-400">Telegram ID</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-400">Bot</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-400">Plano</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-400">Valor</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-400">Status</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-400">Data</th>
            </tr>
          </thead>
          <tbody>
            {(payments ?? []).map((p) => {
              const status = p.status as PaymentStatus
              const cfg = statusConfig[status] ?? { label: status, variant: 'outline' as const }
              return (
                <tr key={p.id} className="border-b border-zinc-800/60 hover:bg-zinc-900/40">
                  <td className="px-4 py-3 font-mono text-xs text-zinc-300">{p.telegram_id}</td>
                  <td className="px-4 py-3 text-zinc-300">
                    {(p.bot as { name: string } | null)?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-zinc-300">
                    {(p.plan as { name: string } | null)?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 font-medium text-green-400">
                    {formatCurrency((p.plan as { price: number } | null)?.price ?? 0)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{formatDate(p.created_at)}</td>
                </tr>
              )
            })}
            {(payments ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                  Nenhum pagamento encontrado
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
