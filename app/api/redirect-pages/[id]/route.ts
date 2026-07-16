import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromRequest } from '@/lib/session'

const ALLOWED_FIELDS = [
  'slug', 'bot_id', 'name', 'bio', 'photo_url', 'button_text', 'bot_link', 'theme',
  'show_countdown', 'countdown_minutes', 'show_verification', 'highlights', 'is_active',
] as const

async function assertOwnsPage(session: NonNullable<Awaited<ReturnType<typeof getSessionFromRequest>>>, id: string) {
  const { data: page } = await supabaseAdmin.from('redirect_pages').select('saas_user_id').eq('id', id).single()
  if (!page) return { ok: false as const, status: 404, error: 'Página não encontrada' }
  if (session.type === 'admin') return { ok: true as const }
  if (page.saas_user_id !== session.userId) return { ok: false as const, status: 403, error: 'Forbidden' }
  return { ok: true as const }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const ownership = await assertOwnsPage(session, id)
  if (!ownership.ok) return NextResponse.json({ error: ownership.error }, { status: ownership.status })

  const body = await request.json()
  const update: Record<string, unknown> = {}
  for (const key of ALLOWED_FIELDS) {
    if (key in body) update[key] = body[key]
  }

  const { data, error } = await supabaseAdmin
    .from('redirect_pages')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const ownership = await assertOwnsPage(session, id)
  if (!ownership.ok) return NextResponse.json({ error: ownership.error }, { status: ownership.status })

  const { error } = await supabaseAdmin
    .from('redirect_pages')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
