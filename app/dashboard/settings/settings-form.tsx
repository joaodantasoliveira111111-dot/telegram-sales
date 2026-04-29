'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Save, Loader2, Eye, EyeOff, ExternalLink, Send, Copy } from 'lucide-react'
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

// ─── Platform Logos (inline SVG) ─────────────────────────────────────────────

function LogoMeta() {
  return (
    <svg viewBox="0 0 48 48" width="22" height="22" fill="none" aria-label="Meta Ads">
      <path
        d="M6 28.5c0 4.97 3.13 8.5 7.5 8.5 2.6 0 4.5-1.05 6.4-3.5L24 28l4.1 5.5C30 36 32 37 34.5 37 38.87 37 42 33.47 42 28.5c0-2.63-.72-5.07-2.14-7.15C38.2 19.05 35.6 17 32.5 17c-2.4 0-4.6.85-6.7 3.3L24 22.5l-1.8-2.2C20.1 17.85 17.9 17 15.5 17c-3.1 0-5.7 2.05-7.36 4.35C6.72 23.43 6 25.87 6 28.5zm3.2 0c0-2.06.55-4 1.56-5.55C11.9 21.23 13.52 20 15.5 20c1.75 0 3.2.63 4.9 2.85L24 27.3l3.6-4.45C29.3 20.63 30.75 20 32.5 20c1.98 0 3.6 1.23 4.74 2.95C38.25 24.5 38.8 26.44 38.8 28.5c0 3.62-2.03 6-4.3 6-1.45 0-2.58-.6-3.9-2.38L24 24.4l-6.6 7.72C16.08 33.9 14.95 34.5 13.5 34.5c-2.27 0-4.3-2.38-4.3-6z"
        fill="#0081FB"
      />
    </svg>
  )
}

function LogoTikTok() {
  return (
    <svg viewBox="0 0 48 48" width="22" height="22" fill="none" aria-label="TikTok Ads">
      <path d="M39.72 12.52A10.6 10.6 0 0133 10.04V22.9a12.42 12.42 0 01-12.42 12.4 12.42 12.42 0 01-12.42-12.4A12.42 12.42 0 0120.58 10.5c.68 0 1.35.06 2 .17V18.6a4.85 4.85 0 00-2-.42 4.9 4.9 0 00-4.9 4.9 4.9 4.9 0 004.9 4.9 4.9 4.9 0 004.9-4.9V4h6.74a10.62 10.62 0 007.5 8.52z" fill="#69C9D0" />
      <path d="M37.72 10.52A10.6 10.6 0 0131 8.04V20.9a12.42 12.42 0 01-12.42 12.4 12.42 12.42 0 01-12.42-12.4A12.42 12.42 0 0118.58 8.5c.68 0 1.35.06 2 .17V16.6a4.85 4.85 0 00-2-.42 4.9 4.9 0 00-4.9 4.9 4.9 4.9 0 004.9 4.9 4.9 4.9 0 004.9-4.9V2h6.74a10.62 10.62 0 007.5 8.52z" fill="#EE1D52" opacity="0.7" />
      <path d="M38.72 11.52A10.6 10.6 0 0132 9.04V21.9a12.42 12.42 0 01-12.42 12.4 12.42 12.42 0 01-12.42-12.4A12.42 12.42 0 0119.58 9.5c.68 0 1.35.06 2 .17V17.6a4.85 4.85 0 00-2-.42 4.9 4.9 0 00-4.9 4.9 4.9 4.9 0 004.9 4.9 4.9 4.9 0 004.9-4.9V3h6.74a10.62 10.62 0 007.5 8.52z" fill="#010101" />
    </svg>
  )
}

function LogoGA4() {
  return (
    <svg viewBox="0 0 48 48" width="22" height="22" fill="none" aria-label="Google Analytics 4">
      <rect x="5" y="26" width="10" height="16" rx="3" fill="#E37400" />
      <rect x="19" y="16" width="10" height="26" rx="3" fill="#E37400" />
      <rect x="33" y="6" width="10" height="36" rx="3" fill="#E37400" />
      <circle cx="38" cy="12" r="4" fill="#FBBC04" />
    </svg>
  )
}

function LogoGTM() {
  return (
    <svg viewBox="0 0 48 48" width="22" height="22" fill="none" aria-label="Google Tag Manager">
      <path d="M24 4L44 24L24 44L4 24Z" fill="#4285F4" />
      <path d="M24 4L34 24L24 44L14 24Z" fill="#4285F4" />
      <path d="M24 4L44 24L34 24Z" fill="#3367D6" />
      <path d="M19 29V20h4l-7-8-7 8h4v9h6z" fill="white" />
      <path d="M26 17h5v5h-2v-3h-3v-2z" fill="white" opacity="0.8" />
    </svg>
  )
}

function LogoKwai() {
  return (
    <svg viewBox="0 0 48 48" width="22" height="22" fill="none" aria-label="Kwai Ads">
      <rect width="48" height="48" rx="12" fill="#FF5E0A" />
      <path d="M14 12h5v10l9-10h7L24 24l12 12h-7L20 26v10h-6V12z" fill="white" />
    </svg>
  )
}

const PLATFORM_LOGOS: Record<string, React.ReactNode> = {
  meta:   <LogoMeta />,
  tiktok: <LogoTikTok />,
  ga4:    <LogoGA4 />,
  gtm:    <LogoGTM />,
  kwai:   <LogoKwai />,
}

export function SettingsForm({ initial }: Props) {
  const [tab, setTab] = useState<'gateway' | 'pixel' | 'saas'>('gateway')
  const [values, setValues] = useState<Record<string, string>>(initial)
  const [saving, setSaving] = useState<string | null>(null)
  const [testingEvent, setTestingEvent] = useState<string | null>(null)
  const [platformExpanded, setPlatformExpanded] = useState<string | null>(null)
  const [utmForm, setUtmForm] = useState({ baseUrl: '', source: '', medium: '', campaign: '', content: '', term: '' })

  const utmLink = (() => {
    if (!utmForm.baseUrl) return ''
    try {
      const url = new URL(utmForm.baseUrl)
      if (utmForm.source) url.searchParams.set('utm_source', utmForm.source)
      if (utmForm.medium) url.searchParams.set('utm_medium', utmForm.medium)
      if (utmForm.campaign) url.searchParams.set('utm_campaign', utmForm.campaign)
      if (utmForm.content) url.searchParams.set('utm_content', utmForm.content)
      if (utmForm.term) url.searchParams.set('utm_term', utmForm.term)
      return url.toString()
    } catch { return '' }
  })()

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
        style={{ background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.82)' }}
      >
        {([
          { key: 'gateway', label: 'Gateway de Pagamento' },
          { key: 'pixel',   label: 'Pixel & Marketing' },
          { key: 'saas',    label: 'Cobrança SaaS' },
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
                    : { background: 'rgba(255,255,255,0.72)', borderColor: 'rgba(255,255,255,0.84)' }
                  }
                >
                  {isSaving && active && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl" style={{ background: 'rgba(0,0,0,0.05)' }}>
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

      {tab === 'pixel' && (<>
        {/* Platform cards */}
        {(() => {
          const PLATFORMS = [
            {
              id: 'meta', name: 'Meta / Facebook',
              description: 'Facebook & Instagram Ads — Conversions API server-side',
              color: '#1877F2', configured: !!(values.meta_pixel_id),
              fields: [
                { key: 'meta_pixel_id', label: 'Pixel ID', secret: false, placeholder: '123456789012345' },
                { key: 'meta_access_token', label: 'Access Token (CAPI)', secret: true, placeholder: 'EAAxxxxxxx...' },
                { key: 'meta_test_event_code', label: 'Test Event Code', secret: false, placeholder: 'TEST12345 (opcional)' },
              ],
              saveKeys: ['meta_pixel_id', 'meta_access_token', 'meta_test_event_code', 'meta_track_lead', 'meta_track_purchase', 'meta_track_initiate_checkout', 'meta_track_view_content'],
              events: [
                { key: 'meta_track_lead', label: 'Lead — usuário inicia o bot' },
                { key: 'meta_track_purchase', label: 'Purchase — pagamento confirmado' },
                { key: 'meta_track_initiate_checkout', label: 'InitiateCheckout — clique em comprar' },
                { key: 'meta_track_view_content', label: 'ViewContent — bot iniciado' },
              ],
              testEvents: ['Lead', 'Purchase', 'InitiateCheckout', 'ViewContent'],
            },
            {
              id: 'tiktok', name: 'TikTok Ads',
              description: 'TikTok Events API — envio server-side em tempo real',
              color: '#010101', configured: !!(values.tiktok_pixel_id),
              fields: [
                { key: 'tiktok_pixel_id', label: 'Pixel ID', secret: false, placeholder: 'C4XXXXXXXXXXXXXXXXXX' },
                { key: 'tiktok_access_token', label: 'Access Token', secret: true, placeholder: 'Token gerado no TikTok Events Manager' },
                { key: 'tiktok_test_event_code', label: 'Test Event Code', secret: false, placeholder: 'Opcional — para validar no painel' },
              ],
              saveKeys: ['tiktok_pixel_id', 'tiktok_access_token', 'tiktok_test_event_code', 'tiktok_track_purchase', 'tiktok_track_lead', 'tiktok_track_checkout'],
              events: [
                { key: 'tiktok_track_lead', label: 'SubmitForm (Lead) — bot iniciado' },
                { key: 'tiktok_track_checkout', label: 'InitiateCheckout — clique em comprar' },
                { key: 'tiktok_track_purchase', label: 'CompletePayment — pagamento confirmado' },
              ],
              testEvents: ['Lead', 'Purchase', 'InitiateCheckout'],
            },
            {
              id: 'ga4', name: 'Google Analytics 4',
              description: 'GA4 Measurement Protocol — importação automática para Google Ads',
              color: '#F9AB00', configured: !!(values.ga4_measurement_id),
              fields: [
                { key: 'ga4_measurement_id', label: 'Measurement ID', secret: false, placeholder: 'G-XXXXXXXXXX' },
                { key: 'ga4_api_secret', label: 'API Secret', secret: true, placeholder: 'Gerado em GA4 → Admin → Data Streams' },
              ],
              saveKeys: ['ga4_measurement_id', 'ga4_api_secret', 'ga4_track_purchase', 'ga4_track_lead'],
              events: [
                { key: 'ga4_track_lead', label: 'generate_lead — bot iniciado' },
                { key: 'ga4_track_purchase', label: 'purchase — pagamento confirmado' },
              ],
              testEvents: ['Lead', 'Purchase'],
            },
            {
              id: 'gtm', name: 'Google Tag Manager',
              description: 'Embed GTM nas suas Páginas de Redirect (biolink)',
              color: '#246FDB', configured: !!(values.gtm_container_id),
              fields: [
                { key: 'gtm_container_id', label: 'Container ID', secret: false, placeholder: 'GTM-XXXXXXX' },
              ],
              saveKeys: ['gtm_container_id'],
              events: [],
              testEvents: [],
            },
            {
              id: 'kwai', name: 'Kwai Ads',
              description: 'Kwai Events API — server-side pixel tracking',
              color: '#FF6900', configured: !!(values.kwai_pixel_id),
              fields: [
                { key: 'kwai_pixel_id', label: 'Pixel ID', secret: false, placeholder: 'Seu Pixel ID do Kwai Ads' },
                { key: 'kwai_access_token', label: 'Access Token', secret: true, placeholder: 'Token de acesso gerado no Kwai Ads Manager' },
              ],
              saveKeys: ['kwai_pixel_id', 'kwai_access_token', 'kwai_track_purchase'],
              events: [
                { key: 'kwai_track_purchase', label: 'PURCHASE — pagamento confirmado' },
              ],
              testEvents: ['Purchase'],
            },
          ] as const

          return (
            <div className="space-y-3">
              {PLATFORMS.map((p) => {
                const expanded = platformExpanded === p.id
                const isConfigured = p.configured
                const isSavingThis = saving === (p.saveKeys[0] as string)

                return (
                  <div
                    key={p.id}
                    className="rounded-2xl overflow-hidden transition-all duration-200"
                    style={{
                      background: expanded ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.68)',
                      border: expanded
                        ? '1px solid rgba(255,255,255,0.90)'
                        : '1px solid rgba(255,255,255,0.80)',
                    }}
                  >
                    {/* Platform header row */}
                    <button
                      type="button"
                      className="w-full flex items-center gap-4 px-5 py-4 text-left"
                      onClick={() => setPlatformExpanded(expanded ? null : p.id)}
                    >
                      {/* Platform icon */}
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{ background: `${p.color}18`, border: `1px solid ${p.color}35` }}
                      >
                        {PLATFORM_LOGOS[p.id]}
                      </div>

                      {/* Name + description */}
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-semibold text-zinc-200">{p.name}</p>
                        <p className="text-[11px] text-zinc-500 mt-0.5 truncate">{p.description}</p>
                      </div>

                      {/* Status badge */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
                          style={isConfigured
                            ? { background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }
                            : { background: 'rgba(255,255,255,0.78)', color: '#71717a', border: '1px solid rgba(255,255,255,0.84)' }
                          }
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ background: isConfigured ? '#34d399' : '#52525b' }}
                          />
                          {isConfigured ? 'Ativo' : 'Inativo'}
                        </span>

                        {/* Chevron */}
                        <svg
                          className="h-4 w-4 text-zinc-600 transition-transform"
                          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>

                    {/* Expanded credential section */}
                    {expanded && (
                      <div className="px-5 pb-5 space-y-5 border-t border-zinc-800">
                        <div className="pt-4 space-y-4">
                          {p.fields.map((field) => (
                            <FieldRow key={field.key} label={field.label}>
                              {field.secret
                                ? <SecretInput value={values[field.key] ?? ''} onChange={(v) => set(field.key, v)} placeholder={field.placeholder} />
                                : <TextInput value={values[field.key] ?? ''} onChange={(v) => set(field.key, v)} placeholder={field.placeholder} />
                              }
                            </FieldRow>
                          ))}
                        </div>

                        {/* Event toggles */}
                        {p.events.length > 0 && (
                          <div className="space-y-3 pt-1 border-t border-zinc-800">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 pt-3">Eventos Rastreados</p>
                            {p.events.map((ev) => (
                              <Toggle
                                key={ev.key}
                                checked={bool(ev.key)}
                                onChange={(v) => setBool(ev.key, v)}
                                label={ev.label}
                              />
                            ))}
                          </div>
                        )}

                        {/* Save + Test row */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800">
                          {/* Test events */}
                          {p.testEvents.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              <span className="text-[10px] text-zinc-600 self-center mr-1">Testar:</span>
                              {p.testEvents.map((ev) => (
                                <button
                                  key={ev}
                                  type="button"
                                  disabled={testingEvent !== null}
                                  onClick={async () => {
                                    setTestingEvent(`${p.id}_${ev}`)
                                    try {
                                      const res = await fetch('/api/pixels/test-event', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ platform: p.id, event_name: ev }),
                                      })
                                      const data = await res.json()
                                      if (!res.ok) { toast.error(data.error ?? `Erro ao enviar ${ev}`); return }
                                      toast.success(`Evento '${ev}' enviado para ${p.name}!`)
                                    } catch { toast.error(`Erro de rede ao enviar ${ev}`) }
                                    finally { setTestingEvent(null) }
                                  }}
                                  className="flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors disabled:opacity-40 hover:border-zinc-500 hover:text-zinc-200"
                                  style={{ borderColor: 'rgba(63,63,70,1)', color: '#a1a1aa' }}
                                >
                                  {testingEvent === `${p.id}_${ev}` ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Send className="h-2.5 w-2.5" />}
                                  {ev}
                                </button>
                              ))}
                            </div>
                          )}

                          <button
                            onClick={() => saveSection(p.saveKeys as unknown as string[])}
                            disabled={isSavingThis}
                            className="ml-auto flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-500 disabled:opacity-60"
                          >
                            {isSavingThis ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                            Salvar {p.name}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })()}

        {/* UTM Builder */}
        <div
          className="rounded-2xl p-5 space-y-4 mt-2"
          style={{ background: 'rgba(255,255,255,0.68)', border: '1px solid rgba(255,255,255,0.82)' }}
        >
          <div>
            <p className="text-sm font-semibold text-zinc-200">Construtor de Links UTM</p>
            <p className="text-xs text-zinc-500 mt-0.5">Crie links rastreáveis para suas campanhas de anúncios</p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <p className="text-xs font-medium text-zinc-400">URL base (seu link de redirect ou t.me/...)</p>
              <TextInput
                value={utmForm.baseUrl}
                onChange={(v) => setUtmForm(f => ({ ...f, baseUrl: v }))}
                placeholder="https://seusite.com/r/canal-vip"
              />
            </div>
            {[
              { key: 'source', label: 'Fonte (utm_source)', placeholder: 'google, facebook, tiktok...' },
              { key: 'medium', label: 'Mídia (utm_medium)', placeholder: 'cpc, cpm, organic...' },
              { key: 'campaign', label: 'Campanha (utm_campaign)', placeholder: 'nome_da_campanha' },
              { key: 'content', label: 'Conteúdo (utm_content)', placeholder: 'banner_azul, video_1...' },
              { key: 'term', label: 'Termo (utm_term)', placeholder: 'palavra_chave (opcional)' },
            ].map(({ key, label, placeholder }) => (
              <div key={key} className="space-y-1.5">
                <p className="text-xs font-medium text-zinc-400">{label}</p>
                <TextInput
                  value={(utmForm as Record<string, string>)[key] ?? ''}
                  onChange={(v) => setUtmForm(f => ({ ...f, [key]: v }))}
                  placeholder={placeholder}
                />
              </div>
            ))}
          </div>

          {/* Generated link preview */}
          {utmLink && (
            <div className="rounded-xl p-3" style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.15)' }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-1">Link gerado</p>
                  <p className="text-xs text-zinc-300 break-all font-mono">{utmLink}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { navigator.clipboard.writeText(utmLink); toast.success('Link copiado!') }}
                  className="shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                  style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}
                >
                  <Copy className="h-3 w-3" /> Copiar
                </button>
              </div>
            </div>
          )}
        </div>
      </>)}

      {tab === 'saas' && (<>
        {(() => {
          const saasGw = values.saas_billing_gateway || 'amplopay'
          const saasKeys = saasGw === 'amplopay'
            ? ['saas_billing_gateway', 'saas_billing_amplopay_public_key', 'saas_billing_amplopay_secret_key', 'saas_billing_amplopay_webhook_token']
            : ['saas_billing_gateway', 'saas_billing_pushinpay_token']
          return (
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.82)' }}>
              <div className="px-5 py-4" style={{ background: 'rgba(255,255,255,0.72)', borderBottom: '1px solid rgba(255,255,255,0.82)' }}>
                <p className="text-sm font-semibold text-zinc-100">Gateway de Cobrança SaaS</p>
                <p className="text-xs text-zinc-500 mt-0.5">Gateway que receberá os pagamentos das mensalidades dos usuários da plataforma</p>
              </div>
              <div className="px-5 py-5 space-y-5">
                <FieldRow label="Gateway" description="Plataforma de pagamento para cobrar assinaturas dos usuários SaaS">
                  <select
                    value={saasGw}
                    onChange={e => set('saas_billing_gateway', e.target.value)}
                    className="w-full rounded-xl border border-zinc-700/60 bg-zinc-800/60 px-4 py-2.5 text-sm text-zinc-100 outline-none transition-all focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10"
                  >
                    <option value="amplopay">AmploPay</option>
                    <option value="pushinpay">PushinPay</option>
                  </select>
                </FieldRow>

                {saasGw === 'amplopay' && (<>
                  <FieldRow label="Public Key" description="Chave pública AmploPay (x-public-key)">
                    <SecretInput value={values.saas_billing_amplopay_public_key ?? ''} onChange={v => set('saas_billing_amplopay_public_key', v)} placeholder="pk_..." />
                  </FieldRow>
                  <FieldRow label="Secret Key" description="Chave secreta AmploPay (x-secret-key)">
                    <SecretInput value={values.saas_billing_amplopay_secret_key ?? ''} onChange={v => set('saas_billing_amplopay_secret_key', v)} placeholder="sk_..." />
                  </FieldRow>
                  <FieldRow label="Webhook Token" description="Token para validar notificações recebidas da AmploPay">
                    <SecretInput value={values.saas_billing_amplopay_webhook_token ?? ''} onChange={v => set('saas_billing_amplopay_webhook_token', v)} placeholder="Token secreto do webhook" />
                  </FieldRow>
                  <FieldRow label="Webhook URL" description="Configure este endereço no painel da AmploPay">
                    <div className="flex items-center rounded-xl border border-zinc-700/40 bg-zinc-900/50 px-4 py-2.5">
                      <code className="text-xs text-zinc-400">/api/saas/billing-webhook</code>
                    </div>
                  </FieldRow>
                </>)}

                {saasGw === 'pushinpay' && (
                  <FieldRow label="Token / API Key" description="Token de acesso PushinPay">
                    <SecretInput value={values.saas_billing_pushinpay_token ?? ''} onChange={v => set('saas_billing_pushinpay_token', v)} placeholder="Token PushinPay" />
                  </FieldRow>
                )}

                <div className="flex justify-end pt-2 border-t border-zinc-800">
                  <button
                    onClick={() => saveSection(saasKeys)}
                    disabled={saving === 'saas_billing_gateway'}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-500 disabled:opacity-60"
                  >
                    {saving === 'saas_billing_gateway'
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Save className="h-3.5 w-3.5" />}
                    Salvar Gateway SaaS
                  </button>
                </div>
              </div>
            </div>
          )
        })()}
      </>)}

    </div>
  )
}
