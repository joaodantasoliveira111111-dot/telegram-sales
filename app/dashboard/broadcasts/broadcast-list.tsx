'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Send, Megaphone, Loader2, Users, UserX, Clock, UserCheck, RefreshCw, Pencil, Trash2 } from 'lucide-react'
import { BroadcastForm } from './broadcast-form'
import { formatDate } from '@/lib/utils'

const targetLabels: Record<string, { label: string; icon: typeof Users }> = {
  all:     { label: 'Todos os usuários',   icon: Users },
  unpaid:  { label: 'Não pagaram',         icon: UserX },
  expired: { label: 'Expirados',           icon: Clock },
  active:  { label: 'Assinantes ativos',   icon: UserCheck },
}

const statusVariants: Record<string, 'secondary' | 'warning' | 'success'> = {
  draft:     'secondary',
  scheduled: 'warning',
  sending:   'warning',
  sent:      'success',
}

const statusLabels: Record<string, string> = {
  draft:     'Rascunho',
  scheduled: 'Agendado',
  sending:   'Enviando...',
  sent:      'Enviado',
}

interface Broadcast {
  id: string
  bot_id?: string
  name: string
  message_text: string
  target_type: string
  status: string
  sent_count: number
  media_type?: string | null
  created_at: string
  bot?: { name: string }
}

interface BroadcastListProps {
  initialBroadcasts: Broadcast[]
  bots: { id: string; name: string; telegram_token: string }[]
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(20px)',
}

export function BroadcastList({ initialBroadcasts, bots }: BroadcastListProps) {
  const [broadcasts, setBroadcasts] = useState(initialBroadcasts)
  const [showForm, setShowForm] = useState(false)
  const [editingBroadcast, setEditingBroadcast] = useState<Broadcast | null>(null)
  const [sending, setSending] = useState<string | null>(null)
  const [runningCron, setRunningCron] = useState(false)
  const [botFilter, setBotFilter] = useState<string>('all')

  const filteredBroadcasts = botFilter === 'all' ? broadcasts : broadcasts.filter(b => b.bot_id === botFilter)

  async function handleRunScheduled() {
    setRunningCron(true)
    try {
      const res = await fetch('/api/cron/send-broadcasts')
      const data = await res.json()
      if (res.ok) {
        if (data.processed === 0) {
          toast.info('Nenhum agendamento pendente no momento.')
        } else {
          toast.success(`${data.processed} transmissão(ões) enviada(s) — ${data.sent} mensagens no total.`)
          window.location.reload()
        }
      } else {
        toast.error('Erro ao processar agendamentos')
      }
    } finally {
      setRunningCron(false)
    }
  }

  async function handleSend(id: string, isResend = false) {
    const msg = isResend
      ? 'Reenviar para usuários que ainda não receberam?'
      : 'Confirma o envio desta transmissão?'
    if (!confirm(msg)) return
    setSending(id)
    try {
      const res = await fetch(`/api/broadcasts/${id}/send`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        if (data.sent === 0) {
          toast.info('Nenhum usuário novo para enviar. Todos já receberam esta transmissão.')
        } else {
          toast.success(`Enviado para ${data.sent} usuário(s) novo(s)!${data.skipped > 0 ? ` (${data.skipped} já tinham recebido)` : ''}`)
        }
        setBroadcasts((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status: 'sent', sent_count: data.sent_count ?? b.sent_count } : b))
        )
      } else {
        toast.error(data.error ?? 'Erro ao enviar')
      }
    } finally {
      setSending(null)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta transmissão?')) return
    const res = await fetch(`/api/broadcasts/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setBroadcasts((prev) => prev.filter((b) => b.id !== id))
      toast.success('Transmissão excluída')
    }
  }

  function handleSaved(broadcast: Broadcast) {
    if (editingBroadcast) {
      setBroadcasts((prev) => prev.map((b) => (b.id === broadcast.id ? broadcast : b)))
      setEditingBroadcast(null)
    } else {
      setBroadcasts((prev) => [broadcast, ...prev])
      setShowForm(false)
    }
  }

  return (
    <div>
      {/* Bot filter tabs */}
      {bots.length > 1 && (
        <div className="mb-5 flex flex-wrap gap-1.5">
          <button
            onClick={() => setBotFilter('all')}
            className="rounded-xl px-3 py-1.5 text-xs font-semibold transition-all"
            style={botFilter === 'all'
              ? { background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)', color: '#93c5fd' }
              : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b' }}
          >
            Todos ({broadcasts.length})
          </button>
          {bots.map(bot => {
            const count = broadcasts.filter(b => b.bot_id === bot.id).length
            return (
              <button
                key={bot.id}
                onClick={() => setBotFilter(bot.id)}
                className="rounded-xl px-3 py-1.5 text-xs font-semibold transition-all"
                style={botFilter === bot.id
                  ? { background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)', color: '#93c5fd' }
                  : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b' }}
              >
                {bot.name} ({count})
              </button>
            )
          })}
        </div>
      )}

      <div className="mb-5 flex justify-end gap-2">
        <Button variant="outline" onClick={handleRunScheduled} disabled={runningCron} size="sm">
          {runningCron ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Processar Agendados
        </Button>
        <Button onClick={() => { setEditingBroadcast(null); setShowForm(true) }} size="sm">
          <Plus className="h-4 w-4" />
          Nova Transmissão
        </Button>
      </div>

      {(showForm || editingBroadcast) && (
        <div className="mb-5 animate-fade-up">
          <BroadcastForm
            bots={bots}
            broadcast={editingBroadcast ?? undefined}
            onSaved={handleSaved}
            onCancel={() => { setShowForm(false); setEditingBroadcast(null) }}
          />
        </div>
      )}

      {filteredBroadcasts.length === 0 && !showForm ? (
        <div
          className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-16 text-center"
          style={{ borderColor: 'rgba(255,255,255,0.07)' }}
        >
          <div
            className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <Megaphone className="h-7 w-7 text-slate-600" />
          </div>
          <p className="font-medium text-slate-400">Nenhuma transmissão criada</p>
          <p className="mt-1 text-sm text-slate-600">Crie uma para enviar remarketing aos seus usuários</p>
          <Button className="mt-4" size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            Nova Transmissão
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredBroadcasts.map((b) => {
            const target = targetLabels[b.target_type] ?? { label: b.target_type, icon: Users }
            const TargetIcon = target.icon
            const isSending = sending === b.id

            return (
              <div key={b.id} className="rounded-2xl p-5 transition-all duration-200 hover:border-white/[0.13]" style={cardStyle}>
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-100">{b.name}</p>
                    <p className="text-xs text-slate-500">{b.bot?.name}</p>
                  </div>
                  <Badge variant={statusVariants[b.status] ?? 'secondary'}>
                    {statusLabels[b.status] ?? b.status}
                  </Badge>
                </div>

                <p className="mb-3 line-clamp-2 text-sm text-slate-500 leading-relaxed">{b.message_text}</p>

                <div className="mb-4 flex flex-wrap gap-1.5">
                  <span
                    className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs text-slate-400"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    <TargetIcon className="h-3 w-3" />
                    {target.label}
                  </span>
                  {b.media_type && (
                    <span className="rounded-full px-2 py-0.5 text-xs text-slate-400" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      {b.media_type === 'image' ? '📷 Imagem' : '🎥 Vídeo'}
                    </span>
                  )}
                  {b.status === 'sent' && (
                    <span className="rounded-full px-2 py-0.5 text-xs text-emerald-400" style={{ background: 'rgba(52,211,153,0.1)' }}>
                      ✓ {b.sent_count} enviados
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-600">{formatDate(b.created_at)}</span>
                  <div className="flex gap-1.5">
                    {/* Edit — always available */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setEditingBroadcast(b); setShowForm(false) }}
                      title="Editar"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>

                    {/* Send draft */}
                    {b.status === 'draft' && (
                      <Button
                        size="sm"
                        onClick={() => handleSend(b.id)}
                        disabled={isSending}
                      >
                        {isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        Enviar
                      </Button>
                    )}

                    {/* Resend */}
                    {b.status === 'sent' && (
                      <Button size="sm" variant="outline" onClick={() => handleSend(b.id, true)} disabled={isSending}>
                        {isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                        Reenviar
                      </Button>
                    )}

                    {/* Delete */}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(b.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
