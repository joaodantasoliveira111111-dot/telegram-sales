import { getSettings } from './settings'

const AMPLOPAY_BASE_URL = 'https://app.amplopay.com/api/v1'

async function getKeys() {
  const s = await getSettings(['amplopay_public_key', 'amplopay_secret_key', 'amplopay_webhook_token'])
  return {
    publicKey: s.amplopay_public_key || process.env.AMPLOPAY_PUBLIC_KEY || '',
    secretKey: s.amplopay_secret_key || process.env.AMPLOPAY_SECRET_KEY || '',
    webhookToken: s.amplopay_webhook_token || process.env.AMPLOPAY_WEBHOOK_TOKEN || '',
  }
}

export interface CreatePixRequest {
  identifier: string
  amount: number
  callbackUrl?: string
  client: {
    name: string
    email: string
    phone: string
    document?: string
  }
}

export interface CreatePixResponse {
  transactionId: string
  status: string
  pix: {
    code: string
    qrCode: string
    expiresAt?: string
  }
  fee?: number
  order?: Record<string, unknown>
}

export async function createPix(data: CreatePixRequest): Promise<CreatePixResponse> {
  const { publicKey, secretKey } = await getKeys()

  const res = await fetch(`${AMPLOPAY_BASE_URL}/gateway/pix/receive`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-public-key': publicKey,
      'x-secret-key': secretKey,
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`AmploPay createPix failed: ${res.status} ${err}`)
  }

  return res.json()
}

export async function getTransaction(transactionId: string) {
  const { publicKey, secretKey } = await getKeys()

  const res = await fetch(`${AMPLOPAY_BASE_URL}/gateway/transactions?id=${transactionId}`, {
    headers: {
      'x-public-key': publicKey,
      'x-secret-key': secretKey,
    },
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`AmploPay getTransaction failed: ${res.status} ${err}`)
  }

  return res.json()
}

export async function validateWebhookToken(token: string | null): Promise<boolean> {
  const { webhookToken } = await getKeys()
  if (!webhookToken) return true
  return token === webhookToken
}
