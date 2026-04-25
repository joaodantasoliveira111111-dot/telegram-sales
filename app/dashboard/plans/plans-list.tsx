'use client'

import { useState } from 'react'
import { Plan } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, ListOrdered } from 'lucide-react'
import { PlanForm } from './plan-form'
import { formatCurrency } from '@/lib/utils'

interface PlansListProps {
  initialPlans: (Plan & { bot?: { name: string } })[]
  bots: { id: string; name: string }[]
}

export function PlansList({ initialPlans, bots }: PlansListProps) {
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
      setPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...plan } : p)))
    } else {
      setPlans((prev) => [{ ...plan }, ...prev])
    }
    setShowForm(false)
    setEditingPlan(null)
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button
          onClick={() => {
            setEditingPlan(null)
            setShowForm(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Plano
        </Button>
      </div>

      {(showForm || editingPlan) && (
        <div className="mb-6">
          <PlanForm
            plan={editingPlan ?? undefined}
            bots={bots}
            onSaved={handleSaved}
            onCancel={() => {
              setShowForm(false)
              setEditingPlan(null)
            }}
          />
        </div>
      )}

      {plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 py-16 text-center">
          <ListOrdered className="mb-3 h-10 w-10 text-zinc-600" />
          <p className="text-zinc-400">Nenhum plano cadastrado</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                  <p className="text-xs text-zinc-500">{(plan as Plan & { bot?: { name: string } }).bot?.name}</p>
                </div>
                <span className="text-lg font-bold text-green-400">
                  {formatCurrency(plan.price)}
                </span>
              </CardHeader>
              <CardContent>
                <div className="mb-3 flex flex-wrap gap-2">
                  <Badge variant="secondary">{plan.duration_days} dias</Badge>
                  <Badge variant="outline">
                    {plan.content_type === 'link' ? 'Link' : 'Canal Telegram'}
                  </Badge>
                </div>
                <p className="mb-4 text-xs text-zinc-500">Botão: &quot;{plan.button_text}&quot;</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingPlan(plan)
                      setShowForm(false)
                    }}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(plan.id)}>
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
