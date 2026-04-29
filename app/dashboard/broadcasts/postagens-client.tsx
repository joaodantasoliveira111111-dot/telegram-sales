'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import {
  PenLine, CalendarClock, History,
  Bold, Italic, Code as CodeIcon, Link2,
  Users, Megaphone, Send,
  Plus, Trash2, Loader2,
  UserX, UserCheck, Clock, CheckCircle2, AlertCircle, RefreshCw,
  X, Image as ImageIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MediaUpload } from '@/components/media-upload'
import { cn } from '@/lib/utils'
import { RemarketingClient } from './remarketing-client'

type Tab = 'compose' | 'scheduled' | 'history' | 'remarketing'
type DestMode = 'bot' | 'group'

interface InlineButton { text: string; url: string }

interface Broadcast {
  id: string; bot_id?: string; name: string; message_text: string
  target_type: string; status: string; sent_count: number
  media_type?: string | null; media_url?: string | null
  scheduled_at?: string | null; inline_keyboard?: unknown
  created_at: string; bot?: { name: string }
}

interface ScheduledPost {
  id: string; bot_id: string; chat_id: string; chat_title: string | null
  message_text: string | null; media_url: string | null; media_type: string | null
  scheduled_at: string; sent_at: string | null
  status: 'pending' | 'sent' | 'failed'; error_msg: string | null
  bot?: { id: string; name: string } | null
}

interface Props {
  broadcasts: Broadcast[]
  scheduledPosts: ScheduledPost[]
  bots: { id: string; name: string; telegram_token: string }[]
  groups: { telegram_chat_id: string; title: string; type: string }[]
}

const SEGMENTS = [
  { value: 'unpaid',  label: 'Não compraram',   desc: 'Nunca pagaram', icon: UserX },
  { value: 'expired', label: 'Acesso expirado',  desc: 'Assinatura vencida', icon: Clock },
  { value: 'active',  label: 'Ativos agora',     desc: 'Pagando atualmente', icon: UserCheck },
  { value: 'all',     label: 'Todos',            desc: 'Base completa do bot', icon: Users },
]

const glass = {
  card: { background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(255,255,255,0.84)' } as React.CSSProperties,
  input: { background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(255,255,255,0.88)' } as React.CSSProperties,
  activeTab: { background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#c4b5fd' } as React.CSSProperties,
  inactiveTab: { background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.84)', color: '#64748b' } as React.CSSProperties,
}

function formatDt(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

function StatusPill({ status, label }: { status: string; label: string }) {
  const style: React.CSSProperties =
    status === 'sent' ? { background: 'rgba(52,211,153,0.12)', color: '#6ee7b7' }
    : status === 'scheduled' || status === 'pending' ? { background: 'rgba(251,191,36,0.12)', color: '#fcd34d' }
    : status === 'failed' ? { background: 'rgba(239,68,68,0.12)', color: '#fca5a5' }
    : { background: 'rgba(255,255,255,0.84)', color: '#64748b' }
  return (
    <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={style}>
      {label}
    </span>
  )
}

function BroadcastCard({ b, onSend, onDelete, isSending }: {
  b: Broadcast; onSend: () => void; onDelete: () => void; isSending: boolean
}) {
  const seg = SEGMENTS.find(s => s.value === b.target_type)
  return (
    <div className="rounded-2xl p-4 transition-all" style={glass.card}>
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-200">{b.name}</p>
          <p className="text-[11px] text-slate-600">{b.bot?.name}</p>
        </div>
        <StatusPill
          status={b.status}
          label={b.status === 'sent' ? 'Enviado' : b.status === 'scheduled' ? 'Agendado' : 'Rascunho'}
        />
      </div>

      <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-slate-500">{b.message_text}</p>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {seg && (
          <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] text-slate-500"
            style={{ background: 'rgba(255,255,255,0.78)' }}>
            <Users className="h-2.5 w-2.5" />{seg.label}
          </span>
        )}
        {b.status === 'sent' && b.sent_count > 0 && (
          <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] text-emerald-400"
            style={{ background: 'rgba(52,211,153,0.1)' }}>
            <CheckCircle2 className="h-2.5 w-2.5" />{b.sent_count} recebidos
          </span>
        )}
        {b.scheduled_at && b.status === 'scheduled' && (
          <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] text-amber-400"
            style={{ background: 'rgba(251,191,36,0.1)' }}>
            <Clock className="h-2.5 w-2.5" />{formatDt(b.scheduled_at)}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-700">{new Date(b.created_at).toLocaleDateString('pt-BR')}</span>
        <div className="flex gap-1.5">
          {(b.status === 'draft' || b.status === 'scheduled') && (
            <Button size="sm" onClick={onSend} disabled={isSending}>
              {isSending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
              Enviar
            </Button>
          )}
          {b.status === 'sent' && (
            <Button size="sm" variant="outline" onClick={onSend} disabled={isSending}>
              {isSending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              Reenviar
            </Button>
          )}
          <Button size="sm" variant="destructive" onClick={onDelete}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function ScheduledPostCard({ p, onDelete, onSend }: {
  p: ScheduledPost; onDelete: () => void; onSend?: () => void
}) {
  return (
    <div className="rounded-2xl p-4 transition-all" style={glass.card}>
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-200">{p.chat_title ?? p.chat_id}</p>
          <p className="text-[11px] text-slate-600">{p.bot?.name}</p>
        </div>
        <StatusPill
          status={p.status}
          label={p.status === 'sent' ? 'Enviado' : p.status === 'failed' ? 'Falhou' : 'Aguardando'}
        />
      </div>

      {p.message_text && (
        <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-slate-500">{p.message_text}</p>
      )}

      <div className="mb-3 flex flex-wrap gap-1.5">
        <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] text-slate-500"
          style={{ background: 'rgba(255,255,255,0.78)' }}>
          <Clock className="h-2.5 w-2.5" />
          {p.status === 'sent' && p.sent_at ? `Enviado ${formatDt(p.sent_at)}` : formatDt(p.scheduled_at)}
        </span>
        {p.error_msg && (
          <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] text-red-400"
            style={{ background: 'rgba(239,68,68,0.1)' }}>
            <AlertCircle className="h-2.5 w-2.5" />{p.error_msg.slice(0, 40)}
          </span>
        )}
      </div>

      <div className="flex justify-end gap-1.5">
        {p.status === 'pending' && onSend && (
          <Button size="sm" onClick={onSend}>
            <Send className="h-3 w-3" />Enviar agora
          </Button>
        )}
        {(p.status === 'pending' || p.status === 'failed') && (
          <Button size="sm" variant="destructive" onClick={onDelete}>
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  )
}

export function PostagensClient({ broadcasts: init, scheduledPosts: initSched, bots, groups }: Props) {
  const [tab, setTab] = useState<Tab>('compose')
  const [destMode, setDestMode] = useState<DestMode>('bot')
  const [loading, setLoading] = useState(false)
  const [broadcasts, setBroadcasts] = useState(init)
  const [scheduledPosts, setScheduledPosts] = useState(initSched)
  const [sending, setSending] = useState<string | null>(null)
  const [sendingPost, setSendingPost] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [form, setForm] = useState({
    bot_id: bots[0]?.id ?? '',
    target_type: 'unpaid',
    name: '',
    chat_id: '',
    chat_title: '',
    message_text: '',
    media_url: '',
    media_type: 'photo',
    scheduled_at: '',
    isScheduled: false,
  })
  const [buttonRows, setButtonRows] = useState<InlineButton[][]>([])

  function set(k: string, v: unknown) { setForm(f => ({ ...f, [k]: v })) }

  function insertFormat(open: string, close: string) {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = form.message_text.slice(start, end)
    const newText = form.message_text.slice(0, start) + open + selected + close + form.message_text.slice(end)
    set('message_text', newText)
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + open.length, end + open.length)
    }, 0)
  }

  function addRow() { setButtonRows(r => [...r, [{ text: '', url: '' }]]) }
  function addBtn(ri: number) {
    setButtonRows(rows => rows.map((row, i) => i === ri ? [...row, { text: '', url: '' }] : row))
  }
  function removeBtn(ri: number, bi: number) {
    setButtonRows(rows => rows.map((row, i) => i === ri ? row.filter((_, j) => j !== bi) : row).filter(r => r.length > 0))
  }
  function updateBtn(ri: number, bi: number, field: 'text' | 'url', value: string) {
    setButtonRows(rows => rows.map((row, i) => i === ri ? row.map((btn, j) => j === bi ? { ...btn, [field]: value } : btn) : row))
  }

  function resetForm() {
    setForm(f => ({ ...f, message_text: '', media_url: '', name: '', scheduled_at: '', isScheduled: false, chat_id: '', chat_title: '' }))
    setButtonRows([])
  }

  async function handleSubmit() {
    if (!form.message_text.trim() && !form.media_url) {
      toast.error('Informe uma mensagem ou URL de mídia')
      return
    }
    if (!form.bot_id) { toast.error('Selecione um bot'); return }

    setLoading(true)
    try {
      if (destMode === 'bot') {
        const body: Record<string, unknown> = {
          bot_id: form.bot_id,
          name: form.name || `Postagem ${new Date().toLocaleString('pt-BR')}`,
          message_text: form.message_text,
          media_url: form.media_url || null,
          media_type: form.media_url ? form.media_type : null,
          target_type: form.target_type,
          scheduled_at: form.isScheduled ? form.scheduled_at || null : null,
          inline_keyboard: buttonRows.length > 0 ? buttonRows : null,
        }
        const res = await fetch('/api/broadcasts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (!res.ok) { toast.error(data.error ?? 'Erro ao criar'); return }

        if (!form.isScheduled) {
          const sendRes = await fetch(`/api/broadcasts/${data.id}/send`, { method: 'POST' })
          const sendData = await sendRes.json()
          if (sendRes.ok) {
            toast.success(`Enviado para ${sendData.sent} usuário(s)!`)
            data.status = 'sent'
            data.sent_count = sendData.sent ?? 0
          } else {
            toast.error(sendData.error ?? 'Erro ao enviar')
          }
        } else {
          toast.success('Transmissão agendada!')
        }
        setBroadcasts(prev => [data, ...prev])
      } else {
        if (!form.chat_id) { toast.error('Selecione um grupo ou canal'); return }

        const scheduledAt = form.isScheduled
          ? new Date(form.scheduled_at).toISOString()
          : new Date(Date.now() + 5000).toISOString()

        const body = {
          bot_id: form.bot_id,
          chat_id: form.chat_id,
          chat_title: form.chat_title || null,
          message_text: form.message_text || null,
          media_url: form.media_url || null,
          media_type: form.media_url ? form.media_type : null,
          scheduled_at: scheduledAt,
        }
        const res = await fetch('/api/scheduled-posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (!res.ok) { toast.error(data.error ?? 'Erro ao criar'); return }

        if (!form.isScheduled) {
          const sendRes = await fetch(`/api/scheduled-posts/${data.id}/send`, { method: 'POST' })
          if (sendRes.ok) {
            toast.success('Mensagem enviada ao grupo!')
            data.status = 'sent'
          } else {
            const sendData = await sendRes.json()
            toast.error(sendData.error ?? 'Erro ao enviar')
          }
        } else {
          toast.success('Post agendado!')
        }
        setScheduledPosts(prev => [data, ...prev])
      }

      resetForm()
    } finally {
      setLoading(false)
    }
  }

  async function handleSendBroadcast(id: string) {
    if (!confirm('Enviar esta transmissão agora?')) return
    setSending(id)
    try {
      const res = await fetch(`/api/broadcasts/${id}/send`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Enviado para ${data.sent} usuário(s)!`)
        setBroadcasts(prev => prev.map(b => b.id === id
          ? { ...b, status: 'sent', sent_count: data.sent_count ?? b.sent_count }
          : b
        ))
      } else {
        toast.error(data.error ?? 'Erro ao enviar')
      }
    } finally { setSending(null) }
  }

  async function handleSendPost(id: string) {
    if (!confirm('Enviar este post agora?')) return
    setSendingPost(id)
    try {
      const res = await fetch(`/api/scheduled-posts/${id}/send`, { method: 'POST' })
      if (res.ok) {
        toast.success('Post enviado!')
        setScheduledPosts(prev => prev.map(p => p.id === id ? { ...p, status: 'sent' as const } : p))
      } else {
        const data = await res.json()
        toast.error(data.error ?? 'Erro ao enviar')
      }
    } finally { setSendingPost(null) }
  }

  async function handleDeleteBroadcast(id: string) {
    if (!confirm('Excluir?')) return
    await fetch(`/api/broadcasts/${id}`, { method: 'DELETE' })
    setBroadcasts(prev => prev.filter(b => b.id !== id))
    toast.success('Excluído')
  }

  async function handleDeletePost(id: string) {
    if (!confirm('Cancelar post?')) return
    await fetch(`/api/scheduled-posts/${id}`, { method: 'DELETE' })
    setScheduledPosts(prev => prev.filter(p => p.id !== id))
    toast.success('Post cancelado')
  }

  const pendingBroadcasts = broadcasts.filter(b => b.status === 'scheduled')
  const pendingPosts = scheduledPosts.filter(p => p.status === 'pending')
  const totalScheduled = pendingBroadcasts.length + pendingPosts.length

  const sentBroadcasts = broadcasts.filter(b => b.status === 'sent')
  const sentPosts = scheduledPosts.filter(p => p.status === 'sent' || p.status === 'failed')

  const minDatetime = new Date(Date.now() + 5 * 60000).toISOString().slice(0, 16)
  const selectedBot = bots.find(b => b.id === form.bot_id)

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-slate-100">Postagens</h2>
        <p className="text-sm text-slate-500">
          Envie mensagens segmentadas para usuários do bot ou publique em grupos e canais
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {([
          { key: 'compose' as const, label: 'Compor', icon: PenLine },
          { key: 'scheduled' as const, label: totalScheduled > 0 ? `Agendadas (${totalScheduled})` : 'Agendadas', icon: CalendarClock },
          { key: 'history' as const, label: 'Histórico', icon: History },
          { key: 'remarketing' as const, label: 'Remarketing', icon: RefreshCw },
        ]).map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all"
            style={tab === key ? glass.activeTab : glass.inactiveTab}>
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </div>

      {/* ── COMPOSE TAB ── */}
      {tab === 'compose' && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">

          {/* Left: Form */}
          <div className="space-y-4 xl:col-span-3">

            {/* Destination selector */}
            <div className="rounded-2xl p-4" style={glass.card}>
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-600">Destino</p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { mode: 'bot' as const, icon: Megaphone, label: 'Usuários do Bot', desc: 'Remarketing segmentado' },
                  { mode: 'group' as const, icon: Users, label: 'Grupos & Canais', desc: 'Posts em grupos/canais' },
                ] as const).map(({ mode, icon: Icon, label, desc }) => {
                  const active = destMode === mode
                  return (
                    <button key={mode} onClick={() => setDestMode(mode)}
                      className="flex items-center gap-3 rounded-xl p-3 text-left transition-all"
                      style={active
                        ? { background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.35)' }
                        : { background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(255,255,255,0.82)' }}>
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: active ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.78)' }}>
                        <Icon className={cn('h-4 w-4', active ? 'text-violet-400' : 'text-slate-600')} />
                      </div>
                      <div>
                        <p className={cn('text-sm font-semibold', active ? 'text-violet-300' : 'text-slate-400')}>{label}</p>
                        <p className="text-[10px] text-slate-600">{desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Bot + segment/group */}
            <div className="space-y-3 rounded-2xl p-4" style={glass.card}>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-400">Bot</label>
                <select value={form.bot_id} onChange={e => set('bot_id', e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none"
                  style={glass.input}>
                  {bots.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>

              {destMode === 'bot' ? (
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-400">Público-alvo</label>
                  <div className="grid grid-cols-2 gap-2">
                    {SEGMENTS.map(seg => {
                      const Icon = seg.icon
                      const active = form.target_type === seg.value
                      return (
                        <button key={seg.value} onClick={() => set('target_type', seg.value)}
                          className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-left transition-all"
                          style={active
                            ? { background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)' }
                            : { background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(255,255,255,0.80)' }}>
                          <Icon className={cn('h-3.5 w-3.5 shrink-0', active ? 'text-violet-400' : 'text-slate-600')} />
                          <div className="min-w-0">
                            <p className={cn('text-xs font-semibold truncate', active ? 'text-violet-300' : 'text-slate-400')}>{seg.label}</p>
                            <p className="truncate text-[10px] text-slate-600">{seg.desc}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-400">Grupo / Canal de destino</label>
                  {groups.length > 0 ? (
                    <select
                      value={form.chat_id}
                      onChange={e => {
                        const g = groups.find(g => g.telegram_chat_id === e.target.value)
                        setForm(f => ({ ...f, chat_id: e.target.value, chat_title: g?.title ?? '' }))
                      }}
                      className="w-full rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none"
                      style={glass.input}
                    >
                      <option value="">— Selecione um grupo ou canal —</option>
                      {groups.map(g => (
                        <option key={g.telegram_chat_id} value={g.telegram_chat_id}>
                          {g.title} ({g.type})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      placeholder="@username ou -100xxxxxxxx"
                      value={form.chat_id}
                      onChange={e => set('chat_id', e.target.value)}
                      className="w-full rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none placeholder:text-slate-600"
                      style={glass.input}
                    />
                  )}
                  {groups.length === 0 && (
                    <p className="mt-1 text-[10px] text-slate-600">
                      Nenhum grupo conectado. Vá em Grupos &amp; Canais para adicionar.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Message composer */}
            <div className="space-y-3 rounded-2xl p-4" style={glass.card}>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-400">Mensagem</label>
                  {/* Formatting toolbar */}
                  <div className="flex gap-1">
                    {([
                      { icon: Bold,     open: '<b>',      close: '</b>',      title: 'Negrito' },
                      { icon: Italic,   open: '<i>',      close: '</i>',      title: 'Itálico' },
                      { icon: CodeIcon, open: '<code>',   close: '</code>',   title: 'Código' },
                      { icon: Link2,    open: '<a href="', close: '">Link</a>', title: 'Link' },
                    ] as const).map(({ icon: Icon, open, close, title }) => (
                      <button key={title} title={title} type="button"
                        onMouseDown={e => { e.preventDefault(); insertFormat(open, close) }}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-all hover:text-slate-200"
                        style={{ background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(255,255,255,0.84)' }}>
                        <Icon className="h-3.5 w-3.5" />
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  ref={textareaRef}
                  rows={6}
                  placeholder="Escreva sua mensagem... Use os botões acima para formatar"
                  value={form.message_text}
                  onChange={e => set('message_text', e.target.value)}
                  className="w-full resize-none rounded-xl px-3 py-2.5 text-sm leading-relaxed text-slate-200 outline-none placeholder:text-slate-600"
                  style={glass.input}
                />
                <p className="mt-1 text-[10px] text-slate-600">
                  HTML do Telegram: &lt;b&gt;negrito&lt;/b&gt; · &lt;i&gt;itálico&lt;/i&gt; · &lt;code&gt;código&lt;/code&gt;
                </p>
              </div>

              {/* Media upload */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-400">
                  Mídia <span className="font-normal text-slate-600">(opcional)</span>
                </label>
                <MediaUpload
                  value={form.media_url}
                  mediaType={form.media_type}
                  onChange={(url, type) => setForm(f => ({ ...f, media_url: url, media_type: type }))}
                  onClear={() => setForm(f => ({ ...f, media_url: '', media_type: 'photo' }))}
                />
              </div>
            </div>

            {/* Inline buttons */}
            <div className="space-y-3 rounded-2xl p-4" style={glass.card}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400">Botões inline</p>
                  <p className="text-[10px] text-slate-600">Aparecem abaixo da mensagem no Telegram</p>
                </div>
                <Button size="sm" variant="outline" onClick={addRow}>
                  <Plus className="h-3.5 w-3.5" />Adicionar linha
                </Button>
              </div>

              {buttonRows.length === 0 ? (
                <p className="py-1 text-center text-xs text-slate-700">Nenhum botão adicionado</p>
              ) : (
                <div className="space-y-2">
                  {buttonRows.map((row, ri) => (
                    <div key={ri} className="space-y-2 rounded-xl p-3"
                      style={{ background: 'rgba(255,255,255,0.68)', border: '1px solid rgba(255,255,255,0.80)' }}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-600">Linha {ri + 1}</span>
                        <button type="button" onClick={() => addBtn(ri)}
                          className="flex items-center gap-1 text-[10px] text-violet-400 transition-colors hover:text-violet-300">
                          <Plus className="h-3 w-3" /> botão lado a lado
                        </button>
                      </div>
                      {row.map((btn, bi) => (
                        <div key={bi} className="flex items-center gap-2">
                          <input
                            placeholder="Texto"
                            value={btn.text}
                            onChange={e => updateBtn(ri, bi, 'text', e.target.value)}
                            className="flex-1 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none placeholder:text-slate-600"
                            style={glass.input}
                          />
                          <input
                            placeholder="https://..."
                            value={btn.url}
                            onChange={e => updateBtn(ri, bi, 'url', e.target.value)}
                            className="flex-1 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none placeholder:text-slate-600"
                            style={glass.input}
                          />
                          <button type="button" onClick={() => removeBtn(ri, bi)}
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-slate-600 transition-colors hover:text-red-400"
                            style={{ background: 'rgba(255,255,255,0.75)' }}>
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Schedule + send */}
            <div className="space-y-3 rounded-2xl p-4" style={glass.card}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400">Agendar envio</p>
                  <p className="text-[10px] text-slate-600">
                    {form.isScheduled ? 'Enviado automaticamente no horário escolhido' : 'Clique em enviar para disparar agora'}
                  </p>
                </div>
                <button type="button"
                  onClick={() => set('isScheduled', !form.isScheduled)}
                  className="relative h-5 w-9 rounded-full transition-all"
                  style={{ background: form.isScheduled ? '#8b5cf6' : 'rgba(255,255,255,0.88)' }}>
                  <span
                    className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all duration-200"
                    style={{ left: form.isScheduled ? '18px' : '2px' }}
                  />
                </button>
              </div>

              {form.isScheduled && (
                <input
                  type="datetime-local"
                  min={minDatetime}
                  value={form.scheduled_at}
                  onChange={e => set('scheduled_at', e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none"
                  style={glass.input}
                />
              )}

              <Button className="w-full" size="lg" onClick={handleSubmit} disabled={loading}>
                {loading
                  ? <><Loader2 className="h-4 w-4 animate-spin" />Enviando...</>
                  : form.isScheduled
                    ? <><CalendarClock className="h-4 w-4" />Agendar postagem</>
                    : <><Send className="h-4 w-4" />Enviar agora</>
                }
              </Button>
            </div>
          </div>

          {/* Right: Live Preview */}
          <div className="xl:col-span-2">
            <div className="sticky top-6">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-600">Preview ao vivo</p>

              <div className="overflow-hidden rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.68)', border: '1px solid rgba(255,255,255,0.82)' }}>
                {/* Chat header */}
                <div className="flex items-center gap-3 px-4 py-3"
                  style={{ background: '#0d1117', borderBottom: '1px solid rgba(255,255,255,0.80)' }}>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
                    {selectedBot?.name?.slice(0, 1)?.toUpperCase() ?? 'B'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{selectedBot?.name ?? 'Bot'}</p>
                    <p className="text-[10px] text-emerald-400">online</p>
                  </div>
                </div>

                {/* Chat body */}
                <div className="min-h-[260px] space-y-2 p-4" style={{ background: '#0a0f1a' }}>
                  {!form.message_text && !form.media_url && buttonRows.length === 0 ? (
                    <div className="flex h-48 items-center justify-center">
                      <p className="text-center text-xs text-slate-700">
                        Digite uma mensagem<br />para ver o preview
                      </p>
                    </div>
                  ) : (
                    <div className="max-w-[85%]">
                      <div className="rounded-2xl rounded-tl-none px-3.5 py-2.5" style={{ background: '#182533' }}>
                        {form.media_url && (
                          <div className="mb-2 flex items-center gap-1.5 rounded-lg px-2 py-1.5"
                            style={{ background: 'rgba(255,255,255,0.80)' }}>
                            <ImageIcon className="h-3 w-3 text-slate-500" />
                            <span className="truncate text-[10px] text-slate-500">{form.media_type} anexado</span>
                          </div>
                        )}
                        {form.message_text && (
                          <p
                            className="text-sm leading-relaxed text-slate-200"
                            dangerouslySetInnerHTML={{ __html: form.message_text.replace(/\n/g, '<br />') }}
                          />
                        )}
                        <p className="mt-1 text-right text-[10px] text-slate-600">agora</p>
                      </div>

                      {buttonRows.length > 0 && (
                        <div className="mt-1 space-y-1">
                          {buttonRows.map((row, ri) => (
                            <div key={ri} className="flex gap-1">
                              {row.map((btn, bi) => (
                                <div key={bi}
                                  className="flex-1 rounded-lg py-1.5 text-center text-xs font-medium text-blue-300"
                                  style={{ background: '#182533', border: '1px solid rgba(59,130,246,0.25)' }}>
                                  {btn.text || 'Botão'}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Segment info */}
              {destMode === 'bot' && (
                <div className="mt-3 rounded-xl px-3 py-2"
                  style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.12)' }}>
                  <p className="text-[10px] text-slate-600">
                    Alvo:{' '}
                    <span className="font-semibold text-violet-400">
                      {SEGMENTS.find(s => s.value === form.target_type)?.label}
                    </span>
                    {' — '}{SEGMENTS.find(s => s.value === form.target_type)?.desc}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── SCHEDULED TAB ── */}
      {tab === 'scheduled' && (
        <div className="space-y-6">
          {totalScheduled === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl py-16 text-center"
              style={{ background: 'rgba(255,255,255,0.68)', border: '1px dashed rgba(255,255,255,0.84)' }}>
              <CalendarClock className="mb-3 h-10 w-10 text-slate-700" />
              <p className="font-medium text-slate-400">Nenhuma postagem agendada</p>
              <p className="mt-1 text-sm text-slate-600">Ative o agendamento ao criar uma postagem</p>
              <Button className="mt-4" size="sm" onClick={() => setTab('compose')}>
                <PenLine className="h-4 w-4" />Compor postagem
              </Button>
            </div>
          ) : (
            <>
              {pendingBroadcasts.length > 0 && (
                <div>
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-600">Para usuários do bot</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {pendingBroadcasts.map(b => (
                      <BroadcastCard key={b.id} b={b}
                        onSend={() => handleSendBroadcast(b.id)}
                        onDelete={() => handleDeleteBroadcast(b.id)}
                        isSending={sending === b.id}
                      />
                    ))}
                  </div>
                </div>
              )}
              {pendingPosts.length > 0 && (
                <div>
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-600">Para grupos &amp; canais</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {pendingPosts.map(p => (
                      <ScheduledPostCard key={p.id} p={p}
                        onDelete={() => handleDeletePost(p.id)}
                        onSend={() => handleSendPost(p.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {tab === 'history' && (
        <div className="space-y-6">
          {sentBroadcasts.length === 0 && sentPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl py-16 text-center"
              style={{ background: 'rgba(255,255,255,0.68)', border: '1px dashed rgba(255,255,255,0.84)' }}>
              <History className="mb-3 h-10 w-10 text-slate-700" />
              <p className="font-medium text-slate-400">Nenhum envio ainda</p>
            </div>
          ) : (
            <>
              {sentBroadcasts.length > 0 && (
                <div>
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-600">Transmissões enviadas</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {sentBroadcasts.map(b => (
                      <BroadcastCard key={b.id} b={b}
                        onSend={() => handleSendBroadcast(b.id)}
                        onDelete={() => handleDeleteBroadcast(b.id)}
                        isSending={sending === b.id}
                      />
                    ))}
                  </div>
                </div>
              )}
              {sentPosts.length > 0 && (
                <div>
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-600">Posts em grupos</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {sentPosts.map(p => (
                      <ScheduledPostCard key={p.id} p={p} onDelete={() => handleDeletePost(p.id)} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {tab === 'remarketing' && (
        <RemarketingClient bots={bots} />
      )}
    </div>
  )
}
