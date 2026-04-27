import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { setSettings } from '@/lib/settings'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data } = await supabaseAdmin.from('settings').select('key, value').order('key')
  const map = Object.fromEntries((data ?? []).map((r) => [r.key, r.value ?? '']))
  return NextResponse.json(map)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  await setSettings(body)
  return NextResponse.json({ ok: true })
}
