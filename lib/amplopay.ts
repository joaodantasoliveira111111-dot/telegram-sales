import { AmplopayCreatePixRequest, AmplopayCreatePixResponse } from '@/types'

const AMPLOPAY_API_URL = process.env.AMPLOPAY_API_URL || 'https://api.amplopay.com.br/v1'
const AMPLOPAY_API_KEY = process.env.AMPLOPAY_API_KEY!
const AMPLOPAY_WEBHOOK_TOKEN = process.env.AMPLOPAY_WEBHOOK_TOKEN!

function headers() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${AMPLOPAY_API_KEY}`,
  }
}

export async function createPix(data: AmplopayCreatePixRequest): Promise<AmplopayCreatePixResponse> {
  const res = await fetch(`${AMPLOPAY_API_URL}/transactions/pix`, {
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
  const res = await fetch(`${AMPLOPAY_API_URL}/transactions/${transactionId}`, {
    headers: headers(),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`AmploPay getTransaction failed: ${res.status} ${err}`)
  }

  return res.json()
}

export function validateWebhookToken(token: string | null): boolean {
  if (!AMPLOPAY_WEBHOOK_TOKEN) return true // skip if not configured
  return token === AMPLOPAY_WEBHOOK_TOKEN
}
