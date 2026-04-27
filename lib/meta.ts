import crypto from 'crypto'
import { getSettings } from './settings'

const API_VERSION = 'v19.0'
const EVENT_SOURCE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://telegram-sales.vercel.app'

function hash(value: string): string {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

function hashPhone(phone: string): string {
  // Normalize: keep only digits, ensure country code 55 for Brazil
  const digits = phone.replace(/\D/g, '')
  const normalized = digits.startsWith('55') ? digits : `55${digits}`
  return hash(normalized)
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

async function sendEvent(
  pixelId: string,
  accessToken: string,
  testEventCode: string,
  event: Record<string, unknown>
) {
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

// Build user_data — only include fields we actually have (no fake data)
function buildUserData(opts: {
  telegramId: string
  firstName?: string
  email?: string
  phone?: string
}) {
  const ud: Record<string, unknown> = {
    external_id: [hash(opts.telegramId)],
    country: [hash('br')],
  }
  // Only add email if it looks real (not our fake telegram_ placeholder)
  if (opts.email && !opts.email.startsWith('telegram_')) {
    ud.em = [hash(opts.email)]
  }
  // Only add phone if it looks real (not hardcoded placeholder)
  if (opts.phone && opts.phone !== '11999999999') {
    ud.ph = [hashPhone(opts.phone)]
  }
  if (opts.firstName) {
    ud.fn = [hash(opts.firstName)]
  }
  return ud
}

// ─── Purchase ────────────────────────────────────────────────────────────────

interface PurchaseEventData {
  eventId: string
  value: number
  planName: string
  planId?: string
  paymentId?: string
  telegramId: string
  firstName?: string
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
    event_source_url: EVENT_SOURCE_URL,
    action_source: 'other',
    user_data: buildUserData({
      telegramId: data.telegramId,
      firstName: data.firstName,
      email: data.email,
      phone: data.phone,
    }),
    custom_data: {
      value: data.value,
      currency: 'BRL',
      content_name: data.planName,
      content_ids: [data.planId ?? data.planName],
      content_type: 'product',
      num_items: 1,
      order_id: data.paymentId,
      contents: [{ id: data.planId ?? data.planName, quantity: 1, item_price: data.value }],
    },
  })
}

// ─── InitiateCheckout ─────────────────────────────────────────────────────────

interface InitiateCheckoutData {
  eventId: string
  value: number
  planName: string
  planId?: string
  telegramId: string
  firstName?: string
}

export async function sendInitiateCheckoutEvent(data: InitiateCheckoutData) {
  const cfg = await getPixelConfig()
  if (!cfg.pixelId || !cfg.accessToken || !cfg.trackInitiateCheckout) return

  await sendEvent(cfg.pixelId, cfg.accessToken, cfg.testEventCode, {
    event_name: 'InitiateCheckout',
    event_time: Math.floor(Date.now() / 1000),
    event_id: data.eventId,
    event_source_url: EVENT_SOURCE_URL,
    action_source: 'other',
    user_data: buildUserData({
      telegramId: data.telegramId,
      firstName: data.firstName,
    }),
    custom_data: {
      value: data.value,
      currency: 'BRL',
      content_name: data.planName,
      content_ids: [data.planId ?? data.planName],
      content_type: 'product',
      num_items: 1,
      contents: [{ id: data.planId ?? data.planName, quantity: 1, item_price: data.value }],
    },
  })
}

// ─── ViewContent ──────────────────────────────────────────────────────────────

interface ViewContentData {
  eventId: string
  telegramId: string
  firstName?: string
  botName?: string
}

export async function sendViewContentEvent(data: ViewContentData) {
  const cfg = await getPixelConfig()
  if (!cfg.pixelId || !cfg.accessToken || !cfg.trackViewContent) return

  await sendEvent(cfg.pixelId, cfg.accessToken, cfg.testEventCode, {
    event_name: 'ViewContent',
    event_time: Math.floor(Date.now() / 1000),
    event_id: data.eventId,
    event_source_url: EVENT_SOURCE_URL,
    action_source: 'other',
    user_data: buildUserData({
      telegramId: data.telegramId,
      firstName: data.firstName,
    }),
    custom_data: {
      content_name: data.botName ?? 'Bot',
      content_ids: [data.botName ?? 'bot'],
      content_type: 'product',
      num_items: 1,
    },
  })
}
