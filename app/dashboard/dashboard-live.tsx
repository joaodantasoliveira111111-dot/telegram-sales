'use client'

import { useState, useEffect, useRef } from 'react'
import { Users, CreditCard, CheckCircle2, Shield, Clock, RefreshCw } from 'lucide-react'

interface LiveEvent {
  id: string
  type: 'lead' | 'pix' | 'sale' | 'cloaker'
  label: string
  sub: string
  verdict?: string
  created_at: string
}

const EVENT_CFG = {
  lead:    { rgb: '96,165,250',  label: 'Lead',   Icon: Users },
  pix:     { rgb: '251,191,36',  label: 'PIX',    Icon: CreditCard },
  sale:    { rgb: '52,211,153',  label: 'Venda',  Icon: CheckCircle2 },
  cloaker: { rgb: '167,139,250', label: 'Cloaker',Icon: Shield },
} as const

const TABS = [
  { key: 'all'     as const, label: 'Todos' },
  { key: 'lead'    as const, label: 'Leads' },
  { key: 'pix'     as const, label: 'PIX' },
  { key: 'sale'    as const, label: 'Vendas' },
  { key: 'cloaker' as const, label: 'Cloaker' },
]

function relTime(ts: string) {
  const d = Date.now() - new Date(ts).getTime()
  if (d < 60000)      return `${Math.floor(d / 1000)}s`
  if (d < 3600000)    return `${Math.floor(d / 60000)}m`
  if (d < 86400000)   return `${Math.floor(d / 3600000)}h`
  return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export function LiveFeedWidget() {
  const [events, setEvents]     = useState<LiveEvent[]>([])
  const [tab, setTab]           = useState<'all' | 'lead' | 'pix' | 'sale' | 'cloaker'>('all')
  const [newCount, setNewCount] = useState(0)
  const [loading, setLoading]   = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const knownIds = useRef(new Set<string>())

  async function fetchEvents(silent = false) {
    try {
      const res = await fetch('/api/dashboard/live-feed')
      if (!res.ok) return
      const { events: fresh } = await res.json() as { events: LiveEvent[] }
      const newOnes = fresh.filter(e => !knownIds.current.has(e.id))
      if (newOnes.length > 0 && knownIds.current.size > 0) {
        setNewCount(n => n + newOnes.length)
      }
      fresh.forEach(e => knownIds.current.add(e.id))
      setEvents(fresh)
      setLastUpdate(new Date())
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
    const iv = setInterval(() => fetchEvents(true), 5000)
    return () => clearInterval(iv)
  }, []) // eslint-disable-line

  const filtered = tab === 'all' ? events : events.filter(e => e.type === tab)

  return (
    <div className="flex flex-col h-full rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
          </span>
          <p className="text-[12px] font-bold text-zinc-200">Feed em Tempo Real</p>
          {newCount > 0 && (
            <button onClick={() => setNewCount(0)}
              className="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white"
              style={{ background: 'rgba(96,165,250,0.75)' }}>
              +{newCount}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {lastUpdate && (
            <span className="text-[10px] text-zinc-700">
              {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          <Clock className="h-3 w-3 text-zinc-700" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-3 pt-3 pb-2 overflow-x-auto shrink-0"
        style={{ scrollbarWidth: 'none' }}>
        {TABS.map(t => (
          <button key={t.key}
            onClick={() => { setTab(t.key); if (t.key === 'all') setNewCount(0) }}
            className="shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all"
            style={tab === t.key
              ? { background: 'rgba(96,165,250,0.15)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.3)' }
              : { background: 'rgba(255,255,255,0.03)', color: '#52525b', border: '1px solid rgba(255,255,255,0.06)' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Events */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5 min-h-0"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}>
        {loading && (
          <div className="flex items-center justify-center py-10">
            <RefreshCw className="h-4 w-4 animate-spin text-zinc-600" />
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <p className="text-[11px] text-zinc-600">Nenhum evento nas últimas 6 horas</p>
          </div>
        )}
        {filtered.map(ev => {
          const isBotCloak = ev.type === 'cloaker' && ev.verdict === 's'
          const cfg = EVENT_CFG[ev.type]
          const rgb = isBotCloak ? '239,68,68' : cfg.rgb
          const { Icon } = cfg
          return (
            <div key={ev.id}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
              style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid rgba(${rgb},0.12)` }}>
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
                style={{ background: `rgba(${rgb},0.12)` }}>
                <Icon className="h-3 w-3" style={{ color: `rgb(${rgb})` }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{ background: `rgba(${rgb},0.12)`, color: `rgb(${rgb})` }}>
                    {cfg.label}
                  </span>
                  <p className="text-[11px] font-semibold text-zinc-300 truncate">{ev.label}</p>
                </div>
                <p className="text-[10px] text-zinc-600 truncate mt-0.5">{ev.sub}</p>
              </div>
              <span className="shrink-0 text-[10px] text-zinc-700 font-mono">{relTime(ev.created_at)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
