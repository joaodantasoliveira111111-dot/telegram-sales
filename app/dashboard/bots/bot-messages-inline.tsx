'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2, RotateCcw, Save, ChevronDown, ChevronUp } from 'lucide-react'

interface MessageItem {
  key: string
  label: string
  description: string
  vars: string[]
  default: string
  content: string
  customized: boolean
}

export function BotMessagesInline({ botId }: { botId: string }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (!open || messages.length > 0) return
    setLoading(true)
    fetch(`/api/bots/${botId}/messages`)
      .then((r) => r.json())
      .then((data) => setMessages(data))
      .finally(() => setLoading(false))
  }, [open, botId, messages.length])

  function handleChange(key: string, value: string) {
    setMessages((prev) => prev.map((m) => m.key === key ? { ...m, content: value } : m))
    setDirty(true)
  }

  function handleReset(key: string) {
    setMessages((prev) => prev.map((m) => m.key === key ? { ...m, content: m.default } : m))
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
      if (!res.ok) { toast.error('Erro ao salvar'); return }
      toast.success('Mensagens salvas!')
      setDirty(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-3 border-t border-zinc-800 pt-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
      >
        <span>Mensagens do bot</span>
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {open && (
        <div className="mt-3 space-y-4">
          {loading && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-zinc-600" />
            </div>
          )}

          {!loading && messages.map((msg) => (
            <div key={msg.key} className="space-y-1.5 rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-medium text-zinc-200">{msg.label}</p>
                    {msg.customized && <Badge variant="success" className="text-xs py-0">editada</Badge>}
                  </div>
                  <p className="text-xs text-zinc-600">{msg.description}</p>
                </div>
                <button
                  onClick={() => handleReset(msg.key)}
                  className="shrink-0 text-zinc-600 hover:text-zinc-400"
                  title="Restaurar padrão"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
              </div>

              {msg.vars.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {msg.vars.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => {
                        const el = document.getElementById(`inline-msg-${botId}-${msg.key}`) as HTMLTextAreaElement
                        if (!el) return
                        const s = el.selectionStart
                        const e = el.selectionEnd
                        const val = el.value.slice(0, s) + v + el.value.slice(e)
                        handleChange(msg.key, val)
                        setTimeout(() => { el.focus(); el.setSelectionRange(s + v.length, s + v.length) }, 0)
                      }}
                      className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-xs text-blue-400 hover:bg-zinc-700"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              )}

              <Textarea
                id={`inline-msg-${botId}-${msg.key}`}
                value={msg.content}
                onChange={(e) => handleChange(msg.key, e.target.value)}
                className="min-h-[80px] font-mono text-xs"
              />
            </div>
          ))}

          {!loading && dirty && (
            <Button size="sm" className="w-full" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Save className="mr-2 h-3 w-3" />}
              Salvar mensagens
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
