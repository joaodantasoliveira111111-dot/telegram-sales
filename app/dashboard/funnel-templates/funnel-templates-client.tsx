'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { LayoutTemplate, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { FunnelTemplate } from '@/lib/funnel-templates'

interface Props {
  templates: FunnelTemplate[]
  bots: { id: string; name: string }[]
}

export function FunnelTemplatesClient({ templates, bots }: Props) {
  const [selectedBot, setSelectedBot] = useState('')
  const [applying, setApplying] = useState<string | null>(null)
  const [applied, setApplied] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  async function applyTemplate(templateId: string) {
    if (!selectedBot) { toast.error('Selecione um bot primeiro'); return }
    if (!confirm('Isso vai criar planos e mensagens no bot selecionado. Continuar?')) return
    setApplying(templateId)
    try {
      const res = await fetch('/api/funnel-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bot_id: selectedBot, template_id: templateId }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success(`Template aplicado! ${data.plans_created} planos criados, ${data.messages_updated} mensagens configuradas.`)
      setApplied(templateId)
    } finally { setApplying(null) }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <LayoutTemplate className="h-5 w-5 text-orange-400" />
          Templates de Funil
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Funis completos pré-configurados. Selecione um bot, escolha o template e ative em segundos.
        </p>
      </div>

      {/* Bot selector */}
      <div className="rounded-2xl p-4 space-y-2" style={{ background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(255,255,255,0.86)' }}>
        <p className="text-xs font-semibold text-slate-400">1. Selecione o bot que receberá o template</p>
        <select value={selectedBot} onChange={e => setSelectedBot(e.target.value)}
          className="w-full rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none"
          style={{ background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(255,255,255,0.88)' }}>
          <option value="">— Selecione um bot —</option>
          {bots.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      <p className="text-xs font-semibold text-slate-400">2. Escolha o template e aplique</p>

      <div className="space-y-3">
        {templates.map(t => {
          const isExpanded = expanded === t.id
          const wasApplied = applied === t.id
          return (
            <div key={t.id} className="rounded-2xl overflow-hidden transition-all"
              style={{ background: 'rgba(255,255,255,0.68)', border: wasApplied ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(255,255,255,0.82)' }}>
              <div className="flex items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl">{t.emoji}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-200">{t.name}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24' }}>{t.niche}</span>
                      {wasApplied && <span className="flex items-center gap-1 text-[10px] text-emerald-400"><CheckCircle2 className="h-3 w-3" />Aplicado</span>}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{t.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setExpanded(isExpanded ? null : t.id)}
                    className="text-slate-500 hover:text-slate-300">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  <Button size="sm" onClick={() => applyTemplate(t.id)} disabled={applying === t.id || !selectedBot}
                    className="text-xs">
                    {applying === t.id ? 'Aplicando...' : 'Aplicar'}
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t px-4 pb-4 pt-3 space-y-3" style={{ borderColor: 'rgba(255,255,255,0.80)' }}>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 mb-2">Planos que serão criados</p>
                    <div className="space-y-1.5">
                      {t.plans.map((p, i) => (
                        <div key={i} className="flex items-center justify-between text-xs rounded-lg px-3 py-2"
                          style={{ background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(255,255,255,0.78)' }}>
                          <span className="text-slate-300">{p.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-slate-500">{p.duration_days === 36500 ? 'Vitalício' : `${p.duration_days} dias`}</span>
                            <span className="font-semibold text-emerald-400">R$ {p.price.toFixed(2).replace('.', ',')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 mb-2">Mensagens que serão configuradas</p>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.keys(t.messages).map(k => (
                        <span key={k} className="text-[10px] px-2 py-0.5 rounded-full font-mono"
                          style={{ background: 'rgba(59,130,246,0.1)', color: '#93c5fd' }}>{k}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
