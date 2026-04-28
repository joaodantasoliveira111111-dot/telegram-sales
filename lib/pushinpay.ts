import { getSettings } from './settings'

const BASE = 'https://api.pushinpay.com.br/api'

async function getToken(): Promise<string> {
  const s = await getSettings(['pushinpay_token'])
  return s.pushinpay_token || process.env.PUSHINPAY_TOKEN || ''
}

export interface PushinPayTransaction {
  id: string
  qr_code: string
  qr_code_base64: string
  status: 'created' | 'paid' | 'canceled'
  value: number
  webhook_url: string | null
  end_to_end_id: string | null
  payer_name: string | null
  payer_national_registration: string | null
}

export async function createPix(data: {
  value: number      // em reais (ex: 59.90) — convertido para centavos internamente
  webhookUrl?: string
}): Promise<PushinPayTransaction> {
  const token = await getToken()

  const res = await fetch(`${BASE}/pix/cashIn`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      value: Math.round(data.value * 100),   // reais → centavos
      webhook_url: data.webhookUrl ?? undefined,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`PushinPay createPix ${res.status}: ${err}`)
  }

  return res.json()
}

export async function getTransaction(id: string): Promise<PushinPayTransaction | null> {
  const token = await getToken()

  const res = await fetch(`${BASE}/pix/cashIn/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) return null
  const data = await res.json()
  // 404 returns empty array []
  if (Array.isArray(data)) return null
  return data
}
