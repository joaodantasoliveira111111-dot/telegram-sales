import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromRequest } from '@/lib/session'

function randomSlug(len = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let query = supabaseAdmin
    .from('cloakers')
    .select('*, bot:bots(id, name)')
    .order('created_at', { ascending: false })

  if (session.type === 'user') {
    query = query.eq('saas_user_id', session.userId!)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { bot_id, name, destination_url, safe_url, slug: customSlug, allowed_countries } = body

  if (!name || !destination_url || !safe_url) {
    return NextResponse.json({ error: 'Campos obrigatórios: nome, URL de destino, URL segura' }, { status: 400 })
  }

  let slug = (customSlug ?? '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '') || randomSlug()
  const { data: existing } = await supabaseAdmin.from('cloakers').select('id').eq('slug', slug).maybeSingle()
  if (existing) slug = randomSlug()

  const countries = Array.isArray(allowed_countries) && allowed_countries.length > 0 ? allowed_countries : null

  const { data, error } = await supabaseAdmin
    .from('cloakers')
    .insert({
      bot_id: bot_id ?? null,
      name, destination_url, safe_url, slug,
      allowed_countries: countries,
      saas_user_id: session.type === 'user' ? session.userId : null,
    })
    .select('*, bot:bots(id, name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
