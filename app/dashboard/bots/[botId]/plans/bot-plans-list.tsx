'use client'

import { useState } from 'react'
import { Plan } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, ListOrdered, Tag, Clock, Link as LinkIcon, Tv, Package } from 'lucide-react'
import { PlanForm } from '../../../plans/plan-form'
import { formatCurrency } from '@/lib/utils'

interface BotPlansListProps {
  botId: string
  botName: string
  initialPlans: Plan[]
}

const roleConfig = {
  main:     { label: 'Principal',  variant: 'success'  as const },
  upsell:   { label: 'Upsell',     variant: 'warning'  as const },
  downsell: { label: 'Downsell',   variant: 'secondary' as const },
}

const contentIcon = {
  link:            LinkIcon,
  telegram_channel: Tv,
  account_stock:   Package,
}

const contentLabel = {
  link:            'Link',
  telegram_channel: 'Canal Telegram',
  account_stock:   'Estoque de Contas',
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.72)',
  border: '1px solid rgba(255,255,255,0.84)',
  backdropFilter: 'blur(20px)',
}

export function BotPlansList({ botId, botName, initialPlans }: BotPlansListProps) {
  const [plans, setPlans] = useState(initialPlans)
  const [showForm, setShowForm] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('Excluir este plano?')) return
    const res = await fetch(`/api/plans/${id}`, { method: 'DELETE' })
    if (res.ok) setPlans((prev) => prev.filter((p) => p.id !== id))
  }

  function handleSaved(plan: Plan) {
    if (editingPlan) {
      setPlans((prev) => prev.map((p) => (p.id === plan.id ? plan : p)))
    } else {
      setPlans((prev) => [...prev, plan])
    }
    setShowForm(false)
    setEditingPlan(null)
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-100">Planos</h2>
          <p className="text-sm text-slate-500">{plans.length} plano{plans.length !== 1 ? 's' : ''} para {botName}</p>
        </div>
        <Button size="sm" onClick={() => { setEditingPlan(null); setShowForm(true) }}>
          <Plus className="h-3.5 w-3.5" />
          Novo Plano
        </Button>
      </div>

      {(showForm || editingPlan) && (
        <div className="mb-5 animate-fade-up">
          <PlanForm
            plan={editingPlan ?? undefined}
            bots={[{ id: botId, name: botName }]}
            onSaved={handleSaved}
            onCancel={() => { setShowForm(false); setEditingPlan(null) }}
          />
        </div>
      )}

      {plans.length === 0 && !showForm ? (
        <div
          className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-16 text-center"
          style={{ borderColor: 'rgba(255,255,255,0.82)' }}
        >
          <div
            className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(255,255,255,0.84)' }}
          >
            <ListOrdered className="h-7 w-7 text-slate-600" />
          </div>
          <p className="font-medium text-slate-400">Nenhum plano criado</p>
          <p className="mt-1 text-sm text-slate-600">Crie o primeiro plano para este bot</p>
          <Button className="mt-4" size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-3.5 w-3.5" />
            Criar Plano
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const role = roleConfig[plan.plan_role as keyof typeof roleConfig]
            const ContentIcon = contentIcon[plan.content_type as keyof typeof contentIcon] ?? LinkIcon
            return (
              <div key={plan.id} className="rounded-2xl p-5 transition-all duration-200 hover:border-white/[0.13]" style={cardStyle}>
                {/* Price header */}
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-100">{plan.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Botão: &quot;{plan.button_text}&quot;
                    </p>
                  </div>
                  <p
                    className="shrink-0 text-xl font-bold"
                    style={{ background: 'linear-gradient(135deg, #34d399, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                  >
                    {formatCurrency(plan.price)}
                  </p>
                </div>

                {/* Badges */}
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {role && <Badge variant={role.variant}>{role.label}</Badge>}
                  <Badge variant="secondary">
                    <Clock className="mr-1 h-3 w-3" />
                    {plan.duration_days} dias
                  </Badge>
                  <Badge variant="outline">
                    <ContentIcon className="mr-1 h-3 w-3" />
                    {contentLabel[plan.content_type as keyof typeof contentLabel] ?? plan.content_type}
                  </Badge>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => { setEditingPlan(plan); setShowForm(false) }}
                  >
                    <Pencil className="mr-1.5 h-3 w-3" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(plan.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
