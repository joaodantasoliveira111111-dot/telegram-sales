'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Filter } from 'lucide-react'
import { PaymentStatus } from '@/types'

const statusConfig: Record<PaymentStatus, string> = {
  paid: 'Pago',
  pending: 'Pendente',
  canceled: 'Cancelado',
  refunded: 'Reembolsado',
  chargeback: 'Chargeback',
}

interface Props {
  currentStatus: string | undefined
  currentBotId: string | undefined
  bots: { id: string; name: string }[]
}

function filterUrl(params: { status?: string; bot_id?: string }, overrides: Record<string, string | undefined>) {
  const q = new URLSearchParams()
  const merged = { status: params.status, bot_id: params.bot_id, page: '1', ...overrides }
  Object.entries(merged).forEach(([k, v]) => { if (v) q.set(k, v) })
  return `?${q.toString()}`
}

export function PaymentsFilters({ currentStatus, currentBotId, bots }: Props) {
  const router = useRouter()

  return (
    <div
      className="flex flex-wrap items-center gap-2 rounded-2xl p-3"
      style={{ background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(255,255,255,0.82)' }}
    >
      <Filter className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
      <span className="text-xs text-zinc-500 mr-1">Filtrar:</span>

      {(['', 'paid', 'pending', 'canceled', 'refunded', 'chargeback'] as const).map((s) => (
        <Link
          key={s}
          href={filterUrl({ status: currentStatus, bot_id: currentBotId }, { status: s || undefined })}
          className="rounded-lg px-2.5 py-1 text-xs font-medium transition-all"
          style={
            (currentStatus ?? '') === s
              ? { background: 'rgba(139,92,246,0.2)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)' }
              : { background: 'rgba(255,255,255,0.75)', color: '#71717a', border: '1px solid rgba(255,255,255,0.82)' }
          }
        >
          {s === '' ? 'Todos' : statusConfig[s as PaymentStatus] ?? s}
        </Link>
      ))}

      <div className="w-px h-4 bg-white/10 mx-1" />

      <select
        className="rounded-lg px-2.5 py-1 text-xs bg-transparent border text-zinc-400 cursor-pointer"
        style={{ border: '1px solid rgba(255,255,255,0.88)' }}
        value={currentBotId ?? ''}
        onChange={(e) => {
          const url = filterUrl({ status: currentStatus, bot_id: currentBotId }, { bot_id: e.target.value || undefined })
          router.push(url)
        }}
      >
        <option value="">Todos os bots</option>
        {bots.map((b) => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>
    </div>
  )
}
