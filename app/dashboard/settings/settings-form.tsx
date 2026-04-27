'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Save, Loader2, Eye, EyeOff, ExternalLink } from 'lucide-react'
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
  const [values, setValues] = useState<Record<string, string>>(initial)
  const [saving, setSaving] = useState<string | null>(null)

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
  const metaKeys = ['meta_pixel_id', 'meta_access_token', 'meta_test_event_code', 'meta_track_purchase', 'meta_track_initiate_checkout', 'meta_track_view_content']

  return (
    <div className="space-y-6">
      {/* AmploPay */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base font-semibold text-zinc-100">AmploPay</CardTitle>
              <p className="mt-1 text-xs text-zinc-500">Credenciais do gateway de pagamento Pix</p>
            </div>
            <a
              href="https://app.amplopay.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Painel <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <FieldRow label="Public Key" description="Chave pública da API">
            <SecretInput value={values.amplopay_public_key ?? ''} onChange={(v) => set('amplopay_public_key', v)} placeholder="pk_..." />
          </FieldRow>
          <FieldRow label="Secret Key" description="Chave secreta da API">
            <SecretInput value={values.amplopay_secret_key ?? ''} onChange={(v) => set('amplopay_secret_key', v)} placeholder="sk_..." />
          </FieldRow>
          <FieldRow label="Webhook Token" description="Token para validar notificações do gateway">
            <SecretInput value={values.amplopay_webhook_token ?? ''} onChange={(v) => set('amplopay_webhook_token', v)} placeholder="Token secreto do webhook" />
          </FieldRow>

          <div className="flex justify-end border-t border-zinc-800 pt-4">
            <button
              onClick={() => saveSection(amplopayKeys)}
              disabled={saving === 'amplopay_public_key'}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-500 disabled:opacity-60"
            >
              {saving === 'amplopay_public_key' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Salvar Gateway
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Meta Pixel */}
      <Card>
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
        </CardContent>
      </Card>

      {/* Future gateways placeholder */}
      <Card className="border-dashed border-zinc-700/60 bg-zinc-900/30">
        <CardContent className="flex items-center justify-center py-10">
          <div className="text-center">
            <p className="text-sm font-medium text-zinc-500">Mais gateways em breve</p>
            <p className="mt-1 text-xs text-zinc-600">Mercado Pago, Stripe, Asaas e outros</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
