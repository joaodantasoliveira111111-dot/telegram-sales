import crypto from 'crypto'
import { getSettings } from './settings'

const API_URL = 'https://ads.kwai.com/open-api/v1/tracking/conversions/pixel'

function hash(v: string) {
  return crypto.createHash('sha256').update(v.trim().toLowerCase()).digest('hex')
}

async function getCfg() {
  const s = await getSettings(['kwai_pixel_id', 'kwai_access_token', 'kwai_track_purchase'])
  return {
    pixelId: s.kwai_pixel_id || '',
    accessToken: s.kwai_access_token || '',
    trackPurchase: s.kwai_track_purchase !== 'false',
  }
}

async function fire(pixelId: string, accessToken: string, eventType: string, data: { eventId: string; value?: number; planName: string; planId?: string; telegramId: string }) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({
        pixel_id: pixelId,
        event_type: eventType,
        event_time: Math.floor(Date.now() / 1000),
        event_id: data.eventId,
        user: { external_id: hash(data.telegramId) },
        conversion_value: { price: data.value ?? 0, currency: 'BRL' },
        content: { content_id: data.planId ?? data.planName, content_name: data.planName, content_type: 'product' },
      }),
    })
    const r = await res.json()
    if (!res.ok) console.error('[Kwai Events]', r)
    else console.log('[Kwai Events] ok')
  } catch (e) { console.error('[Kwai Events] fetch error', e) }
}

export async function sendKwaiPurchase(data: { eventId: string; value: number; planName: string; planId?: string; telegramId: string }) {
  const c = await getCfg()
  if (!c.pixelId || !c.accessToken || !c.trackPurchase) return
  await fire(c.pixelId, c.accessToken, 'PURCHASE', data)
}

export async function sendKwaiCheckout(data: { eventId: string; value: number; planName: string; planId?: string; telegramId: string }) {
  const c = await getCfg()
  if (!c.pixelId || !c.accessToken) return
  await fire(c.pixelId, c.accessToken, 'INITIATE_CHECKOUT', data)
}

export async function sendKwaiViewContent(data: { eventId: string; value?: number; planName: string; planId?: string; telegramId: string }) {
  const c = await getCfg()
  if (!c.pixelId || !c.accessToken) return
  await fire(c.pixelId, c.accessToken, 'VIEW_CONTENT', data)
}
