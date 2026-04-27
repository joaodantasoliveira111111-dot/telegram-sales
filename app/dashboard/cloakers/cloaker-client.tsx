'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Shield, Plus, Copy, Trash2, Pencil, X, Check,
  MousePointerClick, Bot, Users, ToggleLeft, ToggleRight,
  ExternalLink, ChevronDown, ChevronUp, Clock, AlertCircle,
  Link as LinkIcon, Eye, EyeOff,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// ─── types ────────────────────────────────────────────────────────────────────

interface Cloaker {
  id: string
  bot_id: string | null
  name: string
  slug: string
  destination_url: string
  safe_url: string
  is_active: boolean
  total_clicks: number
  human_clicks: number
  bot_clicks: number
  created_at: string
  bot?: { id: string; name: string } | null
}

interface CloakerClick {
  id: string
  verdict: 'human' | 'bot'
  bot_reason: string | null
  user_agent: string | null
  created_at: string
}

interface Props {
  initialCloakers: Cloaker[]
  bots: { id: string; name: string }[]
  baseUrl: string
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function pct(a: number, b: number) {
  if (!b) return '—'
  return `${Math.round((a / b) * 100)}%`
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}m atrás`
  const h = Math.floor(mins / 60)
  if (h < 24) return `${h}h atrás`
  return `${Math.floor(h / 24)}d atrás`
}

// ─── CloakerForm ──────────────────────────────────────────────────────────────

function CloakerForm({
  bots,
  initial,
  onSave,
  onCancel,
}: {
  bots: Props['bots']
  initial?: Partial<Cloaker>
  onSave: (c: Cloaker) => void
  onCancel: () => void
}) {
  const isEdit = !!initial?.id
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    bot_id: initial?.bot_id ?? '',
    destination_url: initial?.destination_url ?? '',
    safe_url: initial?.safe_url ?? '',
    slug: initial?.slug ?? '',
  })

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  // Auto-fill destination URL from selected bot
  function handleBotChange(botId: string) {
    set('bot_id', botId)
    // If destination not yet filled, suggest t.me link
    if (!form.destination_url && botId) {
      const bot = bots.find(b => b.id === botId)
      if (bot) set('destination_url', `https://t.me/${bot.name.replace(/\s/g, '_').toLowerCase()}bot`)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const url = isEdit ? `/api/cloakers/${initial!.id}` : '/api/cloakers'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          bot_id: form.bot_id || null,
          slug: form.slug || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Erro ao salvar'); return }
      toast.success(isEdit ? 'Cloaker atualizado!' : 'Cloaker criado!')
      onSave(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="rounded-2xl p-5 space-y-4"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)' }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">
          {isEdit ? 'Editar cloaker' : 'Novo cloaker'}
        </h3>
        <button onClick={onCancel} className="text-slate-500 hover:text-slate-300 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Name */}
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Nome do cloaker</Label>
            <Input placeholder="Ex: Tráfego Meta — Modelo X" value={form.name} onChange={e => set('name', e.target.value)} required />
          </div>

          {/* Bot */}
          <div className="space-y-1.5">
            <Label>Bot vinculado <span className="text-slate-600">(opcional)</span></Label>
            <select
              value={form.bot_id}
              onChange={e => handleBotChange(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <option value="">— Nenhum —</option>
              {bots.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <Label>Slug personalizado <span className="text-slate-600">(opcional)</span></Label>
            <Input
              placeholder="ex: promo-vip (gerado automaticamente)"
              value={form.slug}
              onChange={e => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            />
          </div>

          {/* Destination URL */}
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block" />
              URL de destino — onde usuários reais vão
            </Label>
            <Input
              placeholder="https://t.me/seubot"
              value={form.destination_url}
              onChange={e => set('destination_url', e.target.value)}
              required
            />
            <p className="text-[11px] text-slate-600">Link do seu bot no Telegram ou qualquer URL real</p>
          </div>

          {/* Safe URL */}
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-400 inline-block" />
              URL segura — onde bots e revisores vão
            </Label>
            <Input
              placeholder="https://seusite.com/politica-de-privacidade"
              value={form.safe_url}
              onChange={e => set('safe_url', e.target.value)}
              required
            />
            <p className="text-[11px] text-slate-600">Página simples e sem infrações — blog, termos, landing page limpa</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancelar</Button>
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar cloaker'}
          </Button>
        </div>
      </form>
    </div>
  )
}

// ─── ClickLog ─────────────────────────────────────────────────────────────────

function ClickLog({ cloakerId }: { cloakerId: string }) {
  const [clicks, setClicks] = useState<CloakerClick[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [show, setShow] = useState(false)

  async function load() {
    if (clicks) { setShow(s => !s); return }
    setLoading(true)
    setShow(true)
    try {
      const res = await fetch(`/api/cloakers/${cloakerId}?limit=30`)
      if (res.ok) setClicks(await res.json())
    } finally { setLoading(false) }
  }

  return (
    <div>
      <button
        onClick={load}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
      >
        <Clock className="h-3 w-3" />
        {show ? 'Ocultar log' : 'Ver log de cliques'}
        {show ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {show && (
        <div className="mt-3 space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
          {loading && <p className="text-xs text-slate-500 py-3 text-center">Carregando...</p>}
          {clicks?.length === 0 && <p className="text-xs text-slate-600 py-3 text-center">Nenhum clique ainda</p>}
          {clicks?.map(c => (
            <div
              key={c.id}
              className="flex items-start justify-between gap-3 rounded-lg px-3 py-2"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <div className="flex items-center gap-2 min-w-0">
                {c.verdict === 'bot' ? (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full flex-shrink-0" style={{ background: 'rgba(239,68,68,0.15)' }}>
                    <Bot className="h-3 w-3 text-red-400" />
                  </div>
                ) : (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full flex-shrink-0" style={{ background: 'rgba(52,211,153,0.15)' }}>
                    <Users className="h-3 w-3 text-emerald-400" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className={`text-xs font-medium ${c.verdict === 'bot' ? 'text-red-400' : 'text-emerald-400'}`}>
                    {c.verdict === 'bot' ? `Bot bloqueado${c.bot_reason ? ` · ${c.bot_reason}` : ''}` : 'Usuário real → Telegram'}
                  </p>
                  {c.user_agent && (
                    <p className="text-[10px] text-slate-600 truncate max-w-[280px]">{c.user_agent}</p>
                  )}
                </div>
              </div>
              <span className="text-[10px] text-slate-600 flex-shrink-0 mt-0.5">{timeAgo(c.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── CloakerCard ──────────────────────────────────────────────────────────────

function CloakerCard({
  cloaker,
  baseUrl,
  onUpdate,
  onDelete,
}: {
  cloaker: Cloaker
  baseUrl: string
  onUpdate: (c: Cloaker) => void
  onDelete: (id: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [copied, setCopied] = useState(false)

  const cloakUrl = `${baseUrl}/c/${cloaker.slug}`

  function copy() {
    navigator.clipboard.writeText(cloakUrl)
    setCopied(true)
    toast.success('Link copiado!')
    setTimeout(() => setCopied(false), 2000)
  }

  async function toggleActive() {
    setToggling(true)
    try {
      const res = await fetch(`/api/cloakers/${cloaker.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !cloaker.is_active }),
      })
      const data = await res.json()
      if (res.ok) onUpdate(data)
    } finally { setToggling(false) }
  }

  async function handleDelete() {
    if (!confirm(`Excluir cloaker "${cloaker.name}"?`)) return
    const res = await fetch(`/api/cloakers/${cloaker.id}`, { method: 'DELETE' })
    if (res.ok) { onDelete(cloaker.id); toast.success('Cloaker excluído') }
  }

  if (editing) {
    return (
      <CloakerForm
        bots={[]}
        initial={cloaker}
        onSave={c => { onUpdate(c); setEditing(false) }}
        onCancel={() => setEditing(false)}
      />
    )
  }

  const convRate = pct(cloaker.human_clicks, cloaker.total_clicks)
  const botRate = pct(cloaker.bot_clicks, cloaker.total_clicks)

  return (
    <div
      className="rounded-2xl p-5 space-y-4 transition-all duration-200"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: cloaker.is_active
          ? '1px solid rgba(59,130,246,0.15)'
          : '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0 mt-0.5"
            style={{
              background: cloaker.is_active ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${cloaker.is_active ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.08)'}`,
            }}
          >
            <Shield className={`h-4 w-4 ${cloaker.is_active ? 'text-blue-400' : 'text-slate-600'}`} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-slate-200">{cloaker.name}</p>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={cloaker.is_active
                  ? { background: 'rgba(52,211,153,0.12)', color: '#34d399' }
                  : { background: 'rgba(255,255,255,0.05)', color: '#64748b' }
                }
              >
                {cloaker.is_active ? 'Ativo' : 'Inativo'}
              </span>
              {cloaker.bot && (
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa' }}
                >
                  {cloaker.bot.name}
                </span>
              )}
            </div>
            {/* Cloak URL */}
            <div className="flex items-center gap-1.5 mt-1">
              <LinkIcon className="h-3 w-3 text-slate-600 flex-shrink-0" />
              <span className="text-xs text-slate-500 font-mono truncate max-w-[260px]">{cloakUrl}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={copy}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-200 transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)' }}
            title="Copiar link"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={toggleActive}
            disabled={toggling}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-200 transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)' }}
            title={cloaker.is_active ? 'Desativar' : 'Ativar'}
          >
            {cloaker.is_active
              ? <ToggleRight className="h-4 w-4 text-emerald-400" />
              : <ToggleLeft className="h-4 w-4" />
            }
          </button>
          <button
            onClick={() => setEditing(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-200 transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)' }}
            title="Editar"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleDelete}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-red-400 transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)' }}
            title="Excluir"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: MousePointerClick, label: 'Total', value: cloaker.total_clicks, color: 'text-slate-300', bg: 'rgba(255,255,255,0.04)' },
          { icon: Users, label: 'Reais', value: `${cloaker.human_clicks} (${convRate})`, color: 'text-emerald-400', bg: 'rgba(52,211,153,0.07)' },
          { icon: Bot, label: 'Bloqueados', value: `${cloaker.bot_clicks} (${botRate})`, color: 'text-red-400', bg: 'rgba(239,68,68,0.07)' },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="rounded-xl px-3 py-2.5 text-center" style={{ background: bg, border: '1px solid rgba(255,255,255,0.05)' }}>
            <Icon className={`h-3.5 w-3.5 mx-auto mb-1 ${color}`} />
            <p className={`text-sm font-bold ${color}`}>{value}</p>
            <p className="text-[10px] text-slate-600">{label}</p>
          </div>
        ))}
      </div>

      {/* URLs preview */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {[
          { label: 'Destino (usuários)', url: cloaker.destination_url, dot: 'bg-emerald-400' },
          { label: 'Segura (revisores)', url: cloaker.safe_url, dot: 'bg-blue-400' },
        ].map(({ label, url, dot }) => (
          <div key={label} className="rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
              <p className="text-[10px] text-slate-600 font-medium">{label}</p>
            </div>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 truncate"
            >
              <span className="truncate">{url}</span>
              <ExternalLink className="h-2.5 w-2.5 flex-shrink-0" />
            </a>
          </div>
        ))}
      </div>

      {/* Click log */}
      <ClickLog cloakerId={cloaker.id} />
    </div>
  )
}

// ─── CloakerClient ────────────────────────────────────────────────────────────

export function CloakerClient({ initialCloakers, bots, baseUrl }: Props) {
  const [cloakers, setCloakers] = useState<Cloaker[]>(initialCloakers)
  const [creating, setCreating] = useState(false)

  const handleCreate = useCallback((c: Cloaker) => {
    setCloakers(prev => [c, ...prev])
    setCreating(false)
  }, [])

  const handleUpdate = useCallback((c: Cloaker) => {
    setCloakers(prev => prev.map(x => x.id === c.id ? c : x))
  }, [])

  const handleDelete = useCallback((id: string) => {
    setCloakers(prev => prev.filter(x => x.id !== id))
  }, [])

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-400" />
            Cloaker
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Mascare seus links de anúncio. Usuários reais vão para o Telegram — revisores de ads vão para a página segura.
          </p>
        </div>
        <Button onClick={() => setCreating(true)} className="gap-2" disabled={creating}>
          <Plus className="h-4 w-4" />
          Novo cloaker
        </Button>
      </div>

      {/* Info banner */}
      <div
        className="flex items-start gap-3 rounded-xl p-4"
        style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.15)' }}
      >
        <AlertCircle className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-400 space-y-1">
          <p><strong className="text-slate-300">Como usar:</strong> coloque o link do cloaker no campo de URL do seu anúncio (Meta, TikTok, etc.).</p>
          <p>
            <strong className="text-slate-300">Detecção em 2 camadas:</strong>{' '}
            (1) User-Agent — bloqueia crawlers conhecidos do Meta, TikTok, Google e ferramentas de análise no servidor.{' '}
            (2) Fingerprinting JS — detecta headless browsers, Selenium e bots com JS habilitado no lado do cliente.
          </p>
          <p><strong className="text-slate-300">URL segura:</strong> deve ser uma página simples, sem menção ao produto real — uma landing page de termos, blog post ou site institucional.</p>
        </div>
      </div>

      {/* Create form */}
      {creating && (
        <CloakerForm
          bots={bots}
          onSave={handleCreate}
          onCancel={() => setCreating(false)}
        />
      )}

      {/* List */}
      {cloakers.length === 0 && !creating ? (
        <div
          className="flex flex-col items-center justify-center rounded-2xl py-16 text-center"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}
        >
          <Shield className="h-10 w-10 text-slate-700 mb-3" />
          <p className="text-slate-400 font-medium">Nenhum cloaker criado</p>
          <p className="text-sm text-slate-600 mt-1">Crie um para proteger seus anúncios</p>
          <Button className="mt-5 gap-2" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            Criar primeiro cloaker
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {cloakers.map(c => (
            <CloakerCard
              key={c.id}
              cloaker={c}
              baseUrl={baseUrl}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
