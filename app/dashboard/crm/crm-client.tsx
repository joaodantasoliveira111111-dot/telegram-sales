'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { UserCheck, Search, Tag, X, AlertTriangle, TrendingUp, Clock, StickyNote } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface Lead {
  id: string
  telegram_id: string
  username: string | null
  first_name: string | null
  bot_id: string
  tags: string[]
  notes: string | null
  created_at: string
  last_seen: string | null
  ltv: number
  total_pix: number
  churn_score: 'low' | 'medium' | 'high'
  bot?: { id: string; name: string } | null
}

const TAG_PRESETS = ['VIP', 'Problemático', 'Potencial upgrade', 'Recorrente', 'Desistiu', 'Lead frio']
const CHURN_COLORS = { low: 'text-emerald-400', medium: 'text-yellow-400', high: 'text-red-400' }
const CHURN_LABELS = { low: 'Ativo', medium: 'Risco', high: 'Sumiu' }

export function CrmClient({ bots }: { bots: { id: string; name: string }[] }) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [botFilter, setBotFilter] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [selected, setSelected] = useState<Lead | null>(null)
  const [editNotes, setEditNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p) })
      if (botFilter) params.set('bot_id', botFilter)
      if (tagFilter) params.set('tag', tagFilter)
      if (search) params.set('q', search)
      const res = await fetch(`/api/crm?${params}`)
      const json = await res.json()
      setLeads(json.data ?? [])
      setTotal(json.total ?? 0)
      setPage(p)
    } finally { setLoading(false) }
  }, [botFilter, tagFilter, search])

  useEffect(() => { load(1) }, [load])

  async function saveUser(lead: Lead, patch: Partial<Lead>) {
    setSaving(true)
    try {
      const res = await fetch('/api/crm', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram_id: lead.telegram_id, bot_id: lead.bot_id, ...patch }),
      })
      if (res.ok) {
        const updated = { ...lead, ...patch }
        setLeads(ls => ls.map(l => l.id === lead.id ? updated : l))
        setSelected(updated)
        toast.success('Salvo!')
      }
    } finally { setSaving(false) }
  }

  function toggleTag(lead: Lead, tag: string) {
    const tags = lead.tags.includes(tag) ? lead.tags.filter(t => t !== tag) : [...lead.tags, tag]
    saveUser(lead, { tags })
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-teal-400" />
          CRM — Leads
        </h2>
        <p className="text-sm text-slate-500 mt-1">Perfil completo de cada lead: LTV, churn score e histórico.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <Input
            className="pl-8 text-sm"
            placeholder="Buscar por nome, @username ou ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load(1)}
          />
        </div>
        <select value={botFilter} onChange={e => setBotFilter(e.target.value)}
          className="rounded-xl px-3 py-2 text-sm text-slate-300 outline-none"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <option value="">Todos os bots</option>
          {bots.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select value={tagFilter} onChange={e => setTagFilter(e.target.value)}
          className="rounded-xl px-3 py-2 text-sm text-slate-300 outline-none"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <option value="">Todas as tags</option>
          {TAG_PRESETS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2" style={{ minHeight: 200 }}>
        {/* Lead list */}
        <div className="space-y-2">
          {loading && <p className="text-sm text-slate-500 py-4 text-center">Carregando...</p>}
          {!loading && leads.length === 0 && <p className="text-sm text-slate-600 py-8 text-center">Nenhum lead encontrado</p>}
          {leads.map(lead => (
            <button key={lead.id} onClick={() => { setSelected(lead); setEditNotes(lead.notes ?? '') }}
              className="w-full text-left rounded-xl p-3 transition-all"
              style={selected?.id === lead.id
                ? { background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)' }
                : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">
                    {lead.first_name ?? lead.username ?? lead.telegram_id}
                    {lead.username && <span className="text-slate-500 ml-1 text-xs">@{lead.username}</span>}
                  </p>
                  <p className="text-[11px] text-slate-600">{lead.bot?.name} · ID: {lead.telegram_id}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-xs font-bold text-emerald-400">R$ {lead.ltv.toFixed(2).replace('.', ',')}</span>
                  <span className={`text-[10px] font-medium ${CHURN_COLORS[lead.churn_score]}`}>{CHURN_LABELS[lead.churn_score]}</span>
                </div>
              </div>
              {lead.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {lead.tags.map(t => (
                    <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>{t}</span>
                  ))}
                </div>
              )}
            </button>
          ))}
          {total > 30 && (
            <div className="flex justify-center gap-2 pt-2">
              <button disabled={page === 1} onClick={() => load(page - 1)} className="text-xs px-3 py-1.5 rounded-lg disabled:opacity-40" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}>← Anterior</button>
              <span className="text-xs text-slate-500 py-1.5">{page} / {Math.ceil(total / 30)}</span>
              <button disabled={page >= Math.ceil(total / 30)} onClick={() => load(page + 1)} className="text-xs px-3 py-1.5 rounded-lg disabled:opacity-40" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}>Próxima →</button>
            </div>
          )}
        </div>

        {/* Lead detail */}
        {selected ? (
          <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-100">
                  {selected.first_name ?? selected.username ?? 'Sem nome'}
                </p>
                {selected.username && <p className="text-xs text-slate-500">@{selected.username}</p>}
                <p className="text-xs text-slate-600 mt-0.5">ID: {selected.telegram_id}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-600 hover:text-slate-400"><X className="h-4 w-4" /></button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: TrendingUp, label: 'LTV', value: `R$ ${selected.ltv.toFixed(2).replace('.', ',')}`, color: 'text-emerald-400' },
                { icon: Clock, label: 'PIX gerados', value: String(selected.total_pix), color: 'text-blue-400' },
                { icon: AlertTriangle, label: 'Churn', value: CHURN_LABELS[selected.churn_score], color: CHURN_COLORS[selected.churn_score] },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <Icon className={`h-3.5 w-3.5 mx-auto mb-1 ${color}`} />
                  <p className={`text-sm font-bold ${color}`}>{value}</p>
                  <p className="text-[10px] text-slate-600">{label}</p>
                </div>
              ))}
            </div>

            {/* Tags */}
            <div>
              <p className="text-[11px] font-semibold text-slate-500 mb-2 flex items-center gap-1"><Tag className="h-3 w-3" />Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {TAG_PRESETS.map(tag => {
                  const active = selected.tags.includes(tag)
                  return (
                    <button key={tag} onClick={() => toggleTag(selected, tag)}
                      className="text-[10px] px-2 py-1 rounded-lg transition-all"
                      style={active
                        ? { background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)', color: '#a78bfa' }
                        : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b' }}>
                      {tag}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Notes */}
            <div>
              <p className="text-[11px] font-semibold text-slate-500 mb-2 flex items-center gap-1"><StickyNote className="h-3 w-3" />Notas internas</p>
              <textarea
                value={editNotes}
                onChange={e => setEditNotes(e.target.value)}
                placeholder="Anotações sobre este lead..."
                rows={3}
                className="w-full rounded-xl px-3 py-2 text-xs text-slate-300 outline-none resize-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
              <button
                onClick={() => saveUser(selected, { notes: editNotes })}
                disabled={saving}
                className="mt-2 text-xs px-3 py-1.5 rounded-lg transition-all"
                style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', color: '#93c5fd' }}>
                {saving ? 'Salvando...' : 'Salvar nota'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-2xl" style={{ background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.06)' }}>
            <p className="text-sm text-slate-600">Clique em um lead para ver o perfil</p>
          </div>
        )}
      </div>
    </div>
  )
}
