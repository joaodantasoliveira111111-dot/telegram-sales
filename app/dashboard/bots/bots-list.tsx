'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bot as BotType } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, Bot, ArrowRight, Zap, Calendar, ToggleLeft, ToggleRight } from 'lucide-react'
import { BotForm } from './bot-form'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

interface BotsListProps {
  initialBots: BotType[]
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(20px)',
}

const cardHoverStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.055)',
  border: '1px solid rgba(255,255,255,0.14)',
}

function BotCard({ bot, onToggle, onEdit, onDelete }: {
  bot: BotType
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="relative rounded-2xl p-5 transition-all duration-200 group"
      style={hovered ? cardHoverStyle : cardStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Active glow */}
      {bot.is_active && (
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-20"
          style={{ background: 'radial-gradient(circle at top right, rgba(59,130,246,0.4), transparent 70%)' }}
        />
      )}

      {/* Header */}
      <div className="relative mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{
              background: bot.is_active
                ? 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(99,102,241,0.15))'
                : 'rgba(255,255,255,0.05)',
              border: bot.is_active ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <Bot className={`h-5 w-5 ${bot.is_active ? 'text-blue-400' : 'text-slate-600'}`} />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-100">{bot.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`h-1.5 w-1.5 rounded-full ${bot.is_active ? 'bg-emerald-400' : 'bg-slate-600'}`}
                style={bot.is_active ? { boxShadow: '0 0 6px rgba(52,211,153,0.5)' } : undefined}
              />
              <span className={`text-xs ${bot.is_active ? 'text-emerald-400' : 'text-slate-600'}`}>
                {bot.is_active ? 'Online' : 'Inativo'}
              </span>
            </div>
          </div>
        </div>
        <Badge variant={bot.is_active ? 'success' : 'secondary'}>
          {bot.is_active ? 'Ativo' : 'Inativo'}
        </Badge>
      </div>

      {/* Welcome message preview */}
      <p className="relative mb-4 text-sm text-slate-500 line-clamp-2 leading-relaxed">
        {bot.welcome_message}
      </p>

      {/* Meta */}
      <div className="relative mb-4 flex items-center gap-1.5 text-xs text-slate-600">
        <Calendar className="h-3 w-3" />
        <span>Criado em {formatDate(bot.created_at)}</span>
      </div>

      {/* Actions */}
      <div className="relative flex items-center gap-2">
        <Link href={`/dashboard/bots/${bot.id}`} className="flex-1">
          <Button className="w-full gap-2 group/btn" size="sm">
            <span>Gerenciar</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
          </Button>
        </Link>
        <Button
          size="sm"
          variant="outline"
          onClick={onToggle}
          title={bot.is_active ? 'Desativar' : 'Ativar'}
        >
          {bot.is_active
            ? <ToggleRight className="h-4 w-4 text-emerald-400" />
            : <ToggleLeft className="h-4 w-4" />
          }
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onEdit}
          title="Editar"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={onDelete}
          title="Excluir"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

export function BotsList({ initialBots }: BotsListProps) {
  const [bots, setBots] = useState<BotType[]>(initialBots)
  const [showForm, setShowForm] = useState(false)
  const [editingBot, setEditingBot] = useState<BotType | null>(null)
  const router = useRouter()

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este bot? Todos os planos, mensagens e dados relacionados serão removidos.')) return
    const res = await fetch(`/api/bots/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setBots((prev) => prev.filter((b) => b.id !== id))
      toast.success('Bot excluído com sucesso')
    } else {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error ?? 'Erro ao excluir bot. Verifique se não há dados vinculados.')
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
      setEditingBot(null)
    } else {
      setBots((prev) => [bot, ...prev])
      setShowForm(false)
      // Redirect to bot detail page after creation
      router.push(`/dashboard/bots/${bot.id}`)
    }
  }

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <Button
          onClick={() => {
            setEditingBot(null)
            setShowForm(true)
          }}
        >
          <Plus className="h-4 w-4" />
          Novo Bot
        </Button>
      </div>

      {showForm && (
        <div className="mb-6 animate-fade-up">
          <BotForm
            onSaved={handleSaved}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {editingBot && (
        <div className="mb-6 animate-fade-up">
          <BotForm
            bot={editingBot}
            onSaved={handleSaved}
            onCancel={() => setEditingBot(null)}
          />
        </div>
      )}

      {bots.length === 0 && !showForm ? (
        <div
          className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-20 text-center"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <div
            className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}
          >
            <Zap className="h-8 w-8 text-blue-400" />
          </div>
          <p className="text-slate-300 font-semibold">Nenhum bot cadastrado</p>
          <p className="mt-1 text-sm text-slate-600">Clique em &quot;Novo Bot&quot; para começar</p>
          <Button className="mt-5" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            Criar primeiro bot
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bots.map((bot) => (
            <BotCard
              key={bot.id}
              bot={bot}
              onToggle={() => handleToggle(bot)}
              onEdit={() => {
                setEditingBot(bot)
                setShowForm(false)
              }}
              onDelete={() => handleDelete(bot.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
