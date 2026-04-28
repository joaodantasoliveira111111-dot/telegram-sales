'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Save, Eye, EyeOff, Info } from 'lucide-react'

// ─── Platform SVG logos ──────────────────────────────────────────────────────
function LogoMeta() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
      <path d="M20 16.5c1.7-2.6 4.2-5 6.8-5 5.2 0 8.2 4.6 8.2 10.2 0 5.3-2.7 9.3-7 9.3-2.5 0-4.5-1.2-6.4-4.2L20 25l-1.6 1.8C16.5 29.8 14.5 31 12 31c-4.3 0-7-4-7-9.3 0-5.6 3-10.2 8.2-10.2 2.6 0 5.1 2.4 6.8 5z" fill="url(#meta_g)" />
      <defs>
        <linearGradient id="meta_g" x1="5" y1="11.5" x2="35" y2="31" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0081FB" />
          <stop offset="1" stopColor="#0039B0" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function LogoTikTok() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
      <path d="M28 8h-4.5v16.3a4.7 4.7 0 01-4.7 4.7 4.7 4.7 0 01-4.7-4.7 4.7 4.7 0 014.7-4.7c.47 0 .93.07 1.36.19V15a9.3 9.3 0 00-1.36-.1A9.2 9.2 0 008.6 24.3 9.2 9.2 0 0018.8 33.5a9.2 9.2 0 009.2-9.2V16.4A13.4 13.4 0 0036 18.3V13.9A8.9 8.9 0 0128 8z" fill="white" />
      <path d="M28 8h-4.5v16.3a4.7 4.7 0 01-4.7 4.7 4.7 4.7 0 01-4.7-4.7 4.7 4.7 0 014.7-4.7c.47 0 .93.07 1.36.19V15a9.3 9.3 0 00-1.36-.1A9.2 9.2 0 008.6 24.3 9.2 9.2 0 0018.8 33.5a9.2 9.2 0 009.2-9.2V16.4A13.4 13.4 0 0036 18.3V13.9A8.9 8.9 0 0128 8z" fill="url(#tiktok_g)" fillOpacity="0.9" />
      <defs>
        <linearGradient id="tiktok_g" x1="8" y1="8" x2="36" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#69C9D0" />
          <stop offset="1" stopColor="#EE1D52" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function LogoGA4() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
      <rect x="6" y="24" width="7" height="10" rx="2" fill="#F9AB00" />
      <rect x="16.5" y="15" width="7" height="19" rx="2" fill="#E37400" />
      <rect x="27" y="6" width="7" height="28" rx="2" fill="#E37400" />
    </svg>
  )
}

function LogoGTM() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
      <path d="M20 4L6 20l14 16 14-16L20 4z" fill="url(#gtm_g)" />
      <path d="M26 20l-6-8-6 8 6 8 6-8z" fill="white" fillOpacity="0.9" />
      <defs>
        <linearGradient id="gtm_g" x1="6" y1="4" x2="34" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8AB4F8" />
          <stop offset="1" stopColor="#4285F4" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function LogoKwai() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
      <circle cx="20" cy="20" r="16" fill="url(#kwai_g)" />
      <path d="M14 14l8 6-8 6V14zm8 6l6-6v12l-6-6z" fill="white" />
      <defs>
        <linearGradient id="kwai_g" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF8C00" />
          <stop offset="1" stopColor="#FF4500" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface PixelValues {
  meta_pixel_id: string
  meta_access_token: string
  meta_test_event_code: string
  tiktok_pixel_id: string
  tiktok_access_token: string
  ga4_measurement_id: string
  ga4_api_secret: string
  gtm_container_id: string
  kwai_pixel_id: string
  kwai_access_token: string
}

interface BotPixelFormProps {
  botId: string
  initialValues: PixelValues
}

function SecretInput({ id, value, onChange, placeholder }: {
  id: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

const PLATFORMS = [
  {
    key: 'meta',
    label: 'Meta (Facebook) Ads',
    logo: LogoMeta,
    color: 'rgba(0,129,251,0.15)',
    border: 'rgba(0,129,251,0.3)',
    fields: [
      { id: 'meta_pixel_id', label: 'Pixel ID', placeholder: '123456789012345', secret: false },
      { id: 'meta_access_token', label: 'Access Token', placeholder: 'EAAxxxxx...', secret: true },
      { id: 'meta_test_event_code', label: 'Test Event Code (opcional)', placeholder: 'TEST12345', secret: false },
    ],
  },
  {
    key: 'tiktok',
    label: 'TikTok Ads',
    logo: LogoTikTok,
    color: 'rgba(105,201,208,0.1)',
    border: 'rgba(105,201,208,0.3)',
    fields: [
      { id: 'tiktok_pixel_id', label: 'Pixel ID', placeholder: 'CXXXXXXXXXXXXXX', secret: false },
      { id: 'tiktok_access_token', label: 'Access Token', placeholder: 'xxxxx...', secret: true },
    ],
  },
  {
    key: 'ga4',
    label: 'Google Analytics 4',
    logo: LogoGA4,
    color: 'rgba(249,171,0,0.1)',
    border: 'rgba(249,171,0,0.3)',
    fields: [
      { id: 'ga4_measurement_id', label: 'Measurement ID', placeholder: 'G-XXXXXXXXXX', secret: false },
      { id: 'ga4_api_secret', label: 'API Secret', placeholder: 'Measurement Protocol secret', secret: true },
    ],
  },
  {
    key: 'gtm',
    label: 'Google Tag Manager',
    logo: LogoGTM,
    color: 'rgba(66,133,244,0.1)',
    border: 'rgba(66,133,244,0.3)',
    fields: [
      { id: 'gtm_container_id', label: 'Container ID', placeholder: 'GTM-XXXXXXX', secret: false },
    ],
  },
  {
    key: 'kwai',
    label: 'Kwai Ads',
    logo: LogoKwai,
    color: 'rgba(255,140,0,0.1)',
    border: 'rgba(255,140,0,0.3)',
    fields: [
      { id: 'kwai_pixel_id', label: 'Pixel ID', placeholder: 'XXXXXXXXXX', secret: false },
      { id: 'kwai_access_token', label: 'Access Token', placeholder: 'xxxxx...', secret: true },
    ],
  },
]

export function BotPixelForm({ botId, initialValues }: BotPixelFormProps) {
  const [form, setForm] = useState<PixelValues>(initialValues)
  const [loading, setLoading] = useState(false)

  const isEmpty = !form.meta_pixel_id && !form.tiktok_pixel_id && !form.ga4_measurement_id && !form.gtm_container_id && !form.kwai_pixel_id

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/bots/${botId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) { toast.error('Erro ao salvar pixels'); return }
      toast.success('Pixels salvos com sucesso!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-100">Pixels — Por Bot</h2>
        <p className="text-sm text-zinc-500 mt-1">
          Configure pixels exclusivos para este bot. Se deixar vazio, usa os pixels globais das Configurações.
        </p>
      </div>

      {isEmpty && (
        <div
          className="flex items-start gap-3 rounded-2xl p-4"
          style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
          <p className="text-sm text-zinc-400">
            Nenhum pixel configurado. Os eventos serão rastreados com os pixels globais em{' '}
            <a href="/dashboard/settings" className="text-blue-400 hover:underline">Configurações</a>.
          </p>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        {PLATFORMS.map((platform) => {
          const Logo = platform.logo
          return (
            <Card key={platform.key}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
                    style={{ background: platform.color, border: `1px solid ${platform.border}` }}
                  >
                    <Logo />
                  </div>
                  <CardTitle className="text-sm">{platform.label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {platform.fields.map((field) => (
                  <div key={field.id} className="space-y-1.5">
                    <Label htmlFor={field.id}>{field.label}</Label>
                    {field.secret ? (
                      <SecretInput
                        id={field.id}
                        value={(form as unknown as Record<string, string>)[field.id] ?? ''}
                        onChange={(v) => setForm((prev) => ({ ...prev, [field.id]: v }))}
                        placeholder={`${field.placeholder} (deixe vazio para usar o global)`}
                      />
                    ) : (
                      <Input
                        id={field.id}
                        value={(form as unknown as Record<string, string>)[field.id] ?? ''}
                        onChange={(e) => setForm((prev) => ({ ...prev, [field.id]: e.target.value }))}
                        placeholder={`${field.placeholder} (deixe vazio para usar o global)`}
                      />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )
        })}

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={loading} size="default">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar Pixels
          </Button>
        </div>
      </form>
    </div>
  )
}
