'use client'

import { useEffect, useState } from 'react'
import { Plan, CreatePlanForm, PlanRole, ProductType } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Plus, X } from 'lucide-react'
import { toast } from 'sonner'

function slugify(label: string) {
  return label
    .toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

interface PlanFormProps {
  plan?: Plan
  bots: { id: string; name: string }[]
  onSaved: (plan: Plan) => void
  onCancel: () => void
}

export function PlanForm({ plan, bots, onSaved, onCancel }: PlanFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [productTypes, setProductTypes] = useState<ProductType[]>([])
  const [creatingType, setCreatingType] = useState(false)
  const [newTypeName, setNewTypeName] = useState('')
  const [newTypeFields, setNewTypeFields] = useState<string[]>(['Login', 'Senha'])
  const [creatingTypeLoading, setCreatingTypeLoading] = useState(false)
  const [form, setForm] = useState<CreatePlanForm>({
    bot_id: plan?.bot_id ?? (bots[0]?.id ?? ''),
    name: plan?.name ?? '',
    price: plan?.price ?? 0,
    duration_days: plan?.duration_days ?? 30,
    button_text: plan?.button_text ?? 'Comprar Acesso',
    content_type: plan?.content_type ?? 'link',
    content_url: plan?.content_url ?? '',
    telegram_chat_id: plan?.telegram_chat_id ?? '',
    plan_role: plan?.plan_role ?? 'main',
    product_type_id: plan?.product_type_id ?? null,
  })

  useEffect(() => {
    fetch('/api/product-types').then((r) => r.ok ? r.json() : []).then(setProductTypes).catch(() => {})
  }, [])

  async function handleCreateType() {
    const cleanFields = newTypeFields
      .map((label) => ({ key: slugify(label), label: label.trim() }))
      .filter((f) => f.key && f.label)

    if (!newTypeName.trim()) { toast.error('Dá um nome pro tipo de produto'); return }
    if (cleanFields.length === 0) { toast.error('Adicione ao menos um campo'); return }
    const keys = cleanFields.map((f) => f.key)
    if (new Set(keys).size !== keys.length) { toast.error('Dois campos ficaram com o mesmo nome — ajuste'); return }

    setCreatingTypeLoading(true)
    try {
      const res = await fetch('/api/product-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTypeName.trim(), fields: cleanFields }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Erro ao criar tipo de produto'); return }

      setProductTypes((prev) => [data, ...prev])
      setForm((f) => ({ ...f, product_type_id: data.id }))
      setCreatingType(false)
      setNewTypeName('')
      setNewTypeFields(['Login', 'Senha'])
      toast.success('Tipo de produto criado')
    } finally {
      setCreatingTypeLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const url = plan ? `/api/plans/${plan.id}` : '/api/plans'
      const method = plan ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          duration_days: Number(form.duration_days),
          content_url: form.content_url || null,
          telegram_chat_id: form.telegram_chat_id || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Erro ao salvar plano.')
        return
      }

      onSaved(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{plan ? 'Editar Plano' : 'Novo Plano'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="rounded-md px-4 py-2 text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#b91c1c' }}>{error}</p>
          )}

          <div className="space-y-1.5">
            <Label>Bot</Label>
            <Select value={form.bot_id} onValueChange={(v) => setForm({ ...form, bot_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um bot" />
              </SelectTrigger>
              <SelectContent>
                {bots.map((bot) => (
                  <SelectItem key={bot.id} value={bot.id}>
                    {bot.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="plan-name">Nome do Plano</Label>
              <Input
                id="plan-name"
                placeholder="Plano Premium"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="button-text">Texto do Botão</Label>
              <Input
                id="button-text"
                placeholder="Comprar Acesso"
                value={form.button_text}
                onChange={(e) => setForm({ ...form, button_text: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="price">Preço (R$)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="49.90"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="duration">Duração (dias)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                placeholder="30"
                value={form.duration_days}
                onChange={(e) => setForm({ ...form, duration_days: parseInt(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Função do Plano</Label>
            <Select
              value={form.plan_role}
              onValueChange={(v) => setForm({ ...form, plan_role: v as PlanRole })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="main">🏠 Principal — aparece no bot para todos</SelectItem>
                <SelectItem value="upsell">📈 Upsell — apenas via oferta pós-compra</SelectItem>
                <SelectItem value="downsell">📉 Downsell — apenas via oferta para quem não comprou</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-zinc-500">
              {form.plan_role === 'main' && 'Este plano será exibido na mensagem inicial do bot.'}
              {form.plan_role === 'upsell' && 'Este plano não aparece no bot — só é enviado automaticamente após uma compra.'}
              {form.plan_role === 'downsell' && 'Este plano não aparece no bot — só é oferecido para quem não finalizou a compra.'}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Tipo de Conteúdo</Label>
            <Select
              value={form.content_type}
              onValueChange={(v) => setForm({ ...form, content_type: v as 'link' | 'telegram_channel' | 'account_stock' })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="link">🔗 Link externo</SelectItem>
                <SelectItem value="telegram_channel">📢 Canal do Telegram</SelectItem>
                <SelectItem value="account_stock">📦 Estoque de Contas (login/senha)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.content_type === 'link' && (
            <div className="space-y-1.5">
              <Label htmlFor="content-url">URL do Conteúdo</Label>
              <Input
                id="content-url"
                placeholder="https://..."
                value={form.content_url}
                onChange={(e) => setForm({ ...form, content_url: e.target.value })}
              />
            </div>
          )}

          {form.content_type === 'telegram_channel' && (
            <div className="space-y-1.5">
              <Label htmlFor="chat-id">ID do Canal/Grupo Telegram</Label>
              <Input
                id="chat-id"
                placeholder="-100123456789"
                value={form.telegram_chat_id}
                onChange={(e) => setForm({ ...form, telegram_chat_id: e.target.value })}
              />
              <p className="text-xs text-zinc-500">
                Use @userinfobot para descobrir o ID do canal
              </p>
            </div>
          )}

          {form.content_type === 'account_stock' && (
            <div className="space-y-3">
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-sm text-blue-300">
                📦 Após o pagamento, o sistema entregará automaticamente um item disponível do estoque vinculado a este plano. Cadastre os itens em <b>Estoque de Contas</b>.
              </div>
              <div className="space-y-1.5">
                <Label>O que vai ser entregue?</Label>
                <Select
                  value={creatingType ? 'new' : (form.product_type_id ?? 'default')}
                  onValueChange={(v) => {
                    if (v === 'new') { setCreatingType(true); return }
                    setCreatingType(false)
                    setForm({ ...form, product_type_id: v === 'default' ? null : v })
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Padrão (login e senha)</SelectItem>
                    {productTypes.map((pt) => (
                      <SelectItem key={pt.id} value={pt.id}>{pt.name}</SelectItem>
                    ))}
                    <SelectItem value="new">+ Criar novo tipo de produto...</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-zinc-500">
                  Vendendo algo com mais campos que login/senha (banco, chave, código de recuperação...)? Crie um tipo de produto personalizado.
                </p>
              </div>

              {creatingType && (
                <div className="space-y-3 rounded-lg border px-4 py-3" style={{ borderColor: 'rgba(124,58,237,0.2)', background: 'rgba(124,58,237,0.04)' }}>
                  <div className="space-y-1.5">
                    <Label>Nome do tipo de produto</Label>
                    <Input placeholder="Ex: Conta de Streaming, Chave de Licença..." value={newTypeName} onChange={(e) => setNewTypeName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Campos que serão entregues ao cliente</Label>
                    <div className="space-y-2">
                      {newTypeFields.map((label, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Input
                            placeholder="Ex: Contra-senha"
                            value={label}
                            onChange={(e) => setNewTypeFields((f) => f.map((x, idx) => idx === i ? e.target.value : x))}
                          />
                          <button type="button" onClick={() => setNewTypeFields((f) => f.filter((_, idx) => idx !== i))} className="shrink-0 text-zinc-400 hover:text-red-500">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => setNewTypeFields((f) => [...f, ''])}>
                      <Plus className="mr-1.5 h-3 w-3" />
                      Adicionar campo
                    </Button>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button type="button" variant="outline" size="sm" onClick={() => setCreatingType(false)}>Cancelar</Button>
                    <Button type="button" size="sm" onClick={handleCreateType} disabled={creatingTypeLoading}>
                      {creatingTypeLoading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                      Criar e usar neste plano
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {plan ? 'Salvar' : 'Criar Plano'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
