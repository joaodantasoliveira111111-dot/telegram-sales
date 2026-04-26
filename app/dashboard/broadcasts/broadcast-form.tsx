'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface BroadcastFormProps {
  bots: { id: string; name: string }[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSaved: (b: any) => void
  onCancel: () => void
}

export function BroadcastForm({ bots, onSaved, onCancel }: BroadcastFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    bot_id: bots[0]?.id ?? '',
    name: '',
    message_text: '',
    media_url: '',
    media_type: 'none',
    target_type: 'unpaid',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          media_url: form.media_url || null,
          media_type: form.media_type === 'none' ? null : form.media_type,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erro ao salvar'); return }
      onSaved(data)
    } finally {
      setLoading(false)
    }
  }

  const targets = [
    { value: 'unpaid', label: '🎯 Não pagaram — remarketing de quem não comprou' },
    { value: 'expired', label: '⏰ Expirados — quem tinha acesso mas venceu' },
    { value: 'active', label: '✅ Assinantes ativos — quem está pagando' },
    { value: 'all', label: '👥 Todos os usuários do bot' },
  ]

  return (
    <Card className="border-zinc-800 bg-zinc-900/60">
      <CardHeader>
        <CardTitle className="text-zinc-100">Nova Transmissão</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="rounded-md bg-red-900/40 px-4 py-2 text-sm text-red-300">{error}</p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Bot</Label>
              <Select value={form.bot_id} onValueChange={(v) => setForm({ ...form, bot_id: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {bots.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bc-name">Nome interno</Label>
              <Input
                id="bc-name"
                placeholder="Remarketing semana 1"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Público-alvo</Label>
            <Select value={form.target_type} onValueChange={(v) => setForm({ ...form, target_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {targets.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bc-msg">Mensagem</Label>
            <Textarea
              id="bc-msg"
              placeholder="Escreva sua mensagem aqui... Suporta HTML do Telegram: <b>negrito</b>, <i>itálico</i>, <code>código</code>"
              className="min-h-[120px]"
              value={form.message_text}
              onChange={(e) => setForm({ ...form, message_text: e.target.value })}
              required
            />
            <p className="text-xs text-zinc-600">Suporta HTML: &lt;b&gt;negrito&lt;/b&gt;, &lt;i&gt;itálico&lt;/i&gt;</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="bc-media">URL de Mídia (opcional)</Label>
              <Input
                id="bc-media"
                placeholder="https://..."
                value={form.media_url}
                onChange={(e) => setForm({ ...form, media_url: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo de Mídia</Label>
              <Select value={form.media_type} onValueChange={(v) => setForm({ ...form, media_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Só texto</SelectItem>
                  <SelectItem value="image">📷 Imagem</SelectItem>
                  <SelectItem value="video">🎥 Vídeo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Transmissão
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
