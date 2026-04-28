'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, Loader2, ToggleLeft, ToggleRight, Clock, RefreshCw, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'

interface Step { delay_hours: number; message_text: string }
interface Sequence {
  id: string; name: string; trigger: string; is_active: boolean
  bot_id: string; created_at: string
  steps: Step[]
}

const TRIGGER_LABELS: Record<string, string> = {
  no_payment: 'Lead não pagou após X horas',
  no_interaction: 'Lead parou de interagir após X horas',
}

const glass = {
  card: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' } as React.CSSProperties,
  input: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' } as React.CSSProperties,
}

interface Props { bots: { id: string; name: string }[] }

export function RemarketingClient({ bots }: Props) {
  const [sequences, setSequences] = useState<Sequence[]>([])
  const [loading, setLoading] = useState(false)
  const [botFilter, setBotFilter] = useState(bots[0]?.id ?? '')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [trigger, setTrigger] = useState<'no_payment' | 'no_interaction'>('no_payment')
  const [steps, setSteps] = useState<Step[]>([{ delay_hours: 1, message_text: '' }, { delay_hours: 24, message_text: '' }])
  const [saving, setSaving] = useState(false)

  async function load() {
    if (!botFilter) return
    setLoading(true)
    try {
      const res = await fetch(`/api/remarketing?bot_id=${botFilter}`)
      const data = await res.json()
      setSequences(Array.isArray(data) ? data : [])
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [botFilter])

  function addStep() { setSteps(s => [...s, { delay_hours: (s[s.length - 1]?.delay_hours ?? 0) * 2 || 48, message_text: '' }]) }
  function removeStep(i: number) { setSteps(s => s.filter((_, j) => j !== i)) }
  function updateStep(i: number, field: keyof Step, value: string | number) {
    setSteps(s => s.map((st, j) => j === i ? { ...st, [field]: value } : st))
  }

  async function handleSave() {
    if (!name.trim()) { toast.error('Digite um nome para a sequência'); return }
    if (steps.some(s => !s.message_text.trim())) { toast.error('Preencha todas as mensagens'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/remarketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bot_id: botFilter, name, trigger, steps }),
      })
      if (!res.ok) { toast.error('Erro ao salvar'); return }
      toast.success('Sequência criada!')
      setShowForm(false)
      setName(''); setTrigger('no_payment')
      setSteps([{ delay_hours: 1, message_text: '' }, { delay_hours: 24, message_text: '' }])
      load()
    } finally { setSaving(false) }
  }

  async function toggleActive(seq: Sequence) {
    await fetch(`/api/remarketing/${seq.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !seq.is_active }),
    })
    setSequences(s => s.map(q => q.id === seq.id ? { ...q, is_active: !q.is_active } : q))
  }

  async function deleteSeq(id: string) {
    if (!confirm('Remover esta sequência de remarketing?')) return
    await fetch(`/api/remarketing/${id}`, { method: 'DELETE' })
    setSequences(s => s.filter(q => q.id !== id))
    toast.success('Removido')
  }

  return (
    <div className="space-y-5">
      {/* Notice */}
      <div className="flex items-start gap-3 rounded-2xl p-4" style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.18)' }}>
        <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-xs font-semibold text-amber-300">Envio automático requer Vercel Pro</p>
          <p className="text-xs text-zinc-500 mt-0.5">As sequências ficam salvas e prontas. O disparo automático via cron (<code className="text-amber-400/80">/api/cron/send-remarketing</code>) é ativado ao fazer upgrade do plano Vercel para Pro — basta adicionar o cron ao <code className="text-amber-400/80">vercel.json</code>.</p>
        </div>
      </div>

      {/* Bot selector + New button */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <select
          value={botFilter}
          onChange={e => setBotFilter(e.target.value)}
          className="rounded-xl px-3 py-2 text-sm text-zinc-300 outline-none"
          style={glass.input}>
          {bots.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all"
          style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#c4b5fd' }}>
          <Plus className="h-3.5 w-3.5" /> Nova sequência
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-2xl p-5 space-y-4" style={glass.card}>
          <p className="text-sm font-semibold text-zinc-100">Nova sequência de remarketing</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-zinc-500 mb-1">Nome</p>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Recuperação 24h"
                className="w-full rounded-xl px-3 py-2 text-sm text-zinc-200 outline-none" style={glass.input} />
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-1">Gatilho</p>
              <select value={trigger} onChange={e => setTrigger(e.target.value as typeof trigger)}
                className="w-full rounded-xl px-3 py-2 text-sm text-zinc-200 outline-none" style={glass.input}>
                <option value="no_payment">Lead não pagou</option>
                <option value="no_interaction">Lead parou de interagir</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-zinc-500">Mensagens da sequência</p>
            {steps.map((step, i) => (
              <div key={i} className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-violet-400" />
                    <span className="text-xs text-zinc-400">Enviar após</span>
                    <input
                      type="number" min={1} value={step.delay_hours}
                      onChange={e => updateStep(i, 'delay_hours', parseInt(e.target.value) || 1)}
                      className="w-16 rounded-lg px-2 py-1 text-xs text-zinc-200 text-center outline-none"
                      style={glass.input} />
                    <span className="text-xs text-zinc-400">horas</span>
                  </div>
                  {steps.length > 1 && (
                    <button onClick={() => removeStep(i)} className="text-zinc-600 hover:text-red-400 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <textarea
                  value={step.message_text}
                  onChange={e => updateStep(i, 'message_text', e.target.value)}
                  placeholder={`Mensagem ${i + 1} — suporta HTML: <b>negrito</b>, <i>itálico</i>`}
                  rows={3}
                  className="w-full rounded-xl px-3 py-2 text-xs text-zinc-300 outline-none resize-none"
                  style={glass.input} />
              </div>
            ))}
            <button onClick={addStep} className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors">
              <Plus className="h-3.5 w-3.5" /> Adicionar mensagem
            </button>
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="text-xs px-4 py-2 rounded-xl text-zinc-500 hover:text-zinc-300 transition-colors">Cancelar</button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 text-xs px-4 py-2 rounded-xl font-semibold transition-all disabled:opacity-60"
              style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)', color: '#c4b5fd' }}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Salvar sequência
            </button>
          </div>
        </div>
      )}

      {/* Sequences list */}
      {loading && <div className="flex items-center gap-2 text-sm text-zinc-500"><RefreshCw className="h-4 w-4 animate-spin" /> Carregando...</div>}
      {!loading && sequences.length === 0 && (
        <div className="rounded-2xl py-12 text-center" style={glass.card}>
          <p className="text-sm text-zinc-600">Nenhuma sequência criada ainda.</p>
          <p className="text-xs text-zinc-700 mt-1">Crie sua primeira sequência para recuperar leads que não converteram.</p>
        </div>
      )}
      {sequences.map(seq => (
        <div key={seq.id} className="rounded-2xl overflow-hidden" style={glass.card}>
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={() => toggleActive(seq)} className="shrink-0">
                {seq.is_active
                  ? <ToggleRight className="h-5 w-5 text-emerald-400" />
                  : <ToggleLeft className="h-5 w-5 text-zinc-600" />}
              </button>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-100 truncate">{seq.name}</p>
                <p className="text-xs text-zinc-500">{TRIGGER_LABELS[seq.trigger]} · {seq.steps?.length ?? 0} mensagens</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => setExpanded(expanded === seq.id ? null : seq.id)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                {expanded === seq.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              <button onClick={() => deleteSeq(seq.id)} className="text-zinc-600 hover:text-red-400 transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          {expanded === seq.id && (
            <div className="px-5 pb-5 space-y-3 border-t border-white/5 pt-4">
              {(seq.steps ?? []).sort((a: Step & { position?: number }, b: Step & { position?: number }) => (a.position ?? 0) - (b.position ?? 0)).map((step: Step & { delay_hours: number; message_text: string }, i: number) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full shrink-0 text-[10px] font-bold text-violet-400"
                    style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.2)' }}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] text-zinc-500 mb-0.5">
                      <Clock className="h-3 w-3 inline mr-1" />Após {step.delay_hours}h
                    </p>
                    <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">{step.message_text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
