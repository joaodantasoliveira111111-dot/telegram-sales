'use client'

import { useState, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Loader2, RotateCcw, Save, ChevronDown,
  MessageSquare, CreditCard, CheckCircle2, AlertTriangle,
  Workflow, Eye, EyeOff, Sparkles, Bot,
} from 'lucide-react'

// ─── types ───────────────────────────────────────────────────────────────────

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
  botType: string
  flowType: string
  initialMessages: MessageItem[]
}

// ─── message groups ──────────────────────────────────────────────────────────

const GROUPS = [
  {
    key: 'flow',
    label: 'Fluxo inicial',
    icon: Workflow,
    color: 'violet',
    description: 'Mensagens do início da jornada — boas-vindas e apresentação do produto',
    keys: ['consultive_button_text', 'how_it_works'],
  },
  {
    key: 'payment',
    label: 'Pagamento',
    icon: CreditCard,
    color: 'blue',
    description: 'Exibidas durante o processo de compra',
    keys: ['payment_intro', 'pix_instructions', 'payment_pending'],
  },
  {
    key: 'confirmed',
    label: 'Confirmação',
    icon: CheckCircle2,
    color: 'emerald',
    description: 'Enviadas automaticamente após o pagamento ser aprovado',
    keys: [
      'payment_confirmed_channel',
      'payment_confirmed_link',
      'payment_confirmed_account',
      'payment_confirmed_generic',
    ],
  },
  {
    key: 'issues',
    label: 'Problemas & suporte',
    icon: AlertTriangle,
    color: 'amber',
    description: 'Mensagens de erro, estoque vazio ou assinatura expirada',
    keys: ['stock_empty', 'payment_failed', 'subscription_expired'],
  },
]

const colorMap: Record<string, { icon: string; badge: string; border: string; bg: string; dot: string }> = {
  violet: {
    icon: 'text-violet-400',
    badge: 'rgba(139,92,246,0.15)',
    border: 'rgba(139,92,246,0.3)',
    bg: 'rgba(139,92,246,0.06)',
    dot: 'bg-violet-400',
  },
  blue: {
    icon: 'text-blue-400',
    badge: 'rgba(59,130,246,0.15)',
    border: 'rgba(59,130,246,0.3)',
    bg: 'rgba(59,130,246,0.06)',
    dot: 'bg-blue-400',
  },
  emerald: {
    icon: 'text-emerald-400',
    badge: 'rgba(16,185,129,0.15)',
    border: 'rgba(16,185,129,0.3)',
    bg: 'rgba(16,185,129,0.06)',
    dot: 'bg-emerald-400',
  },
  amber: {
    icon: 'text-amber-400',
    badge: 'rgba(245,158,11,0.15)',
    border: 'rgba(245,158,11,0.3)',
    bg: 'rgba(245,158,11,0.06)',
    dot: 'bg-amber-400',
  },
}

// ─── active message logic ─────────────────────────────────────────────────────

function isMessageActive(key: string, botType: string, flowType: string): boolean {
  if (key === 'consultive_button_text') return flowType === 'consultive'
  if (key === 'how_it_works') return flowType === 'presentation' || flowType === 'consultive'
  if (key === 'payment_confirmed_account') return botType === 'account_stock'
  if (key === 'payment_confirmed_channel') return botType === 'channel_link'
  if (key === 'payment_confirmed_link') return botType === 'channel_link'
  if (key === 'stock_empty') return botType === 'account_stock'
  return true
}

function getActiveLabel(key: string, botType: string, flowType: string): string | null {
  if (key === 'consultive_button_text') {
    if (flowType === 'consultive') return 'Ativo — Fluxo Consultivo'
    return 'Inativo — ative no fluxo Consultivo'
  }
  if (key === 'how_it_works') {
    if (flowType === 'presentation') return 'Ativo — Fluxo Apresentação'
    if (flowType === 'consultive') return 'Ativo — Fluxo Consultivo'
    return 'Inativo — ative no fluxo Apresentação ou Consultivo'
  }
  if (key === 'payment_confirmed_account') {
    return botType === 'account_stock' ? 'Ativo — Bot Venda de Contas' : 'Inativo — apenas para Bot Venda de Contas'
  }
  if (key === 'payment_confirmed_channel') {
    return botType === 'channel_link' ? 'Ativo — Bot Canal/Link' : 'Inativo — apenas para Bot Canal/Link'
  }
  if (key === 'payment_confirmed_link') {
    return botType === 'channel_link' ? 'Ativo — Bot Canal/Link' : 'Inativo — apenas para Bot Canal/Link'
  }
  if (key === 'stock_empty') {
    return botType === 'account_stock' ? 'Ativo — Bot Venda de Contas' : 'Inativo — apenas para Bot Venda de Contas'
  }
  return null
}

// ─── Telegram preview ─────────────────────────────────────────────────────────

function TelegramPreview({ content }: { content: string }) {
  const html = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // re-allow specific tags
    .replace(/&lt;b&gt;([\s\S]*?)&lt;\/b&gt;/g, '<b>$1</b>')
    .replace(/&lt;i&gt;([\s\S]*?)&lt;\/i&gt;/g, '<i>$1</i>')
    .replace(/&lt;u&gt;([\s\S]*?)&lt;\/u&gt;/g, '<u>$1</u>')
    .replace(/&lt;s&gt;([\s\S]*?)&lt;\/s&gt;/g, '<s>$1</s>')
    .replace(/&lt;code&gt;([\s\S]*?)&lt;\/code&gt;/g, '<code style="background:rgba(255,255,255,0.1);padding:1px 4px;border-radius:3px;font-family:monospace;font-size:11px">$1</code>')
    .replace(/&lt;pre&gt;([\s\S]*?)&lt;\/pre&gt;/g, '<pre style="background:rgba(255,255,255,0.08);padding:6px 8px;border-radius:4px;font-family:monospace;font-size:11px;overflow-x:auto">$1</pre>')
    .replace(/\n/g, '<br>')

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] uppercase tracking-wider text-slate-600 font-semibold">Preview</p>
      <div
        className="rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-xs leading-relaxed text-slate-200 max-w-[280px]"
        style={{
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.06)',
          wordBreak: 'break-word',
        }}
        dangerouslySetInnerHTML={{ __html: html || '<span style="opacity:0.3">Nenhum conteúdo</span>' }}
      />
      <p className="text-[10px] text-slate-600">Suporta: &lt;b&gt; &lt;i&gt; &lt;code&gt; &lt;u&gt; &lt;s&gt;</p>
    </div>
  )
}

// ─── MessageCard ──────────────────────────────────────────────────────────────

interface MessageCardProps {
  msg: MessageItem
  botId: string
  botType: string
  flowType: string
  groupColor: string
  onContentChange: (key: string, content: string) => void
}

function MessageCard({ msg, botId, botType, flowType, groupColor, onContentChange }: MessageCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [content, setContent] = useState(msg.content)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const c = colorMap[groupColor]

  const active = isMessageActive(msg.key, botType, flowType)
  const activeLabel = getActiveLabel(msg.key, botType, flowType)

  function handleChange(val: string) {
    setContent(val)
    setDirty(true)
    onContentChange(msg.key, val)
  }

  function handleReset() {
    setContent(msg.default)
    setDirty(msg.default !== msg.content)
    onContentChange(msg.key, msg.default)
  }

  function insertVar(v: string) {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const newVal = content.slice(0, start) + v + content.slice(end)
    handleChange(newVal)
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + v.length, start + v.length)
    }, 0)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/bots/${botId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([{ key: msg.key, content }]),
      })
      if (!res.ok) { toast.error('Erro ao salvar'); return }
      toast.success(`"${msg.label}" salva!`)
      setDirty(false)
    } finally {
      setSaving(false)
    }
  }

  const isButtonText = msg.key === 'consultive_button_text'

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-200"
      style={{
        background: expanded ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.02)',
        border: expanded
          ? `1px solid ${c.border}`
          : dirty
            ? '1px solid rgba(245,158,11,0.3)'
            : '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((s) => !s)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="h-2 w-2 rounded-full flex-shrink-0"
            style={{ background: active ? (groupColor === 'violet' ? '#a78bfa' : groupColor === 'blue' ? '#60a5fa' : groupColor === 'emerald' ? '#34d399' : '#fbbf24') : '#334155' }}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-slate-200 truncate">{msg.label}</span>
              {msg.customized && !dirty && (
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: c.badge, color: groupColor === 'emerald' ? '#34d399' : groupColor === 'violet' ? '#a78bfa' : groupColor === 'blue' ? '#60a5fa' : '#fbbf24' }}
                >
                  Personalizada
                </span>
              )}
              {dirty && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}>
                  Não salvo
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 truncate mt-0.5">{msg.description}</p>
          </div>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-slate-500 flex-shrink-0 ml-3 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Active indicator */}
          {activeLabel && (
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2"
              style={{
                background: active ? c.bg : 'rgba(255,255,255,0.02)',
                border: `1px solid ${active ? c.border : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${active ? c.dot : 'bg-slate-600'}`} />
              <p className="text-xs" style={{ color: active ? undefined : '#475569' }}>{activeLabel}</p>
            </div>
          )}

          {/* Variables */}
          {msg.vars.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-600">Inserir variável:</span>
              {msg.vars.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => insertVar(v)}
                  className="rounded-md px-2 py-0.5 font-mono text-xs text-blue-300 hover:text-blue-200 transition-colors"
                  style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)' }}
                >
                  {v}
                </button>
              ))}
            </div>
          )}

          {/* Editor + preview split */}
          <div className={`gap-4 ${showPreview ? 'grid grid-cols-[1fr_auto]' : ''}`}>
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => handleChange(e.target.value)}
              className={`font-mono text-xs leading-relaxed resize-none ${isButtonText ? 'min-h-[42px]' : 'min-h-[110px]'}`}
              placeholder="Mensagem..."
            />
            {showPreview && (
              <div className="w-[240px] flex-shrink-0">
                <TelegramPreview content={content} />
              </div>
            )}
          </div>

          {/* Character count */}
          <p className="text-[11px] text-slate-600">{content.length} caracteres</p>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowPreview((s) => !s)}
                className="gap-1.5 text-xs"
              >
                {showPreview ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                {showPreview ? 'Ocultar preview' : 'Visualizar'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleReset}
                className="gap-1.5 text-xs"
                title="Restaurar texto padrão"
              >
                <RotateCcw className="h-3 w-3" />
                Padrão
              </Button>
            </div>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving || !dirty}
              className="gap-1.5 text-xs"
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              Salvar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── MessagesEditor ──────────────────────────────────────────────────────────

export function MessagesEditor({ botId, botName, botType, flowType, initialMessages }: MessagesEditorProps) {
  const [contents, setContents] = useState<Record<string, string>>(
    Object.fromEntries(initialMessages.map((m) => [m.key, m.content]))
  )

  const handleContentChange = useCallback((key: string, content: string) => {
    setContents((prev) => ({ ...prev, [key]: content }))
  }, [])

  const msgMap = Object.fromEntries(initialMessages.map((m) => [m.key, m]))

  const flowLabel: Record<string, string> = {
    direct: 'Direto',
    presentation: 'Apresentação',
    consultive: 'Consultivo',
  }
  const botTypeLabel: Record<string, string> = {
    channel_link: 'Canal / Link',
    account_stock: 'Venda de Contas',
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-400" />
            Mensagens do bot
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Personalize cada mensagem enviada pelo bot. As alterações são salvas individualmente.
          </p>
        </div>
      </div>

      {/* Context badges */}
      <div className="flex flex-wrap gap-2">
        <div
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <Bot className="h-3 w-3 text-slate-400" />
          <span className="text-slate-400">Tipo:</span>
          <span className="text-slate-200 font-medium">{botTypeLabel[botType] ?? botType}</span>
        </div>
        <div
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <Workflow className="h-3 w-3 text-slate-400" />
          <span className="text-slate-400">Fluxo:</span>
          <span className="text-slate-200 font-medium">{flowLabel[flowType] ?? flowType}</span>
        </div>
        <div
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs"
          style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}
        >
          <Sparkles className="h-3 w-3 text-blue-400" />
          <span className="text-blue-300 text-[11px]">Mensagens ativas destacadas com ponto colorido</span>
        </div>
      </div>

      {/* Groups */}
      {GROUPS.map((group) => {
        const GroupIcon = group.icon
        const c = colorMap[group.color]
        const msgs = group.keys.map((k) => msgMap[k]).filter(Boolean)
        const activeCount = msgs.filter((m) => isMessageActive(m.key, botType, flowType)).length

        return (
          <div key={group.key} className="space-y-2">
            {/* Group header */}
            <div className="flex items-center gap-3 pb-1">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-lg flex-shrink-0"
                style={{ background: c.badge, border: `1px solid ${c.border}` }}
              >
                <GroupIcon className={`h-3.5 w-3.5 ${c.icon}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-200">{group.label}</h3>
                  <span className="text-[10px] text-slate-600">
                    {activeCount}/{msgs.length} ativas
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">{group.description}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="space-y-2 pl-2" style={{ borderLeft: `2px solid rgba(255,255,255,0.05)` }}>
              {msgs.map((m) => (
                <MessageCard
                  key={m.key}
                  msg={{ ...m, content: contents[m.key] ?? m.content }}
                  botId={botId}
                  botType={botType}
                  flowType={flowType}
                  groupColor={group.color}
                  onContentChange={handleContentChange}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
