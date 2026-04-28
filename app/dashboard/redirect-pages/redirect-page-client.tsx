'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  ExternalLink, Plus, Copy, Trash2, Pencil, X, Check,
  MousePointerClick, ToggleLeft, ToggleRight, Eye, CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// ─── Types ────────────────────────────────────────────────────────────────────

interface RedirectPage {
  id: string
  slug: string
  bot_id: string | null
  name: string
  bio: string | null
  photo_url: string | null
  button_text: string
  bot_link: string
  theme: string
  show_countdown: boolean
  countdown_minutes: number
  show_verification: boolean
  highlights: string[] | null
  is_active: boolean
  clicks: number
  created_at: string
}

interface Props {
  initialPages: RedirectPage[]
  bots: { id: string; name: string }[]
  baseUrl: string
}

// ─── Themes ───────────────────────────────────────────────────────────────────

const THEMES: Record<string, { label: string; accent: string; btnGrad: string; bg: string; glow: string; btnText?: string }> = {
  dark: { label: 'Dark', accent: '#8b5cf6', btnGrad: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', bg: 'radial-gradient(ellipse at 50% 0%,rgba(139,92,246,0.25) 0%,#06040f 60%)', glow: 'rgba(139,92,246,0.5)' },
  neon: { label: 'Neon', accent: '#00ffaa', btnGrad: 'linear-gradient(135deg,#00ffaa,#00d4ff)', bg: 'radial-gradient(ellipse at 50% 0%,rgba(0,255,170,0.2) 0%,#000 60%)', glow: 'rgba(0,255,170,0.5)', btnText: '#000' },
  pink: { label: 'Pink', accent: '#ec4899', btnGrad: 'linear-gradient(135deg,#ec4899,#be185d)', bg: 'radial-gradient(ellipse at 50% 0%,rgba(236,72,153,0.25) 0%,#1a0010 60%)', glow: 'rgba(236,72,153,0.5)' },
  warm: { label: 'Warm', accent: '#f97316', btnGrad: 'linear-gradient(135deg,#f97316,#dc2626)', bg: 'radial-gradient(ellipse at 50% 0%,rgba(249,115,22,0.2) 0%,#0f0500 60%)', glow: 'rgba(249,115,22,0.5)' },
  ocean: { label: 'Ocean', accent: '#06b6d4', btnGrad: 'linear-gradient(135deg,#06b6d4,#0284c7)', bg: 'radial-gradient(ellipse at 50% 0%,rgba(6,182,212,0.2) 0%,#000a14 60%)', glow: 'rgba(6,182,212,0.5)' },
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '')
  if (h.length === 6) {
    const r = parseInt(h.slice(0, 2), 16)
    const g = parseInt(h.slice(2, 4), 16)
    const b = parseInt(h.slice(4, 6), 16)
    return `${r},${g},${b}`
  }
  return '139,92,246'
}

// ─── Mini Preview ─────────────────────────────────────────────────────────────

function MiniPreview({ form }: { form: FormState }) {
  const theme = THEMES[form.theme] ?? THEMES.dark
  const highlights = form.highlights.filter(Boolean)

  return (
    <div
      className="rounded-2xl p-5 space-y-4 h-full min-h-[340px] flex flex-col"
      style={{ background: theme.bg, border: `1px solid rgba(${hexToRgb(theme.accent)},0.2)` }}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest text-center"
        style={{ color: theme.accent, opacity: 0.6 }}>Preview</p>

      <div className="flex flex-col items-center gap-3">
        {/* Avatar */}
        <div
          className="h-14 w-14 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
          style={{
            background: `linear-gradient(135deg,${theme.accent},rgba(${hexToRgb(theme.accent)},0.4))`,
            boxShadow: `0 0 0 2px ${theme.accent}, 0 0 12px ${theme.glow}`,
          }}
        >
          {form.name.charAt(0).toUpperCase() || '?'}
        </div>

        {/* Name */}
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-bold text-white truncate max-w-[140px]">{form.name || 'Nome'}</p>
          <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" style={{ color: theme.accent }} />
        </div>

        {/* Bio */}
        {form.bio && (
          <p className="text-[11px] text-zinc-400 text-center line-clamp-2">{form.bio}</p>
        )}
      </div>

      {/* Highlights */}
      {highlights.length > 0 && (
        <div className="space-y-1.5">
          {highlights.slice(0, 3).map((h, i) => (
            <div key={i} className="flex items-start gap-2">
              <div
                className="h-4 w-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: `rgba(${hexToRgb(theme.accent)},0.15)` }}
              >
                <Check className="h-2.5 w-2.5" style={{ color: theme.accent }} />
              </div>
              <span className="text-[11px] text-zinc-300 line-clamp-1">{h}</span>
            </div>
          ))}
        </div>
      )}

      {/* Countdown badge */}
      {form.show_countdown && (
        <div
          className="rounded-xl p-2 text-center"
          style={{ background: `rgba(${hexToRgb(theme.accent)},0.1)`, border: `1px solid rgba(${hexToRgb(theme.accent)},0.2)` }}
        >
          <p className="text-[9px] uppercase tracking-widest" style={{ color: theme.accent }}>Oferta expira em</p>
          <p className="font-mono text-sm font-bold" style={{ color: theme.accent }}>
            {String(form.countdown_minutes).padStart(2, '0')}:00
          </p>
        </div>
      )}

      {/* Button */}
      <div className="mt-auto">
        <div
          className="w-full rounded-xl py-2.5 text-center text-xs font-bold flex items-center justify-center gap-1.5"
          style={{
            background: theme.btnGrad,
            color: theme.btnText ?? '#fff',
            boxShadow: `0 4px 16px ${theme.glow}`,
          }}
        >
          {form.button_text || 'Abrir no Telegram'}
          <ExternalLink className="h-3 w-3" />
        </div>
      </div>
    </div>
  )
}

// ─── Form State ───────────────────────────────────────────────────────────────

interface FormState {
  name: string
  slug: string
  bot_id: string
  bot_link: string
  theme: string
  button_text: string
  bio: string
  highlights: string[]
  show_countdown: boolean
  countdown_minutes: number
  show_verification: boolean
  is_active: boolean
}

function defaultForm(): FormState {
  return {
    name: '',
    slug: '',
    bot_id: '',
    bot_link: '',
    theme: 'dark',
    button_text: 'Abrir no Telegram',
    bio: '',
    highlights: ['', '', ''],
    show_countdown: false,
    countdown_minutes: 15,
    show_verification: false,
    is_active: true,
  }
}

function pageToForm(p: RedirectPage): FormState {
  const h = p.highlights ?? []
  return {
    name: p.name,
    slug: p.slug,
    bot_id: p.bot_id ?? '',
    bot_link: p.bot_link,
    theme: p.theme,
    button_text: p.button_text,
    bio: p.bio ?? '',
    highlights: [h[0] ?? '', h[1] ?? '', h[2] ?? ''],
    show_countdown: p.show_countdown,
    countdown_minutes: p.countdown_minutes,
    show_verification: p.show_verification,
    is_active: p.is_active,
  }
}

// ─── Page Form ────────────────────────────────────────────────────────────────

function PageForm({
  bots,
  initial,
  onSave,
  onCancel,
}: {
  bots: Props['bots']
  initial?: RedirectPage
  onSave: (p: RedirectPage) => void
  onCancel: () => void
}) {
  const isEdit = !!initial?.id
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<FormState>(initial ? pageToForm(initial) : defaultForm())

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  function handleNameChange(name: string) {
    setForm(f => ({
      ...f,
      name,
      slug: f.slug || slugify(name),
    }))
  }

  function setHighlight(i: number, v: string) {
    setForm(f => {
      const h = [...f.highlights]
      h[i] = v
      return { ...f, highlights: h }
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...form,
        bot_id: form.bot_id || null,
        highlights: form.highlights.filter(Boolean),
      }
      const url = isEdit ? `/api/redirect-pages/${initial!.id}` : '/api/redirect-pages'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Erro ao salvar'); return }
      toast.success(isEdit ? 'Página atualizada!' : 'Página criada!')
      onSave(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form */}
      <div
        className="rounded-2xl p-5 space-y-4"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)' }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">
            {isEdit ? 'Editar página' : 'Nova página de redirect'}
          </h3>
          <button onClick={onCancel} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Name */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Nome</Label>
              <Input
                placeholder="Ex: Canal VIP"
                value={form.name}
                onChange={e => handleNameChange(e.target.value)}
                required
              />
            </div>

            {/* Slug */}
            <div className="space-y-1.5">
              <Label>Slug (URL)</Label>
              <Input
                placeholder="canal-vip"
                value={form.slug}
                onChange={e => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              />
              <p className="text-[10px] text-slate-600">Gerado automaticamente</p>
            </div>

            {/* Bot */}
            <div className="space-y-1.5">
              <Label>Bot vinculado <span className="text-slate-600">(opcional)</span></Label>
              <select
                value={form.bot_id}
                onChange={e => set('bot_id', e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <option value="">— Nenhum —</option>
                {bots.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            {/* Bot link */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Link do Telegram (t.me/...)</Label>
              <Input
                placeholder="https://t.me/seubot"
                value={form.bot_link}
                onChange={e => set('bot_link', e.target.value)}
                required
              />
            </div>

            {/* Bio */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Bio <span className="text-slate-600">(opcional)</span></Label>
              <textarea
                placeholder="Descrição do seu canal..."
                value={form.bio}
                onChange={e => set('bio', e.target.value)}
                rows={2}
                className="w-full rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none resize-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>

            {/* Button text */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Texto do botão</Label>
              <Input
                placeholder="Abrir no Telegram"
                value={form.button_text}
                onChange={e => set('button_text', e.target.value)}
              />
            </div>

            {/* Highlights */}
            <div className="space-y-2 sm:col-span-2">
              <Label>Destaques <span className="text-slate-600">(bullet points, opcional)</span></Label>
              {[0, 1, 2].map(i => (
                <Input
                  key={i}
                  placeholder={`Destaque ${i + 1}`}
                  value={form.highlights[i]}
                  onChange={e => setHighlight(i, e.target.value)}
                />
              ))}
            </div>

            {/* Theme */}
            <div className="space-y-2 sm:col-span-2">
              <Label>Tema</Label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(THEMES).map(([key, t]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => set('theme', key)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={form.theme === key
                      ? { background: t.accent, color: t.btnText ?? '#fff', boxShadow: `0 0 12px ${t.glow}` }
                      : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#64748b' }
                    }
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Countdown toggle */}
            <div className="space-y-2 sm:col-span-2">
              <div className="flex items-center justify-between">
                <Label>Contagem regressiva</Label>
                <button
                  type="button"
                  onClick={() => set('show_countdown', !form.show_countdown)}
                  className="transition-colors"
                >
                  {form.show_countdown
                    ? <ToggleRight className="h-5 w-5 text-violet-400" />
                    : <ToggleLeft className="h-5 w-5 text-slate-600" />
                  }
                </button>
              </div>
              {form.show_countdown && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={120}
                    value={form.countdown_minutes}
                    onChange={e => set('countdown_minutes', Number(e.target.value))}
                    className="w-24"
                  />
                  <span className="text-sm text-slate-500">minutos</span>
                </div>
              )}
            </div>

            {/* Verification toggle */}
            <div className="flex items-center justify-between sm:col-span-2">
              <div>
                <Label>Verificação de identidade</Label>
                <p className="text-[11px] text-slate-600 mt-0.5">Exibe um spinner antes de mostrar o botão</p>
              </div>
              <button
                type="button"
                onClick={() => set('show_verification', !form.show_verification)}
                className="transition-colors"
              >
                {form.show_verification
                  ? <ToggleRight className="h-5 w-5 text-violet-400" />
                  : <ToggleLeft className="h-5 w-5 text-slate-600" />
                }
              </button>
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between sm:col-span-2">
              <Label>Página ativa</Label>
              <button
                type="button"
                onClick={() => set('is_active', !form.is_active)}
                className="transition-colors"
              >
                {form.is_active
                  ? <ToggleRight className="h-5 w-5 text-emerald-400" />
                  : <ToggleLeft className="h-5 w-5 text-slate-600" />
                }
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancelar</Button>
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar página'}
            </Button>
          </div>
        </form>
      </div>

      {/* Live preview */}
      <div>
        <p className="text-xs text-slate-500 mb-3 font-medium">Pré-visualização</p>
        <MiniPreview form={form} />
      </div>
    </div>
  )
}

// ─── Page Card ────────────────────────────────────────────────────────────────

function PageCard({
  page,
  baseUrl,
  bots,
  onUpdate,
  onDelete,
}: {
  page: RedirectPage
  baseUrl: string
  bots: Props['bots']
  onUpdate: (p: RedirectPage) => void
  onDelete: (id: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [copied, setCopied] = useState(false)

  const pageUrl = `${baseUrl}/r/${page.slug}`
  const theme = THEMES[page.theme] ?? THEMES.dark

  function copy() {
    navigator.clipboard.writeText(pageUrl)
    setCopied(true)
    toast.success('Link copiado!')
    setTimeout(() => setCopied(false), 2000)
  }

  async function toggleActive() {
    setToggling(true)
    try {
      const res = await fetch(`/api/redirect-pages/${page.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !page.is_active }),
      })
      const data = await res.json()
      if (res.ok) onUpdate(data)
    } finally { setToggling(false) }
  }

  async function handleDelete() {
    if (!confirm(`Excluir página "${page.name}"?`)) return
    const res = await fetch(`/api/redirect-pages/${page.id}`, { method: 'DELETE' })
    if (res.ok) { onDelete(page.id); toast.success('Página excluída') }
  }

  if (editing) {
    return (
      <PageForm
        bots={bots}
        initial={page}
        onSave={p => { onUpdate(p); setEditing(false) }}
        onCancel={() => setEditing(false)}
      />
    )
  }

  return (
    <div
      className="rounded-2xl p-5 space-y-3 transition-all duration-200"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: page.is_active
          ? `1px solid rgba(${hexToRgb(theme.accent)},0.2)`
          : '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-slate-200">{page.name}</p>
            {/* Theme badge */}
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: `rgba(${hexToRgb(theme.accent)},0.15)`, color: theme.accent }}
            >
              {theme.label}
            </span>
            {/* Active badge */}
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={page.is_active
                ? { background: 'rgba(52,211,153,0.12)', color: '#34d399' }
                : { background: 'rgba(255,255,255,0.05)', color: '#64748b' }
              }
            >
              {page.is_active ? 'Ativo' : 'Inativo'}
            </span>
          </div>
          <a
            href={pageUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-slate-500 font-mono hover:text-slate-300 transition-colors mt-0.5 block truncate"
          >
            {pageUrl}
          </a>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Clicks */}
          <div
            className="flex items-center gap-1 rounded-lg px-2 py-1.5"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            <MousePointerClick className="h-3 w-3 text-slate-500" />
            <span className="text-xs text-slate-400 font-medium">{page.clicks}</span>
          </div>

          <button
            onClick={copy}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-200 transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)' }}
            title="Copiar link"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>

          <a
            href={pageUrl}
            target="_blank"
            rel="noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-200 transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)' }}
            title="Ver página"
          >
            <Eye className="h-3.5 w-3.5" />
          </a>

          <button
            onClick={toggleActive}
            disabled={toggling}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-200 transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)' }}
            title={page.is_active ? 'Desativar' : 'Ativar'}
          >
            {page.is_active
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
    </div>
  )
}

// ─── RedirectPageClient ───────────────────────────────────────────────────────

export function RedirectPageClient({ initialPages, bots, baseUrl }: Props) {
  const [pages, setPages] = useState<RedirectPage[]>(initialPages)
  const [creating, setCreating] = useState(false)

  const handleCreate = useCallback((p: RedirectPage) => {
    setPages(prev => [p, ...prev])
    setCreating(false)
  }, [])

  const handleUpdate = useCallback((p: RedirectPage) => {
    setPages(prev => prev.map(x => x.id === p.id ? p : x))
  }, [])

  const handleDelete = useCallback((id: string) => {
    setPages(prev => prev.filter(x => x.id !== id))
  }, [])

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <ExternalLink className="h-5 w-5 text-violet-400" />
            Páginas de Redirect
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Crie landing pages de bio link para seus bots e canais do Telegram.
          </p>
        </div>
        <Button onClick={() => setCreating(true)} className="gap-2" disabled={creating}>
          <Plus className="h-4 w-4" />
          Nova Página
        </Button>
      </div>

      {/* Create form */}
      {creating && (
        <PageForm
          bots={bots}
          onSave={handleCreate}
          onCancel={() => setCreating(false)}
        />
      )}

      {/* List */}
      {pages.length === 0 && !creating ? (
        <div
          className="flex flex-col items-center justify-center rounded-2xl py-16 text-center"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}
        >
          <ExternalLink className="h-10 w-10 text-slate-700 mb-3" />
          <p className="text-slate-400 font-medium">Nenhuma página criada</p>
          <p className="text-sm text-slate-600 mt-1">Crie uma para compartilhar com seu tráfego</p>
          <Button className="mt-5 gap-2" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            Criar primeira página
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {pages.map(p => (
            <PageCard
              key={p.id}
              page={p}
              baseUrl={baseUrl}
              bots={bots}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
