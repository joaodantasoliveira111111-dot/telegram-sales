'use client'

import { useState } from 'react'
import { Bot, CreateBotForm } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface BotFormProps {
  bot?: Bot
  onSaved: (bot: Bot) => void
  onCancel: () => void
}

export function BotForm({ bot, onSaved, onCancel }: BotFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<CreateBotForm>({
    name: bot?.name ?? '',
    telegram_token: bot?.telegram_token ?? '',
    welcome_message: bot?.welcome_message ?? 'Olá! Seja bem-vindo(a). Escolha um plano abaixo:',
    welcome_media_url: bot?.welcome_media_url ?? '',
    welcome_media_type: bot?.welcome_media_type ?? undefined,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const url = bot ? `/api/bots/${bot.id}` : '/api/bots'
      const method = bot ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          welcome_media_url: form.welcome_media_url || null,
          welcome_media_type: form.welcome_media_type || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Erro ao salvar bot.')
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
        <CardTitle>{bot ? 'Editar Bot' : 'Novo Bot'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="rounded-md bg-red-900/40 px-4 py-2 text-sm text-red-300">{error}</p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="name">Nome do Bot</Label>
            <Input
              id="name"
              placeholder="Meu Bot de Vendas"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="token">Token do Telegram</Label>
            <Input
              id="token"
              placeholder="110201543:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw"
              value={form.telegram_token}
              onChange={(e) => setForm({ ...form, telegram_token: e.target.value })}
              required
            />
            <p className="text-xs text-zinc-500">Obtenha em @BotFather no Telegram</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="welcome">Mensagem de Boas-vindas</Label>
            <Textarea
              id="welcome"
              placeholder="Olá! Seja bem-vindo(a). Escolha um plano abaixo:"
              value={form.welcome_message}
              onChange={(e) => setForm({ ...form, welcome_message: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="media_url">URL da Mídia (opcional)</Label>
              <Input
                id="media_url"
                placeholder="https://..."
                value={form.welcome_media_url}
                onChange={(e) => setForm({ ...form, welcome_media_url: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo de Mídia</Label>
              <Select
                value={form.welcome_media_type ?? ''}
                onValueChange={(v) =>
                  setForm({ ...form, welcome_media_type: (v || undefined) as 'image' | 'video' | undefined })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma</SelectItem>
                  <SelectItem value="image">Imagem</SelectItem>
                  <SelectItem value="video">Vídeo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {bot ? 'Salvar' : 'Criar Bot'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
