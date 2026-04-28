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

export async function sendKwaiPurchase(data: { eventId: string; value: number; planName: string; planId?: string; telegramId: string }) {
  const c = await getCfg()
  if (!c.pixelId || !c.accessToken || !c.trackPurchase) return
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${c.accessToken}` },
      body: JSON.stringify({
        pixel_id: c.pixelId,
        event_type: 'PURCHASE',
        event_time: Math.floor(Date.now() / 1000),
        event_id: data.eventId,
        user: { external_id: hash(data.telegramId) },
        conversion_value: { price: data.value, currency: 'BRL' },
        content: { content_id: data.planId ?? data.planName, content_name: data.planName, content_type: 'product' },
      }),
    })
    const r = await res.json()
    if (!res.ok) console.error('[Kwai Events]', r)
    else console.log('[Kwai Events] ok')
  } catch (e) { console.error('[Kwai Events] fetch error', e) }
}
