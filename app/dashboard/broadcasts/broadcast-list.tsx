'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Send, Megaphone, Loader2, Users, UserX, Clock, UserCheck } from 'lucide-react'
import { BroadcastForm } from './broadcast-form'
import { formatDate } from '@/lib/utils'

const targetLabels: Record<string, { label: string; icon: typeof Users }> = {
  all: { label: 'Todos os usuários', icon: Users },
  unpaid: { label: 'Não pagaram', icon: UserX },
  expired: { label: 'Expirados', icon: Clock },
  active: { label: 'Assinantes ativos', icon: UserCheck },
}

const statusVariants: Record<string, 'secondary' | 'warning' | 'success'> = {
  draft: 'secondary',
  sending: 'warning',
  sent: 'success',
}

const statusLabels: Record<string, string> = {
  draft: 'Rascunho',
  sending: 'Enviando...',
  sent: 'Enviado',
}

interface Broadcast {
  id: string
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

export function BroadcastList({ initialBroadcasts, bots }: BroadcastListProps) {
  const [broadcasts, setBroadcasts] = useState(initialBroadcasts)
  const [showForm, setShowForm] = useState(false)
  const [sending, setSending] = useState<string | null>(null)

  async function handleSend(id: string) {
    if (!confirm('Confirma o envio desta transmissão?')) return
    setSending(id)
    try {
      const res = await fetch(`/api/broadcasts/${id}/send`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Transmissão enviada para ${data.sent} usuário(s)!`)
        setBroadcasts((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status: 'sent', sent_count: data.sent } : b))
        )
      } else {
        toast.error(data.error ?? 'Erro ao enviar')
      }
    } finally {
      setSending(null)
    }
  }

  function handleSaved(broadcast: Broadcast) {
    setBroadcasts((prev) => [broadcast, ...prev])
    setShowForm(false)
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Transmissão
        </Button>
      </div>

      {showForm && (
        <div className="mb-6">
          <BroadcastForm
            bots={bots}
            onSaved={handleSaved}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {broadcasts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 py-16 text-center">
          <Megaphone className="mb-3 h-10 w-10 text-zinc-600" />
          <p className="text-zinc-400">Nenhuma transmissão criada</p>
          <p className="text-sm text-zinc-600">Crie uma para enviar remarketing</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {broadcasts.map((b) => {
            const target = targetLabels[b.target_type] ?? { label: b.target_type, icon: Users }
            const TargetIcon = target.icon
            const isSending = sending === b.id

            return (
              <Card key={b.id} className="border-zinc-800 bg-zinc-900/60">
                <CardHeader className="flex flex-row items-start justify-between pb-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="truncate text-base text-zinc-100">{b.name}</CardTitle>
                    <p className="text-xs text-zinc-500">{b.bot?.name}</p>
                  </div>
                  <Badge variant={statusVariants[b.status] ?? 'secondary'}>
                    {statusLabels[b.status] ?? b.status}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="line-clamp-2 text-sm text-zinc-400">{b.message_text}</p>

                  <div className="flex flex-wrap gap-2">
                    <span className="flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                      <TargetIcon className="h-3 w-3" />
                      {target.label}
                    </span>
                    {b.media_type && (
                      <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                        {b.media_type === 'image' ? '📷 Imagem' : '🎥 Vídeo'}
                      </span>
                    )}
                    {b.status === 'sent' && (
                      <span className="rounded-full bg-green-900/40 px-2 py-0.5 text-xs text-green-400">
                        ✓ {b.sent_count} enviados
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-600">{formatDate(b.created_at)}</span>
                    {b.status === 'draft' && (
                      <Button
                        size="sm"
                        onClick={() => handleSend(b.id)}
                        disabled={isSending}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isSending ? (
                          <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                        ) : (
                          <Send className="mr-1.5 h-3 w-3" />
                        )}
                        Enviar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
