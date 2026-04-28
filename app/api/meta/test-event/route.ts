import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getSettings } from '@/lib/settings'

const API_VERSION = 'v19.0'

export async function POST(request: NextRequest) {
  const { event_name } = await request.json()
  if (!event_name) return NextResponse.json({ error: 'event_name required' }, { status: 400 })

  const s = await getSettings(['meta_pixel_id', 'meta_access_token', 'meta_test_event_code'])
  const pixelId = s.meta_pixel_id || process.env.META_PIXEL_ID || ''
  const accessToken = s.meta_access_token || process.env.META_ACCESS_TOKEN || ''
  const testEventCode = s.meta_test_event_code || process.env.META_TEST_EVENT_CODE || ''

  if (!pixelId || !accessToken) {
    return NextResponse.json({ error: 'Pixel ID e Access Token não configurados' }, { status: 400 })
  }

  const body: Record<string, unknown> = {
    data: [{
      event_name,
      event_time: Math.floor(Date.now() / 1000),
      event_id: `test_${event_name}_${Date.now()}`,
      action_source: 'other',
      user_data: {
        external_id: ['test_user_123'],
        country: [crypto.createHash('sha256').update('br').digest('hex')],
      },
      custom_data: event_name === 'Purchase' ? { value: 97, currency: 'BRL', content_name: 'Plano Teste' } : {},
    }],
    access_token: accessToken,
  }
  if (testEventCode) body.test_event_code = testEventCode

  const res = await fetch(
    `https://graph.facebook.com/${API_VERSION}/${pixelId}/events`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  )
  const result = await res.json()
  if (!res.ok) return NextResponse.json({ error: result.error?.message ?? 'Meta API error' }, { status: 500 })
  return NextResponse.json({ ok: true, events_received: result.events_received })
}
