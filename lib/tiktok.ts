import crypto from 'crypto'
import { getSettings } from './settings'

const API_URL = 'https://business-api.tiktok.com/open_api/v1.3/event/track/'

function hash(v: string) {
  return crypto.createHash('sha256').update(v.trim().toLowerCase()).digest('hex')
}

async function getCfg() {
  const s = await getSettings([
    'tiktok_pixel_id', 'tiktok_access_token', 'tiktok_test_event_code',
    'tiktok_track_purchase', 'tiktok_track_lead', 'tiktok_track_checkout',
  ])
  return {
    pixelId: s.tiktok_pixel_id || '',
    accessToken: s.tiktok_access_token || '',
    testEventCode: s.tiktok_test_event_code || '',
    trackPurchase: s.tiktok_track_purchase !== 'false',
    trackLead: s.tiktok_track_lead !== 'false',
    trackCheckout: s.tiktok_track_checkout !== 'false',
  }
}

async function fire(pixelId: string, accessToken: string, testEventCode: string, event: Record<string, unknown>) {
  const body: Record<string, unknown> = { ...event, pixel_code: pixelId }
  if (testEventCode) body.test_event_code = testEventCode
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Access-Token': accessToken },
      body: JSON.stringify(body),
    })
    const r = await res.json()
    if (!res.ok || r.code !== 0) console.error('[TikTok Events]', r)
    else console.log('[TikTok Events] ok events_received:', r.data?.events_received)
  } catch (e) { console.error('[TikTok Events] fetch error', e) }
}

export async function sendTikTokPurchase(data: { eventId: string; value: number; planName: string; planId?: string; paymentId?: string; telegramId: string }) {
  const c = await getCfg()
  if (!c.pixelId || !c.accessToken || !c.trackPurchase) return
  await fire(c.pixelId, c.accessToken, c.testEventCode, {
    event: 'CompletePayment',
    event_time: Math.floor(Date.now() / 1000),
    event_id: data.eventId,
    user: { external_id: [hash(data.telegramId)] },
    properties: {
      value: data.value, currency: 'BRL',
      content_id: data.planId ?? data.planName,
      content_name: data.planName, content_type: 'product', quantity: 1,
      order_id: data.paymentId,
    },
  })
}

export async function sendTikTokLead(data: { eventId: string; telegramId: string; botName?: string }) {
  const c = await getCfg()
  if (!c.pixelId || !c.accessToken || !c.trackLead) return
  await fire(c.pixelId, c.accessToken, c.testEventCode, {
    event: 'SubmitForm',
    event_time: Math.floor(Date.now() / 1000),
    event_id: data.eventId,
    user: { external_id: [hash(data.telegramId)] },
    properties: { content_name: data.botName ?? 'Bot', content_type: 'product' },
  })
}

export async function sendTikTokCheckout(data: { eventId: string; value: number; planName: string; planId?: string; telegramId: string }) {
  const c = await getCfg()
  if (!c.pixelId || !c.accessToken || !c.trackCheckout) return
  await fire(c.pixelId, c.accessToken, c.testEventCode, {
    event: 'InitiateCheckout',
    event_time: Math.floor(Date.now() / 1000),
    event_id: data.eventId,
    user: { external_id: [hash(data.telegramId)] },
    properties: {
      value: data.value, currency: 'BRL',
      content_id: data.planId ?? data.planName,
      content_name: data.planName, content_type: 'product',
    },
  })
}
