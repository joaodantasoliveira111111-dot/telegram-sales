import { getSettings } from './settings'

const MP_URL = 'https://www.google-analytics.com/mp/collect'

async function getCfg() {
  const s = await getSettings(['ga4_measurement_id', 'ga4_api_secret', 'ga4_track_purchase', 'ga4_track_lead'])
  return {
    measurementId: s.ga4_measurement_id || '',
    apiSecret: s.ga4_api_secret || '',
    trackPurchase: s.ga4_track_purchase !== 'false',
    trackLead: s.ga4_track_lead !== 'false',
  }
}

async function fire(measurementId: string, apiSecret: string, clientId: string, events: Array<{ name: string; params: Record<string, unknown> }>) {
  try {
    const res = await fetch(`${MP_URL}?measurement_id=${measurementId}&api_secret=${apiSecret}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, events }),
    })
    if (!res.ok) console.error('[GA4 MP] Error status', res.status)
    else console.log('[GA4 MP] Event sent')
  } catch (e) { console.error('[GA4 MP] fetch error', e) }
}

export async function sendGA4Purchase(data: { transactionId: string; value: number; planName: string; planId?: string; telegramId: string }) {
  const c = await getCfg()
  if (!c.measurementId || !c.apiSecret || !c.trackPurchase) return
  await fire(c.measurementId, c.apiSecret, `telegram_${data.telegramId}`, [{
    name: 'purchase',
    params: {
      transaction_id: data.transactionId, value: data.value, currency: 'BRL',
      items: [{ item_id: data.planId ?? data.planName, item_name: data.planName, price: data.value, quantity: 1 }],
    },
  }])
}

export async function sendGA4Lead(data: { telegramId: string; botName?: string }) {
  const c = await getCfg()
  if (!c.measurementId || !c.apiSecret || !c.trackLead) return
  await fire(c.measurementId, c.apiSecret, `telegram_${data.telegramId}`, [{
    name: 'generate_lead',
    params: { currency: 'BRL', value: 0, source: data.botName ?? 'telegram_bot' },
  }])
}

export async function sendGA4Checkout(data: { telegramId: string; value: number; planName: string; planId?: string }) {
  const c = await getCfg()
  if (!c.measurementId || !c.apiSecret) return
  await fire(c.measurementId, c.apiSecret, `telegram_${data.telegramId}`, [{
    name: 'begin_checkout',
    params: {
      value: data.value, currency: 'BRL',
      items: [{ item_id: data.planId ?? data.planName, item_name: data.planName, price: data.value, quantity: 1 }],
    },
  }])
}
