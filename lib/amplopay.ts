const AMPLOPAY_BASE_URL = 'https://app.amplopay.com/api/v1'
const AMPLOPAY_PUBLIC_KEY = process.env.AMPLOPAY_PUBLIC_KEY!
const AMPLOPAY_SECRET_KEY = process.env.AMPLOPAY_SECRET_KEY!

function headers() {
  return {
    'Content-Type': 'application/json',
    'x-public-key': AMPLOPAY_PUBLIC_KEY,
    'x-secret-key': AMPLOPAY_SECRET_KEY,
  }
}

export interface CreatePixRequest {
  identifier: string
  amount: number
  callbackUrl?: string
  client: {
    name: string
    email?: string
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
  const res = await fetch(`${AMPLOPAY_BASE_URL}/gateway/pix/receive`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`AmploPay createPix failed: ${res.status} ${err}`)
  }

  return res.json()
}

export async function getTransaction(transactionId: string) {
  const res = await fetch(`${AMPLOPAY_BASE_URL}/gateway/transactions?id=${transactionId}`, {
    headers: headers(),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`AmploPay getTransaction failed: ${res.status} ${err}`)
  }

  return res.json()
}

export function validateWebhookToken(token: string | null): boolean {
  const expected = process.env.AMPLOPAY_WEBHOOK_TOKEN
  if (!expected) return true
  return token === expected
}
