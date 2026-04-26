import crypto from 'crypto'

const PIXEL_ID = process.env.META_PIXEL_ID!
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN!
const API_VERSION = 'v19.0'

function hash(value: string): string {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

interface PurchaseEventData {
  eventId: string
  value: number
  planName: string
  telegramId: string
  email?: string
  phone?: string
}

export async function sendPurchaseEvent(data: PurchaseEventData) {
  const eventTime = Math.floor(Date.now() / 1000)

  const payload = {
    data: [
      {
        event_name: 'Purchase',
        event_time: eventTime,
        event_id: data.eventId,
        action_source: 'other',
        user_data: {
          ...(data.email ? { em: [hash(data.email)] } : {}),
          ...(data.phone ? { ph: [hash(data.phone.replace(/\D/g, ''))] } : {}),
          external_id: [hash(data.telegramId)],
        },
        custom_data: {
          value: data.value,
          currency: 'BRL',
          content_name: data.planName,
          content_type: 'product',
          contents: [
            {
              id: data.planName,
              quantity: 1,
              item_price: data.value,
            },
          ],
        },
      },
    ],
    access_token: ACCESS_TOKEN,
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    )

    const result = await res.json()

    if (!res.ok) {
      console.error('[Meta CAPI] Erro ao enviar evento:', result)
    } else {
      console.log('[Meta CAPI] Purchase enviado:', result.events_received)
    }
  } catch (err) {
    console.error('[Meta CAPI] Falha na requisição:', err)
  }
}
