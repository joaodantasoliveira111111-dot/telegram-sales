'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface OfferFormProps {
  bots: { id: string; name: string }[]
  plans: { id: string; name: string; price: number; bot_id: string }[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSaved: (o: any) => void
  onCancel: () => void
}

export function OfferForm({ bots, plans, onSaved, onCancel }: OfferFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    bot_id: bots[0]?.id ?? '',
    name: '',
    type: 'upsell',
    trigger_plan_id: '',
    offer_plan_id: '',
    message: '',
  })

  const botPlans = plans.filter((p) => p.bot_id === form.bot_id)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erro ao salvar'); return }
      onSaved(data)
    } finally {
      setLoading(false)
    }
  }

  const triggerPlan = botPlans.find((p) => p.id === form.trigger_plan_id)
  const offerPlan = botPlans.find((p) => p.id === form.offer_plan_id)

  return (
    <Card className="border-zinc-800 bg-zinc-900/60">
      <CardHeader>
        <CardTitle className="text-zinc-100">Nova Oferta</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="rounded-md bg-red-900/40 px-4 py-2 text-sm text-red-300">{error}</p>}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Bot</Label>
              <Select value={form.bot_id} onValueChange={(v) => setForm({ ...form, bot_id: v, trigger_plan_id: '', offer_plan_id: '' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {bots.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="offer-name">Nome interno</Label>
              <Input
                id="offer-name"
                placeholder="Upsell Plano Anual"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="upsell">📈 Upsell — enviado após pagamento confirmado</SelectItem>
                <SelectItem value="downsell">📉 Downsell — oferta mais barata para quem não comprou</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Plano gatilho</Label>
              <Select value={form.trigger_plan_id} onValueChange={(v) => setForm({ ...form, trigger_plan_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {botPlans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — {formatCurrency(p.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-zinc-600">
                {form.type === 'upsell' ? 'Quando comprarem este plano' : 'Quando clicarem neste plano'}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Plano ofertado</Label>
              <Select value={form.offer_plan_id} onValueChange={(v) => setForm({ ...form, offer_plan_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {botPlans
                    .filter((p) => p.id !== form.trigger_plan_id)
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} — {formatCurrency(p.price)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-zinc-600">Plano que será oferecido</p>
            </div>
          </div>

          {triggerPlan && offerPlan && (
            <div className={`rounded-lg border p-3 text-sm ${
              form.type === 'upsell'
                ? 'border-blue-500/20 bg-blue-500/5 text-blue-300'
                : 'border-orange-500/20 bg-orange-500/5 text-orange-300'
            }`}>
              {form.type === 'upsell'
                ? `Após comprar "${triggerPlan.name}", o bot oferece "${offerPlan.name}" por mais ${formatCurrency(offerPlan.price)}`
                : `Para quem não comprou "${triggerPlan.name}", o bot oferece "${offerPlan.name}" por ${formatCurrency(offerPlan.price)}`
              }
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="offer-msg">Mensagem da oferta</Label>
            <Textarea
              id="offer-msg"
              placeholder={form.type === 'upsell'
                ? 'Ei, que tal turbinar seu acesso? Por apenas R$ X a mais você garante o plano anual! 🚀\n\nClique abaixo para garantir:'
                : 'Ei, vi que você ainda não entrou... Tudo bem?\n\nTenho uma oferta especial pra você: por apenas R$ X você garante acesso. 👇'
              }
              className="min-h-[100px]"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
            <Button type="submit" disabled={loading || !form.trigger_plan_id || !form.offer_plan_id}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Oferta
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
