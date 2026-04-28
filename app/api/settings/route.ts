import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { setSettings } from '@/lib/settings'
import { getSessionFromRequest } from '@/lib/session'

export const dynamic = 'force-dynamic'

// User-editable fields stored on their saas_users row
const USER_FIELDS = [
  'gateway_type', 'gateway_token',
  'meta_pixel_id', 'meta_access_token',
  'tiktok_pixel_id', 'tiktok_access_token',
  'ga4_measurement_id', 'ga4_api_secret',
  'gtm_container_id', 'kwai_pixel_id', 'kwai_access_token',
]

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (session.type === 'user') {
    const { data } = await supabaseAdmin
      .from('saas_users')
      .select(USER_FIELDS.join(', '))
      .eq('id', session.userId!)
      .single()
    return NextResponse.json(data ?? {})
  }

  // Admin: return global settings
  const { data } = await supabaseAdmin.from('settings').select('key, value').order('key')
  const map = Object.fromEntries((data ?? []).map((r) => [r.key, r.value ?? '']))
  return NextResponse.json(map)
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  if (session.type === 'user') {
    const update: Record<string, unknown> = {}
    for (const field of USER_FIELDS) {
      if (field in body) update[field] = body[field]
    }
    const { error } = await supabaseAdmin
      .from('saas_users')
      .update(update)
      .eq('id', session.userId!)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // Admin: save to global settings table
  await setSettings(body)
  return NextResponse.json({ ok: true })
}
