import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('redirect_pages')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  const { name, bot_link } = body
  if (!name) return NextResponse.json({ error: 'name é obrigatório' }, { status: 400 })
  if (!bot_link) return NextResponse.json({ error: 'bot_link é obrigatório' }, { status: 400 })

  const slug = body.slug ? body.slug : slugify(name) + '-' + Math.random().toString(36).slice(2, 6)

  const { data, error } = await supabaseAdmin
    .from('redirect_pages')
    .insert({
      slug,
      bot_id: body.bot_id ?? null,
      name,
      bio: body.bio ?? '',
      photo_url: body.photo_url ?? null,
      button_text: body.button_text ?? 'Abrir no Telegram',
      bot_link,
      theme: body.theme ?? 'dark',
      show_countdown: body.show_countdown ?? false,
      countdown_minutes: body.countdown_minutes ?? 15,
      show_verification: body.show_verification ?? false,
      highlights: body.highlights ?? [],
      is_active: body.is_active ?? true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
