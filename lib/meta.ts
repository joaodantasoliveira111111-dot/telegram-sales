import crypto from 'crypto'
import { getSettings } from './settings'

const API_VERSION = 'v19.0'

function hash(value: string): string {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

async function getPixelConfig() {
  const s = await getSettings([
    'meta_pixel_id',
    'meta_access_token',
    'meta_test_event_code',
    'meta_track_purchase',
    'meta_track_initiate_checkout',
    'meta_track_view_content',
  ])
  return {
    pixelId: s.meta_pixel_id || process.env.META_PIXEL_ID || '',
    accessToken: s.meta_access_token || process.env.META_ACCESS_TOKEN || '',
    testEventCode: s.meta_test_event_code || process.env.META_TEST_EVENT_CODE || '',
    trackPurchase: s.meta_track_purchase !== 'false',
    trackInitiateCheckout: s.meta_track_initiate_checkout !== 'false',
    trackViewContent: s.meta_track_view_content === 'true',
  }
}

async function sendEvent(pixelId: string, accessToken: string, testEventCode: string, event: Record<string, unknown>) {
  const body: Record<string, unknown> = {
    data: [event],
    access_token: accessToken,
  }
  if (testEventCode) body.test_event_code = testEventCode

  const res = await fetch(
    `https://graph.facebook.com/${API_VERSION}/${pixelId}/events`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  )
  const result = await res.json()
  if (!res.ok) {
    console.error('[Meta CAPI] Error:', result)
  } else {
    console.log('[Meta CAPI] Events received:', result.events_received)
  }
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
  const cfg = await getPixelConfig()
  if (!cfg.pixelId || !cfg.accessToken || !cfg.trackPurchase) return

  await sendEvent(cfg.pixelId, cfg.accessToken, cfg.testEventCode, {
    event_name: 'Purchase',
    event_time: Math.floor(Date.now() / 1000),
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
      contents: [{ id: data.planName, quantity: 1, item_price: data.value }],
    },
  })
}

interface InitiateCheckoutData {
  eventId: string
  value: number
  planName: string
  telegramId: string
}

export async function sendInitiateCheckoutEvent(data: InitiateCheckoutData) {
  const cfg = await getPixelConfig()
  if (!cfg.pixelId || !cfg.accessToken || !cfg.trackInitiateCheckout) return

  await sendEvent(cfg.pixelId, cfg.accessToken, cfg.testEventCode, {
    event_name: 'InitiateCheckout',
    event_time: Math.floor(Date.now() / 1000),
    event_id: data.eventId,
    action_source: 'other',
    user_data: {
      external_id: [hash(data.telegramId)],
    },
    custom_data: {
      value: data.value,
      currency: 'BRL',
      content_name: data.planName,
      content_type: 'product',
    },
  })
}

interface ViewContentData {
  eventId: string
  telegramId: string
  botName?: string
}

export async function sendViewContentEvent(data: ViewContentData) {
  const cfg = await getPixelConfig()
  if (!cfg.pixelId || !cfg.accessToken || !cfg.trackViewContent) return

  await sendEvent(cfg.pixelId, cfg.accessToken, cfg.testEventCode, {
    event_name: 'ViewContent',
    event_time: Math.floor(Date.now() / 1000),
    event_id: data.eventId,
    action_source: 'other',
    user_data: {
      external_id: [hash(data.telegramId)],
    },
    custom_data: {
      content_name: data.botName ?? 'Bot',
      content_type: 'product',
    },
  })
}
