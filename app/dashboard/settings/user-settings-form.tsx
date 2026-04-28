'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Save, Eye, EyeOff, CreditCard, TrendingUp, Copy, CheckCircle2, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const PLAN_ORDER = ['pay_per_use', 'starter', 'pro']
const PLAN_LABELS: Record<string, string> = { pay_per_use: 'Pay-per-use', starter: 'Starter', pro: 'Pro' }
const PLAN_PRICES: Record<string, number> = { starter: 97, pro: 297 }
const PLAN_FEE: Record<string, string> = { pay_per_use: 'R$ 0,50/venda', starter: 'R$ 0,35/venda', pro: 'R$ 0,25/venda' }

function SecretInput({ value, onChange, placeholder, id }: { value: string; onChange: (v: string) => void; placeholder?: string; id: string }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Input id={id} type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="pr-10" />
      <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

interface Props {
  userId: string
  initial: Record<string, string | null>
}

export function UserSettingsForm({ userId: _userId, initial }: Props) {
  const [gateway, setGateway] = useState({
    gateway_type: initial.gateway_type ?? '',
    gateway_token: initial.gateway_token ?? '',
  })
  const [pixels, setPixels] = useState({
    meta_pixel_id: initial.meta_pixel_id ?? '',
    meta_access_token: initial.meta_access_token ?? '',
    tiktok_pixel_id: initial.tiktok_pixel_id ?? '',
    tiktok_access_token: initial.tiktok_access_token ?? '',
    ga4_measurement_id: initial.ga4_measurement_id ?? '',
    ga4_api_secret: initial.ga4_api_secret ?? '',
    gtm_container_id: initial.gtm_container_id ?? '',
    kwai_pixel_id: initial.kwai_pixel_id ?? '',
    kwai_access_token: initial.kwai_access_token ?? '',
  })
  const [savingGateway, setSavingGateway] = useState(false)
  const [savingPixels, setSavingPixels] = useState(false)

  // Plan upgrade
  const currentPlan = initial.plan_type ?? 'pay_per_use'
  const [upgrading, setUpgrading] = useState(false)
  const [pixData, setPixData] = useState<{ pix_code: string; pix_qr: string; amount: number; plan: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const upgradablePlans = PLAN_ORDER.filter(p => PLAN_ORDER.indexOf(p) > PLAN_ORDER.indexOf(currentPlan))

  async function saveGateway(e: React.FormEvent) {
    e.preventDefault()
    setSavingGateway(true)
    try {
      const res = await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(gateway) })
      if (!res.ok) { toast.error('Erro ao salvar gateway'); return }
      toast.success('Gateway salvo!')
    } finally { setSavingGateway(false) }
  }

  async function savePixels(e: React.FormEvent) {
    e.preventDefault()
    setSavingPixels(true)
    try {
      const res = await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pixels) })
      if (!res.ok) { toast.error('Erro ao salvar pixels'); return }
      toast.success('Pixels salvos!')
    } finally { setSavingPixels(false) }
  }

  async function handleUpgrade(plan: string) {
    setUpgrading(true)
    try {
      const res = await fetch('/api/saas/upgrade', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ new_plan: plan }) })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Erro ao fazer upgrade'); return }
      if (data.requires_payment) {
        setPixData({ pix_code: data.pix_code, pix_qr: data.pix_qr, amount: data.amount, plan })
      } else {
        toast.success('Plano atualizado!'); window.location.reload()
      }
    } finally { setUpgrading(false) }
  }

  function copyPix() {
    if (!pixData) return
    navigator.clipboard.writeText(pixData.pix_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sectionCard = (title: string, icon: React.ReactNode, content: React.ReactNode) => (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
            style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}>
            {icon}
          </div>
          <CardTitle className="text-sm">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  )

  return (
    <div className="max-w-2xl space-y-5">
      {/* Current plan + upgrade */}
      {sectionCard('Plano Atual', <TrendingUp className="h-4 w-4 text-violet-400" />, (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl p-4"
            style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
            <div>
              <p className="font-semibold text-violet-300">{PLAN_LABELS[currentPlan]}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{PLAN_FEE[currentPlan]}</p>
            </div>
            <span className="text-xs text-zinc-500">Plano ativo</span>
          </div>

          {upgradablePlans.length > 0 && !pixData && (
            <div>
              <p className="text-xs text-zinc-500 mb-2">Fazer upgrade para:</p>
              <div className="flex gap-2 flex-wrap">
                {upgradablePlans.map(plan => (
                  <button key={plan} onClick={() => handleUpgrade(plan)} disabled={upgrading}
                    className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
                    {upgrading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <TrendingUp className="h-3.5 w-3.5" />}
                    {PLAN_LABELS[plan]} — R$ {PLAN_PRICES[plan]}/mês
                  </button>
                ))}
              </div>
            </div>
          )}

          {pixData && (
            <div className="rounded-2xl p-5 space-y-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
              <p className="text-sm font-semibold text-zinc-200">
                Pague R$ {pixData.amount},00 para ativar o plano <span className="text-violet-400">{PLAN_LABELS[pixData.plan]}</span>
              </p>
              {pixData.pix_qr && (
                <div className="flex justify-center">
                  <div className="rounded-xl overflow-hidden bg-white p-3 inline-block">
                    <img src={`data:image/png;base64,${pixData.pix_qr}`} alt="QR PIX" className="h-36 w-36" />
                  </div>
                </div>
              )}
              <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-xs text-zinc-500 mb-1">Código PIX Copia e Cola</p>
                <p className="text-xs text-zinc-300 font-mono break-all">{pixData.pix_code}</p>
              </div>
              <button onClick={copyPix}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all"
                style={{ background: copied ? 'rgba(34,197,94,0.2)' : 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)', color: copied ? '#4ade80' : '#a78bfa' }}>
                {copied ? <><CheckCircle2 className="h-4 w-4" /> Copiado!</> : <><Copy className="h-4 w-4" /> Copiar código PIX</>}
              </button>
              <div className="flex items-center justify-center gap-2 text-xs text-zinc-500">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Aguardando pagamento... A página atualiza automaticamente.
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Gateway */}
      {sectionCard('Meu Gateway de Pagamento', <CreditCard className="h-4 w-4 text-violet-400" />, (
        <form onSubmit={saveGateway} className="space-y-4">
          <p className="text-xs text-zinc-500">
            Conecte seu próprio gateway para receber pagamentos dos seus clientes diretamente. Se deixar vazio, seus clientes pagarão pelo gateway da FlowBot (marketplace).
          </p>
          <div className="space-y-1.5">
            <Label>Gateway</Label>
            <select
              value={gateway.gateway_type}
              onChange={e => setGateway(g => ({ ...g, gateway_type: e.target.value }))}
              className="w-full rounded-xl border px-4 py-3 text-sm text-zinc-100 bg-white/5 outline-none transition-all"
              style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <option value="">Usar gateway da FlowBot (marketplace)</option>
              <option value="amplopay">AmploPay</option>
              <option value="pushinpay">PushinPay</option>
            </select>
          </div>
          {gateway.gateway_type && (
            <div className="space-y-1.5">
              <Label htmlFor="gw-token">Token / API Key</Label>
              <SecretInput id="gw-token" value={gateway.gateway_token} onChange={v => setGateway(g => ({ ...g, gateway_token: v }))} placeholder="Token do gateway" />
            </div>
          )}
          <div className="flex justify-end">
            <Button type="submit" disabled={savingGateway}>
              {savingGateway ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar Gateway
            </Button>
          </div>
        </form>
      ))}

      {/* Pixels */}
      {sectionCard('Pixels & Rastreamento', <TrendingUp className="h-4 w-4 text-violet-400" />, (
        <form onSubmit={savePixels} className="space-y-4">
          <p className="text-xs text-zinc-500">Pixels globais aplicados em todos os seus bots. Você também pode configurar pixels específicos por bot.</p>
          {[
            { label: 'Meta Pixel ID', key: 'meta_pixel_id', secret: false },
            { label: 'Meta Access Token', key: 'meta_access_token', secret: true },
            { label: 'TikTok Pixel ID', key: 'tiktok_pixel_id', secret: false },
            { label: 'TikTok Access Token', key: 'tiktok_access_token', secret: true },
            { label: 'GA4 Measurement ID', key: 'ga4_measurement_id', secret: false },
            { label: 'GA4 API Secret', key: 'ga4_api_secret', secret: true },
            { label: 'GTM Container ID', key: 'gtm_container_id', secret: false },
            { label: 'Kwai Pixel ID', key: 'kwai_pixel_id', secret: false },
            { label: 'Kwai Access Token', key: 'kwai_access_token', secret: true },
          ].map(f => (
            <div key={f.key} className="space-y-1.5">
              <Label>{f.label}</Label>
              {f.secret
                ? <SecretInput id={f.key} value={(pixels as Record<string, string>)[f.key]} onChange={v => setPixels(p => ({ ...p, [f.key]: v }))} />
                : <Input value={(pixels as Record<string, string>)[f.key]} onChange={e => setPixels(p => ({ ...p, [f.key]: e.target.value }))} />
              }
            </div>
          ))}
          <div className="flex justify-end">
            <Button type="submit" disabled={savingPixels}>
              {savingPixels ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar Pixels
            </Button>
          </div>
        </form>
      ))}
    </div>
  )
}
