'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Plus, Pencil, Trash2, Send, Users, Megaphone, Loader2,
  Link as LinkIcon, Copy, Check, AlertTriangle, MessageSquare,
  X, Radio,
} from 'lucide-react'

interface TelegramGroup {
  id: string
  type: 'group' | 'channel'
  title: string
  description: string
  telegram_chat_id: string
  invite_link: string
  photo_url: string
  member_count: number
  created_at: string
}

interface Bot { id: string; name: string; telegram_token: string }
interface ConnectedAccount { account_name: string; phone: string }

interface Props {
  initialGroups: TelegramGroup[]
  bots: Bot[]
  connectedAccount: ConnectedAccount | null
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(20px)',
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} className="ml-1 text-slate-500 hover:text-slate-300 transition-colors">
      {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
    </button>
  )
}

export function GroupsClient({ initialGroups, bots, connectedAccount }: Props) {
  const [groups, setGroups] = useState<TelegramGroup[]>(initialGroups)
  const [showCreate, setShowCreate] = useState(false)
  const [editingGroup, setEditingGroup] = useState<TelegramGroup | null>(null)
  const [sendingTo, setSendingTo] = useState<string | null>(null)

  // Create form
  const [createForm, setCreateForm] = useState({ type: 'group', title: '', description: '', photo_url: '' })
  const [createLoading, setCreateLoading] = useState(false)

  // Edit form
  const [editForm, setEditForm] = useState({ title: '', description: '', photo_url: '' })
  const [editLoading, setEditLoading] = useState(false)

  // Send message form
  const [msgForm, setMsgForm] = useState({ message: '', via: 'account', bot_id: bots[0]?.id ?? '' })
  const [msgLoading, setMsgLoading] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateLoading(true)
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      setGroups((prev) => [data, ...prev])
      setShowCreate(false)
      setCreateForm({ type: 'group', title: '', description: '', photo_url: '' })
      toast.success(`${createForm.type === 'channel' ? 'Canal' : 'Grupo'} criado!`)
    } finally {
      setCreateLoading(false)
    }
  }

  function openEdit(g: TelegramGroup) {
    setEditingGroup(g)
    setEditForm({ title: g.title, description: g.description, photo_url: g.photo_url })
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingGroup) return
    setEditLoading(true)
    try {
      const res = await fetch(`/api/groups/${editingGroup.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      setGroups((prev) => prev.map((g) => (g.id === data.id ? data : g)))
      setEditingGroup(null)
      toast.success('Alterações salvas!')
    } finally {
      setEditLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este grupo/canal do sistema? (não apaga do Telegram)')) return
    const res = await fetch(`/api/groups/${id}`, { method: 'DELETE' })
    if (res.ok) { setGroups((prev) => prev.filter((g) => g.id !== id)); toast.success('Removido') }
  }

  async function handleSendMessage(groupId: string, chatId: string) {
    if (!msgForm.message.trim()) return
    setMsgLoading(true)
    try {
      const body = msgForm.via === 'account'
        ? { target: 'account', chatId, message: msgForm.message, parse_html: true }
        : { via_bot_id: msgForm.bot_id, chatId, message: msgForm.message }

      const res = await fetch('/api/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success('Mensagem enviada!')
      setMsgForm((f) => ({ ...f, message: '' }))
      setSendingTo(null)
    } finally {
      setMsgLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Grupos & Canais</h1>
          <p className="mt-0.5 text-sm text-slate-500">Crie e gerencie grupos e canais do Telegram</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)} disabled={!connectedAccount}>
          <Plus className="h-4 w-4" /> Novo
        </Button>
      </div>

      {/* No account warning */}
      {!connectedAccount && (
        <div className="flex items-start gap-3 rounded-2xl p-4" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <p className="text-sm text-slate-400">
            Conecte sua conta em{' '}
            <a href="/dashboard/telegram-connect" className="text-blue-400 hover:underline">Conta Telegram</a>{' '}
            para criar grupos e canais automaticamente.
          </p>
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <Card className="animate-fade-up">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Criar novo</CardTitle>
              <Button size="sm" variant="ghost" onClick={() => setShowCreate(false)}><X className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'group',   label: 'Grupo',  icon: <Users className="h-5 w-5 text-blue-400" />,   desc: 'Membros podem enviar mensagens' },
                  { value: 'channel', label: 'Canal',  icon: <Radio className="h-5 w-5 text-violet-400" />, desc: 'Apenas admins publicam' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCreateForm((f) => ({ ...f, type: opt.value }))}
                    className="rounded-xl p-3 text-left transition-all"
                    style={createForm.type === opt.value ? {
                      background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.35)',
                    } : cardStyle}
                  >
                    <div className="mb-1">{opt.icon}</div>
                    <p className="text-sm font-semibold text-slate-200">{opt.label}</p>
                    <p className="text-xs text-slate-500">{opt.desc}</p>
                  </button>
                ))}
              </div>
              <div className="space-y-1.5">
                <Label>Nome</Label>
                <Input placeholder="Meu Canal VIP" value={createForm.title} onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label>Descrição (opcional)</Label>
                <Textarea placeholder="Descrição do grupo/canal..." value={createForm.description} onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))} className="min-h-[70px]" />
              </div>
              <div className="space-y-1.5">
                <Label>URL da foto (opcional)</Label>
                <Input placeholder="https://..." value={createForm.photo_url} onChange={(e) => setCreateForm((f) => ({ ...f, photo_url: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
                <Button type="submit" disabled={createLoading}>
                  {createLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Criar no Telegram
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Edit modal */}
      {editingGroup && (
        <Card className="animate-fade-up">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Editar — {editingGroup.title}</CardTitle>
              <Button size="sm" variant="ghost" onClick={() => setEditingGroup(null)}><X className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nome</Label>
                <Input value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label>Descrição</Label>
                <Textarea value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} className="min-h-[70px]" />
              </div>
              <div className="space-y-1.5">
                <Label>URL da foto</Label>
                <Input value={editForm.photo_url} onChange={(e) => setEditForm((f) => ({ ...f, photo_url: e.target.value }))} placeholder="https://..." />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingGroup(null)}>Cancelar</Button>
                <Button type="submit" disabled={editLoading}>
                  {editLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Salvar alterações
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Groups list */}
      {groups.length === 0 && !showCreate ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-16 text-center" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Users className="h-7 w-7 text-slate-600" />
          </div>
          <p className="font-medium text-slate-400">Nenhum grupo ou canal</p>
          <p className="mt-1 text-sm text-slate-600">Conecte sua conta e crie o primeiro</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {groups.map((g) => (
            <div key={g.id} className="rounded-2xl p-5 space-y-4" style={cardStyle}>
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={g.type === 'channel'
                      ? { background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }
                      : { background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)' }
                    }
                  >
                    {g.type === 'channel'
                      ? <Radio className="h-5 w-5 text-violet-400" />
                      : <Users className="h-5 w-5 text-blue-400" />
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-100">{g.title}</p>
                    {g.description && <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{g.description}</p>}
                  </div>
                </div>
                <Badge variant={g.type === 'channel' ? 'default' : 'secondary'}>
                  {g.type === 'channel' ? 'Canal' : 'Grupo'}
                </Badge>
              </div>

              {/* Info */}
              <div className="space-y-1.5">
                {g.telegram_chat_id && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="font-mono text-slate-600">ID:</span>
                    <span className="font-mono">{g.telegram_chat_id}</span>
                    <CopyButton text={g.telegram_chat_id} />
                  </div>
                )}
                {g.invite_link && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <LinkIcon className="h-3 w-3 text-slate-600" />
                    <a href={g.invite_link} target="_blank" rel="noopener" className="text-blue-400 hover:underline truncate max-w-[180px]">{g.invite_link}</a>
                    <CopyButton text={g.invite_link} />
                  </div>
                )}
              </div>

              {/* Send message panel */}
              {sendingTo === g.id ? (
                <div className="space-y-3 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <Textarea
                    placeholder="Mensagem (suporta HTML: <b>negrito</b>)"
                    className="min-h-[80px] text-sm"
                    value={msgForm.message}
                    onChange={(e) => setMsgForm((f) => ({ ...f, message: e.target.value }))}
                    autoFocus
                  />
                  {bots.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Label className="text-xs shrink-0 text-slate-500">Enviar via</Label>
                      <Select value={msgForm.via} onValueChange={(v) => setMsgForm((f) => ({ ...f, via: v }))}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="account">Minha conta Telegram</SelectItem>
                          {bots.map((b) => (
                            <SelectItem key={b.id} value={b.id}>Bot: {b.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setSendingTo(null)} className="flex-1">Cancelar</Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      disabled={msgLoading || !msgForm.message.trim()}
                      onClick={() => handleSendMessage(g.id, g.telegram_chat_id)}
                    >
                      {msgLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      Enviar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 gap-1.5" onClick={() => setSendingTo(g.id)} disabled={!g.telegram_chat_id}>
                    <MessageSquare className="h-3.5 w-3.5" />
                    Enviar mensagem
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openEdit(g)} title="Editar">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(g.id)} title="Remover">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
