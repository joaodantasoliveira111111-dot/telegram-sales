'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Save, Loader2, Eye, EyeOff, ExternalLink, Send } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  initial: Record<string, string>
}

function SecretInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-zinc-700/60 bg-zinc-800/60 px-4 py-2.5 pr-11 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-all focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-zinc-700/60 bg-zinc-800/60 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-all focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10"
    />
  )
}

function FieldRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 sm:grid-cols-[200px_1fr] sm:items-start sm:gap-6">
      <div className="pt-0.5">
        <p className="text-sm font-medium text-zinc-200">{label}</p>
        {description && <p className="mt-0.5 text-xs text-zinc-500">{description}</p>}
      </div>
      <div>{children}</div>
    </div>
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <div
        onClick={() => onChange(!checked)}
        className={[
          'relative h-5 w-9 rounded-full transition-colors',
          checked ? 'bg-blue-600' : 'bg-zinc-700',
        ].join(' ')}
      >
        <div className={[
          'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-4' : 'translate-x-0.5',
        ].join(' ')} />
      </div>
      <span className="text-sm text-zinc-300">{label}</span>
    </label>
  )
}

export function SettingsForm({ initial }: Props) {
  const [tab, setTab] = useState<'gateway' | 'pixel'>('gateway')
  const [values, setValues] = useState<Record<string, string>>(initial)
  const [saving, setSaving] = useState<string | null>(null)
  const [testingEvent, setTestingEvent] = useState<string | null>(null)

  function set(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  function bool(key: string) {
    return values[key] !== 'false'
  }

  function setBool(key: string, value: boolean) {
    set(key, value ? 'true' : 'false')
  }

  async function saveSection(keys: string[]) {
    const section = Object.fromEntries(keys.map((k) => [k, values[k] ?? '']))
    setSaving(keys[0])
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(section),
      })
      if (!res.ok) { toast.error('Erro ao salvar'); return }
      toast.success('Configurações salvas!')
    } finally {
      setSaving(null)
    }
  }

  const amplopayKeys = ['amplopay_public_key', 'amplopay_secret_key', 'amplopay_webhook_token']
  const pushinpayKeys = ['pushinpay_token']
  const metaKeys = ['meta_pixel_id', 'meta_access_token', 'meta_test_event_code', 'meta_track_lead', 'meta_track_purchase', 'meta_track_initiate_checkout', 'meta_track_view_content']

  const activeGateway = values.active_gateway || 'amplopay'

  return (
    <div className="space-y-6">

      {/* Tab selector */}
      <div
        className="flex gap-1 rounded-xl p-1 w-fit"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {([
          { key: 'gateway', label: 'Gateway de Pagamento' },
          { key: 'pixel',   label: 'Pixel & Marketing' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className="rounded-lg px-4 py-2 text-sm font-semibold transition-all"
            style={tab === key
              ? { background: 'rgba(139,92,246,0.25)', color: '#c4b5fd', boxShadow: '0 0 12px rgba(139,92,246,0.15)' }
              : { color: '#71717a' }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* Gateways de Pagamento — unified card */}
      {tab === 'gateway' && (<>
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold text-zinc-100">Gateways de Pagamento</CardTitle>
          <p className="mt-1 text-xs text-zinc-500">Clique em um gateway para ativá-lo e configurar as credenciais. A troca é salva automaticamente.</p>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Gateway selector buttons */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {([
              { id: 'amplopay',  label: 'AmploPay',  desc: 'Public Key + Secret Key', href: 'https://app.amplopay.com' },
              { id: 'pushinpay', label: 'PushinPay', desc: 'Bearer Token único',       href: 'https://app.pushinpay.com.br' },
            ] as const).map(({ id, label, desc, href }) => {
              const active = activeGateway === id
              const isSaving = saving === 'active_gateway'
              return (
                <button
                  key={id}
                  type="button"
                  disabled={isSaving}
                  onClick={async () => {
                    if (active) return
                    set('active_gateway', id)
                    setSaving('active_gateway')
                    try {
                      const res = await fetch('/api/settings', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ active_gateway: id }),
                      })
                      if (!res.ok) { toast.error('Erro ao salvar'); return }
                      toast.success(`${label} ativado!`)
                    } finally {
                      setSaving(null)
                    }
                  }}
                  className="relative flex items-center gap-4 rounded-xl border p-4 text-left transition-all disabled:cursor-wait"
                  style={active
                    ? { background: 'rgba(139,92,246,0.12)', borderColor: 'rgba(139,92,246,0.4)', boxShadow: '0 0 20px rgba(139,92,246,0.1)' }
                    : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }
                  }
                >
                  {isSaving && active && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl" style={{ background: 'rgba(0,0,0,0.3)' }}>
                      <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
                    </div>
                  )}
                  <div className="relative flex-shrink-0">
                    <div className={[
                      'flex h-5 w-5 rounded-full border-2 items-center justify-center transition-all',
                      active ? 'border-violet-500 bg-violet-500/20' : 'border-zinc-600',
                    ].join(' ')}>
                      {active && <div className="h-2 w-2 rounded-full bg-violet-400" />}
                    </div>
                    {active && (
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-50" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-violet-500" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={['text-sm font-semibold', active ? 'text-violet-300' : 'text-zinc-300'].join(' ')}>{label}</p>
                      {active && (
                        <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                          style={{ background: 'rgba(139,92,246,0.25)', color: '#c4b5fd' }}>ATIVO</span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500">{desc}</p>
                  </div>
                  <a href={href} target="_blank" rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="ml-auto flex items-center gap-0.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors shrink-0">
                    Painel <ExternalLink className="h-3 w-3" />
                  </a>
                </button>
              )
            })}
          </div>

          {/* Credentials accordion — shows only active gateway */}
          <div className="border-t border-zinc-800 pt-5 space-y-5">
            {activeGateway === 'amplopay' ? (
              <>
                <FieldRow label="Public Key" description="Chave pública da API">
                  <SecretInput value={values.amplopay_public_key ?? ''} onChange={(v) => set('amplopay_public_key', v)} placeholder="pk_..." />
                </FieldRow>
                <FieldRow label="Secret Key" description="Chave secreta da API">
                  <SecretInput value={values.amplopay_secret_key ?? ''} onChange={(v) => set('amplopay_secret_key', v)} placeholder="sk_..." />
                </FieldRow>
                <FieldRow label="Webhook Token" description="Token para validar notificações do gateway">
                  <SecretInput value={values.amplopay_webhook_token ?? ''} onChange={(v) => set('amplopay_webhook_token', v)} placeholder="Token secreto do webhook" />
                </FieldRow>
                <FieldRow label="Webhook URL" description="Configure este endereço no painel da AmploPay">
                  <div className="rounded-xl border border-zinc-700/60 bg-zinc-900/60 px-4 py-2.5">
                    <code className="text-xs text-zinc-400">/api/amplopay/webhook</code>
                  </div>
                </FieldRow>
              </>
            ) : (
              <>
                <FieldRow label="Bearer Token" description="Token de acesso gerado no painel PushinPay">
                  <SecretInput value={values.pushinpay_token ?? ''} onChange={(v) => set('pushinpay_token', v)} placeholder="Seu token de acesso..." />
                </FieldRow>
                <FieldRow label="Webhook URL" description="Configure este endereço no painel da PushinPay (campo webhook_url ao criar PIX)">
                  <div className="rounded-xl border border-zinc-700/60 bg-zinc-900/60 px-4 py-2.5">
                    <code className="text-xs text-zinc-400">/api/pushinpay/webhook</code>
                  </div>
                </FieldRow>
              </>
            )}

            <div className="flex justify-end border-t border-zinc-800 pt-4">
              <button
                onClick={() => saveSection(activeGateway === 'amplopay' ? amplopayKeys : pushinpayKeys)}
                disabled={saving === (activeGateway === 'amplopay' ? 'amplopay_public_key' : 'pushinpay_token')}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-500 disabled:opacity-60"
              >
                {saving === (activeGateway === 'amplopay' ? 'amplopay_public_key' : 'pushinpay_token')
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Save className="h-3.5 w-3.5" />
                }
                Salvar credenciais
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
      </>)}

      {/* Meta Pixel */}
      {tab === 'pixel' && (<Card>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base font-semibold text-zinc-100">Meta Ads — Pixel & CAPI</CardTitle>
              <p className="mt-1 text-xs text-zinc-500">Rastreamento de eventos via Conversions API (server-side)</p>
            </div>
            <a
              href="https://business.facebook.com/events_manager"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Events Manager <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <FieldRow label="Pixel ID" description="ID do seu pixel no Meta">
            <TextInput value={values.meta_pixel_id ?? ''} onChange={(v) => set('meta_pixel_id', v)} placeholder="123456789012345" />
          </FieldRow>
          <FieldRow label="Access Token" description="Token de acesso gerado no Events Manager">
            <SecretInput value={values.meta_access_token ?? ''} onChange={(v) => set('meta_access_token', v)} placeholder="EAAxxxxxxx..." />
          </FieldRow>
          <FieldRow label="Test Event Code" description="Código de teste (opcional, para validar no Events Manager)">
            <TextInput value={values.meta_test_event_code ?? ''} onChange={(v) => set('meta_test_event_code', v)} placeholder="TEST12345" />
          </FieldRow>

          <div className="border-t border-zinc-800 pt-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Eventos rastreados</p>
            <div className="space-y-3">
              <Toggle
                checked={bool('meta_track_lead')}
                onChange={(v) => setBool('meta_track_lead', v)}
                label="Lead — dispara quando usuário inicia o bot (/start)"
              />
              <Toggle
                checked={bool('meta_track_purchase')}
                onChange={(v) => setBool('meta_track_purchase', v)}
                label="Purchase — dispara quando pagamento é confirmado"
              />
              <Toggle
                checked={bool('meta_track_initiate_checkout')}
                onChange={(v) => setBool('meta_track_initiate_checkout', v)}
                label="InitiateCheckout — dispara quando usuário clica em comprar"
              />
              <Toggle
                checked={bool('meta_track_view_content')}
                onChange={(v) => setBool('meta_track_view_content', v)}
                label="ViewContent — dispara quando usuário inicia o bot"
              />
            </div>
          </div>

          <div className="flex justify-end border-t border-zinc-800 pt-4">
            <button
              onClick={() => saveSection(metaKeys)}
              disabled={saving === 'meta_pixel_id'}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-500 disabled:opacity-60"
            >
              {saving === 'meta_pixel_id' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Salvar Marketing
            </button>
          </div>

          {/* Test events section */}
          <div className="border-t border-zinc-800 pt-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Testar Eventos</p>
            <div className="flex flex-wrap gap-2">
              {(['Lead', 'ViewContent', 'InitiateCheckout', 'Purchase'] as const).map((eventName) => (
                <button
                  key={eventName}
                  type="button"
                  disabled={testingEvent !== null}
                  onClick={async () => {
                    setTestingEvent(eventName)
                    try {
                      const res = await fetch('/api/meta/test-event', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ event_name: eventName }),
                      })
                      const data = await res.json()
                      if (!res.ok) { toast.error(data.error ?? `Erro ao enviar evento ${eventName}`); return }
                      toast.success(`Evento '${eventName}' enviado! Verifique no Events Manager.`)
                    } catch {
                      toast.error(`Erro ao enviar evento ${eventName}`)
                    } finally {
                      setTestingEvent(null)
                    }
                  }}
                  className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 hover:text-white"
                  style={{ borderColor: 'rgba(63,63,70,1)', color: '#a1a1aa' }}
                >
                  {testingEvent === eventName
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <Send className="h-3 w-3" />
                  }
                  {eventName}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>)}

    </div>
  )
}
