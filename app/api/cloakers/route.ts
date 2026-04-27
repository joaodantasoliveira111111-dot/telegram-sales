import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function randomSlug(len = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('cloakers')
    .select('*, bot:bots(id, name)')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { bot_id, name, destination_url, safe_url, slug: customSlug } = body

  if (!name || !destination_url || !safe_url) {
    return NextResponse.json({ error: 'Campos obrigatórios: nome, URL de destino, URL segura' }, { status: 400 })
  }

  // Use custom slug or generate one; ensure uniqueness
  let slug = (customSlug ?? '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '') || randomSlug()

  // Check slug collision
  const { data: existing } = await supabaseAdmin
    .from('cloakers').select('id').eq('slug', slug).maybeSingle()
  if (existing) slug = randomSlug()

  const { data, error } = await supabaseAdmin
    .from('cloakers')
    .insert({ bot_id: bot_id ?? null, name, destination_url, safe_url, slug })
    .select('*, bot:bots(id, name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
