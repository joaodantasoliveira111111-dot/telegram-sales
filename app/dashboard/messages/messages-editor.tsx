'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2, RotateCcw, Save } from 'lucide-react'

interface MessageItem {
  key: string
  label: string
  description: string
  vars: string[]
  default: string
  content: string
  customized: boolean
}

interface MessagesEditorProps {
  botId: string
  botName: string
  initialMessages: MessageItem[]
}

export function MessagesEditor({ botId, botName, initialMessages }: MessagesEditorProps) {
  const [messages, setMessages] = useState<MessageItem[]>(initialMessages)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  function handleChange(key: string, value: string) {
    setMessages((prev) => prev.map((m) => m.key === key ? { ...m, content: value } : m))
    setDirty(true)
  }

  function handleReset(key: string) {
    const original = initialMessages.find((m) => m.key === key)
    if (!original) return
    setMessages((prev) => prev.map((m) => m.key === key ? { ...m, content: original.default } : m))
    setDirty(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/bots/${botId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messages.map((m) => ({ key: m.key, content: m.content }))),
      })
      if (!res.ok) { toast.error('Erro ao salvar mensagens'); return }
      toast.success('Mensagens salvas com sucesso!')
      setDirty(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-100">{botName}</h3>
          <p className="text-sm text-zinc-500">Edite as mensagens enviadas pelo bot</p>
        </div>
        <Button onClick={handleSave} disabled={saving || !dirty}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Salvar alterações
        </Button>
      </div>

      <div className="space-y-5">
        {messages.map((msg) => (
          <div key={msg.key} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-zinc-100">{msg.label}</p>
                  {msg.customized && (
                    <Badge variant="success" className="text-xs">Personalizada</Badge>
                  )}
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">{msg.description}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleReset(msg.key)}
                title="Restaurar padrão"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            </div>

            {msg.vars.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs text-zinc-600">Variáveis disponíveis:</span>
                {msg.vars.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => {
                      const el = document.getElementById(`msg-${msg.key}`) as HTMLTextAreaElement
                      if (!el) return
                      const start = el.selectionStart
                      const end = el.selectionEnd
                      const newVal = el.value.slice(0, start) + v + el.value.slice(end)
                      handleChange(msg.key, newVal)
                      setTimeout(() => { el.focus(); el.setSelectionRange(start + v.length, start + v.length) }, 0)
                    }}
                    className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-xs text-blue-400 hover:bg-zinc-700 transition-colors"
                  >
                    {v}
                  </button>
                ))}
              </div>
            )}

            <Textarea
              id={`msg-${msg.key}`}
              value={msg.content}
              onChange={(e) => handleChange(msg.key, e.target.value)}
              className="min-h-[100px] font-mono text-xs leading-relaxed"
              placeholder="Mensagem..."
            />

            <p className="text-xs text-zinc-600">
              Suporta HTML básico do Telegram: &lt;b&gt;negrito&lt;/b&gt;, &lt;i&gt;itálico&lt;/i&gt;, &lt;code&gt;código&lt;/code&gt;
            </p>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving || !dirty}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Salvar alterações
        </Button>
      </div>
    </div>
  )
}
