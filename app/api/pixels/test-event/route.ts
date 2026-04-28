import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getSettings } from '@/lib/settings'

const META_API = 'https://graph.facebook.com/v19.0'
const TIKTOK_API = 'https://business-api.tiktok.com/open_api/v1.3/event/track/'
const GA4_API = 'https://www.google-analytics.com/mp/collect'
const KWAI_API = 'https://ads.kwai.com/open-api/v1/tracking/conversions/pixel'

function hash(v: string) {
  return crypto.createHash('sha256').update(v.trim().toLowerCase()).digest('hex')
}

export async function POST(request: NextRequest) {
  const { platform, event_name } = await request.json()
  if (!platform || !event_name) return NextResponse.json({ error: 'platform e event_name obrigatórios' }, { status: 400 })

  const s = await getSettings([
    'meta_pixel_id', 'meta_access_token', 'meta_test_event_code',
    'tiktok_pixel_id', 'tiktok_access_token', 'tiktok_test_event_code',
    'ga4_measurement_id', 'ga4_api_secret',
    'kwai_pixel_id', 'kwai_access_token',
  ])

  const testUser = { external_id: [hash('test_user_123')], country: [hash('br')] }

  if (platform === 'meta') {
    const pixelId = s.meta_pixel_id || process.env.META_PIXEL_ID || ''
    const token = s.meta_access_token || process.env.META_ACCESS_TOKEN || ''
    if (!pixelId || !token) return NextResponse.json({ error: 'Pixel ID e Access Token não configurados' }, { status: 400 })
    const body: Record<string, unknown> = {
      data: [{ event_name, event_time: Math.floor(Date.now() / 1000), event_id: `test_${Date.now()}`, action_source: 'other', user_data: testUser, custom_data: event_name === 'Purchase' ? { value: 97, currency: 'BRL', content_name: 'Plano Teste' } : {} }],
      access_token: token,
    }
    if (s.meta_test_event_code) body.test_event_code = s.meta_test_event_code
    const res = await fetch(`${META_API}/${pixelId}/events`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const r = await res.json()
    if (!res.ok) return NextResponse.json({ error: r.error?.message ?? 'Meta API error' }, { status: 500 })
    return NextResponse.json({ ok: true, events_received: r.events_received })
  }

  if (platform === 'tiktok') {
    const pixelId = s.tiktok_pixel_id || ''
    const token = s.tiktok_access_token || ''
    if (!pixelId || !token) return NextResponse.json({ error: 'Pixel ID e Access Token TikTok não configurados' }, { status: 400 })
    const ttEvent = event_name === 'Purchase' ? 'CompletePayment' : event_name === 'Lead' ? 'SubmitForm' : event_name === 'InitiateCheckout' ? 'InitiateCheckout' : 'ViewContent'
    const body: Record<string, unknown> = {
      pixel_code: pixelId,
      event: ttEvent,
      event_time: Math.floor(Date.now() / 1000),
      event_id: `test_${Date.now()}`,
      user: { external_id: [hash('test_user_123')] },
      properties: event_name === 'Purchase' ? { value: 97, currency: 'BRL', content_name: 'Plano Teste', content_type: 'product' } : {},
    }
    if (s.tiktok_test_event_code) body.test_event_code = s.tiktok_test_event_code
    const res = await fetch(TIKTOK_API, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Access-Token': token }, body: JSON.stringify(body) })
    const r = await res.json()
    if (!res.ok || r.code !== 0) return NextResponse.json({ error: r.message ?? 'TikTok API error' }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (platform === 'ga4') {
    const measId = s.ga4_measurement_id || ''
    const secret = s.ga4_api_secret || ''
    if (!measId || !secret) return NextResponse.json({ error: 'Measurement ID e API Secret não configurados' }, { status: 400 })
    const ga4Event = event_name === 'Purchase' ? 'purchase' : event_name === 'Lead' ? 'generate_lead' : 'begin_checkout'
    const res = await fetch(`${GA4_API}?measurement_id=${measId}&api_secret=${secret}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: 'test_client_123', events: [{ name: ga4Event, params: { value: 97, currency: 'BRL', transaction_id: `test_${Date.now()}` } }] }),
    })
    if (!res.ok) return NextResponse.json({ error: `GA4 error ${res.status}` }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (platform === 'kwai') {
    const pixelId = s.kwai_pixel_id || ''
    const token = s.kwai_access_token || ''
    if (!pixelId || !token) return NextResponse.json({ error: 'Pixel ID e Access Token Kwai não configurados' }, { status: 400 })
    const res = await fetch(KWAI_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ pixel_id: pixelId, event_type: 'PURCHASE', event_time: Math.floor(Date.now() / 1000), event_id: `test_${Date.now()}`, user: { external_id: hash('test_user_123') }, conversion_value: { price: 97, currency: 'BRL' } }),
    })
    const r = await res.json()
    if (!res.ok) return NextResponse.json({ error: r.message ?? 'Kwai API error' }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Platform desconhecida' }, { status: 400 })
}
