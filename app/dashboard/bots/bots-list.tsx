'use client'

import { useState } from 'react'
import { Bot as BotType } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, Bot } from 'lucide-react'
import { BotForm } from './bot-form'
import { formatDate } from '@/lib/utils'

interface BotsListProps {
  initialBots: BotType[]
}

export function BotsList({ initialBots }: BotsListProps) {
  const [bots, setBots] = useState<BotType[]>(initialBots)
  const [showForm, setShowForm] = useState(false)
  const [editingBot, setEditingBot] = useState<BotType | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este bot?')) return
    const res = await fetch(`/api/bots/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setBots((prev) => prev.filter((b) => b.id !== id))
    }
  }

  async function handleToggle(bot: BotType) {
    const res = await fetch(`/api/bots/${bot.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !bot.is_active }),
    })
    if (res.ok) {
      const updated = await res.json()
      setBots((prev) => prev.map((b) => (b.id === bot.id ? updated : b)))
    }
  }

  function handleSaved(bot: BotType) {
    if (editingBot) {
      setBots((prev) => prev.map((b) => (b.id === bot.id ? bot : b)))
    } else {
      setBots((prev) => [bot, ...prev])
    }
    setShowForm(false)
    setEditingBot(null)
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button
          onClick={() => {
            setEditingBot(null)
            setShowForm(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Bot
        </Button>
      </div>

      {(showForm || editingBot) && (
        <div className="mb-6">
          <BotForm
            bot={editingBot ?? undefined}
            onSaved={handleSaved}
            onCancel={() => {
              setShowForm(false)
              setEditingBot(null)
            }}
          />
        </div>
      )}

      {bots.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 py-16 text-center">
          <Bot className="mb-3 h-10 w-10 text-zinc-600" />
          <p className="text-zinc-400">Nenhum bot cadastrado</p>
          <p className="text-sm text-zinc-600">Clique em &quot;Novo Bot&quot; para começar</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bots.map((bot) => (
            <Card key={bot.id}>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <CardTitle className="text-base">{bot.name}</CardTitle>
                <Badge variant={bot.is_active ? 'success' : 'secondary'}>
                  {bot.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="mb-1 text-xs text-zinc-500">Criado em {formatDate(bot.created_at)}</p>
                <p className="mb-4 text-sm text-zinc-400 line-clamp-2">{bot.welcome_message}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleToggle(bot)}>
                    {bot.is_active ? 'Desativar' : 'Ativar'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingBot(bot)
                      setShowForm(false)
                    }}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(bot.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
