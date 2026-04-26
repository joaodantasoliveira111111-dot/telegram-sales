'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, TrendingUp, TrendingDown, Zap } from 'lucide-react'
import { OfferForm } from './offer-form'
import { formatCurrency } from '@/lib/utils'

interface Offer {
  id: string
  name: string
  type: 'upsell' | 'downsell'
  message: string
  is_active: boolean
  created_at: string
  bot?: { name: string }
  trigger_plan?: { name: string; price: number }
  offer_plan?: { name: string; price: number }
}

interface OfferListProps {
  initialOffers: Offer[]
  bots: { id: string; name: string }[]
  plans: { id: string; name: string; price: number; bot_id: string }[]
}

export function OfferList({ initialOffers, bots, plans }: OfferListProps) {
  const [offers, setOffers] = useState(initialOffers)
  const [showForm, setShowForm] = useState(false)

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta oferta?')) return
    const res = await fetch(`/api/offers/${id}`, { method: 'DELETE' })
    if (res.ok) setOffers((prev) => prev.filter((o) => o.id !== id))
  }

  async function handleToggle(offer: Offer) {
    const res = await fetch(`/api/offers/${offer.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !offer.is_active }),
    })
    if (res.ok) {
      const updated = await res.json()
      setOffers((prev) => prev.map((o) => (o.id === offer.id ? { ...o, ...updated } : o)))
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleSaved(offer: any) {
    setOffers((prev) => [offer, ...prev])
    setShowForm(false)
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Oferta
        </Button>
      </div>

      {showForm && (
        <div className="mb-6">
          <OfferForm
            bots={bots}
            plans={plans}
            onSaved={handleSaved}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {offers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 py-16 text-center">
          <Zap className="mb-3 h-10 w-10 text-zinc-600" />
          <p className="text-zinc-400">Nenhuma oferta configurada</p>
          <p className="text-sm text-zinc-600">Crie um upsell para aumentar o ticket médio</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {offers.map((offer) => (
            <Card key={offer.id} className={`border-zinc-800 bg-zinc-900/60 ${!offer.is_active ? 'opacity-60' : ''}`}>
              <CardHeader className="flex flex-row items-start justify-between pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    {offer.type === 'upsell' ? (
                      <TrendingUp className="h-4 w-4 text-blue-400" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-orange-400" />
                    )}
                    <CardTitle className="text-base text-zinc-100">{offer.name}</CardTitle>
                  </div>
                  <p className="text-xs text-zinc-500">{offer.bot?.name}</p>
                </div>
                <Badge variant={offer.type === 'upsell' ? 'default' : 'warning'}>
                  {offer.type === 'upsell' ? 'Upsell' : 'Downsell'}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <span className="rounded bg-zinc-800 px-2 py-0.5">
                    Gatilho: <b>{offer.trigger_plan?.name}</b> ({formatCurrency(offer.trigger_plan?.price ?? 0)})
                  </span>
                  <span className="text-zinc-600">→</span>
                  <span className="rounded bg-zinc-800 px-2 py-0.5">
                    Oferta: <b>{offer.offer_plan?.name}</b> ({formatCurrency(offer.offer_plan?.price ?? 0)})
                  </span>
                </div>
                <p className="line-clamp-2 text-sm text-zinc-400">{offer.message}</p>
                <div className="flex items-center justify-between">
                  <Badge variant={offer.is_active ? 'success' : 'secondary'}>
                    {offer.is_active ? 'Ativa' : 'Inativa'}
                  </Badge>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleToggle(offer)}>
                      {offer.is_active ? 'Desativar' : 'Ativar'}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(offer.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
