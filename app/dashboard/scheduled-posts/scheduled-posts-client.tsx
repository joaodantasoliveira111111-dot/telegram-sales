'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { CalendarClock, Plus, Trash2, X, Send, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Post {
  id: string
  bot_id: string
  chat_id: string
  chat_title: string | null
  message_text: string | null
  media_url: string | null
  media_type: string | null
  scheduled_at: string
  sent_at: string | null
  status: 'pending' | 'sent' | 'failed'
  error_msg: string | null
  bot?: { id: string; name: string } | null
}

interface Props {
  initialPosts: Post[]
  bots: { id: string; name: string; telegram_token: string }[]
  groups: { telegram_chat_id: string; title: string; type: string }[]
}

function formatDatetime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function statusBadge(status: Post['status']) {
  if (status === 'sent') return <span className="flex items-center gap-1 text-[10px] text-emerald-400"><CheckCircle2 className="h-3 w-3" />Enviado</span>
  if (status === 'failed') return <span className="flex items-center gap-1 text-[10px] text-red-400"><AlertCircle className="h-3 w-3" />Falhou</span>
  return <span className="flex items-center gap-1 text-[10px] text-blue-400"><Clock className="h-3 w-3" />Agendado</span>
}

function PostForm({ bots, groups, onSave, onCancel }: {
  bots: Props['bots']
  groups: Props['groups']
  onSave: (p: Post) => void
  onCancel: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    bot_id: '', chat_id: '', chat_title: '',
    message_text: '', media_url: '', media_type: '',
    scheduled_at: '',
  })

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  function handleGroupChange(chatId: string) {
    const g = groups.find(g => g.telegram_chat_id === chatId)
    set('chat_id', chatId)
    if (g) set('chat_title', g.title)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.message_text && !form.media_url) { toast.error('Informe mensagem ou URL de mídia'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/scheduled-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          media_url: form.media_url || null,
          media_type: form.media_type || null,
          chat_title: form.chat_title || null,
          // Convert local datetime to ISO
          scheduled_at: new Date(form.scheduled_at).toISOString(),
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success('Post agendado!')
      onSave(data)
    } finally { setLoading(false) }
  }

  // Minimum datetime: now + 5 minutes
  const minDatetime = new Date(Date.now() + 5 * 60000).toISOString().slice(0, 16)

  return (
    <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)' }}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">Novo post agendado</h3>
        <button onClick={onCancel} className="text-slate-500 hover:text-slate-300"><X className="h-4 w-4" /></button>
      </div>
      <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Bot</Label>
          <select value={form.bot_id} onChange={e => set('bot_id', e.target.value)} required
            className="w-full rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <option value="">— Selecione —</option>
            {bots.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Grupo / Canal</Label>
          {groups.length > 0 ? (
            <select value={form.chat_id} onChange={e => handleGroupChange(e.target.value)} required
              className="w-full rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <option value="">— Selecione —</option>
              {groups.map(g => <option key={g.telegram_chat_id} value={g.telegram_chat_id}>{g.title}</option>)}
            </select>
          ) : (
            <Input placeholder="@username ou -100xxxxxxxx" value={form.chat_id} onChange={e => set('chat_id', e.target.value)} required />
          )}
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Mensagem</Label>
          <textarea
            value={form.message_text}
            onChange={e => set('message_text', e.target.value)}
            placeholder="Texto da mensagem (suporta HTML: <b>, <i>, <code>)"
            rows={4}
            className="w-full rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none resize-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
        </div>
        <div className="space-y-1.5">
          <Label>URL de mídia <span className="text-slate-600">(opcional)</span></Label>
          <Input placeholder="https://..." value={form.media_url} onChange={e => set('media_url', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Tipo de mídia</Label>
          <select value={form.media_type} onChange={e => set('media_type', e.target.value)}
            className="w-full rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <option value="">— Nenhuma —</option>
            <option value="photo">Foto</option>
            <option value="video">Vídeo</option>
          </select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Data e hora do envio</Label>
          <Input type="datetime-local" min={minDatetime} value={form.scheduled_at} onChange={e => set('scheduled_at', e.target.value)} required />
          <p className="text-[11px] text-slate-600">Horário de Brasília (UTC-3)</p>
        </div>
        <div className="sm:col-span-2 flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancelar</Button>
          <Button type="submit" size="sm" disabled={loading} className="gap-2">
            <CalendarClock className="h-4 w-4" />
            {loading ? 'Agendando...' : 'Agendar post'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export function ScheduledPostsClient({ initialPosts, bots, groups }: Props) {
  const [posts, setPosts] = useState(initialPosts)
  const [creating, setCreating] = useState(false)
  const [filter, setFilter] = useState<'pending' | 'sent' | 'all'>('pending')

  const handleCreate = useCallback((p: Post) => { setPosts(prev => [p, ...prev]); setCreating(false) }, [])

  async function handleDelete(id: string) {
    if (!confirm('Cancelar este post agendado?')) return
    await fetch(`/api/scheduled-posts/${id}`, { method: 'DELETE' })
    setPosts(p => p.filter(x => x.id !== id))
    toast.success('Post cancelado')
  }

  const filtered = posts.filter(p => filter === 'all' || p.status === filter)
  const pendingCount = posts.filter(p => p.status === 'pending').length

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-blue-400" />
            Agendamento de Conteúdo
          </h2>
          <p className="text-sm text-slate-500 mt-1">Programe posts para seus grupos e canais com antecedência.</p>
        </div>
        <Button onClick={() => setCreating(true)} className="gap-2" disabled={creating}>
          <Plus className="h-4 w-4" />Agendar post
        </Button>
      </div>

      <div className="flex gap-2">
        {(['pending', 'sent', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="text-xs px-3 py-1.5 rounded-lg transition-all"
            style={filter === f
              ? { background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#93c5fd' }
              : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#64748b' }}>
            {f === 'pending' ? `Agendados (${pendingCount})` : f === 'sent' ? 'Enviados' : 'Todos'}
          </button>
        ))}
      </div>

      {creating && <PostForm bots={bots} groups={groups} onSave={handleCreate} onCancel={() => setCreating(false)} />}

      {filtered.length === 0 && !creating ? (
        <div className="flex flex-col items-center justify-center rounded-2xl py-16 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
          <CalendarClock className="h-10 w-10 text-slate-700 mb-3" />
          <p className="text-slate-400 font-medium">Nenhum post agendado</p>
          <p className="text-sm text-slate-600 mt-1">Agende conteúdo para seus grupos com antecedência</p>
          <Button className="mt-5 gap-2" onClick={() => setCreating(true)}><Plus className="h-4 w-4" />Agendar primeiro post</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(post => (
            <div key={post.id} className="rounded-2xl p-4 space-y-3"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {statusBadge(post.status)}
                    <span className="text-[10px] text-slate-600">{post.bot?.name}</span>
                    <span className="text-[10px] text-slate-600">→ {post.chat_title ?? post.chat_id}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {post.status === 'sent' && post.sent_at
                      ? `Enviado em ${formatDatetime(post.sent_at)}`
                      : `Agendado para ${formatDatetime(post.scheduled_at)}`}
                  </p>
                </div>
                {post.status === 'pending' && (
                  <button onClick={() => handleDelete(post.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:text-red-400"
                    style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {post.message_text && (
                <p className="text-xs text-slate-400 bg-black/20 rounded-lg px-3 py-2 line-clamp-2">{post.message_text}</p>
              )}
              {post.media_url && (
                <p className="text-[11px] text-slate-600 flex items-center gap-1">
                  <Send className="h-3 w-3" />{post.media_type === 'video' ? 'Vídeo' : 'Foto'}: {post.media_url.slice(0, 60)}...
                </p>
              )}
              {post.error_msg && (
                <p className="text-[11px] text-red-400 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{post.error_msg}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
