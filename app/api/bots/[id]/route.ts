import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { deleteWebhook, setWebhook } from '@/lib/telegram'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const { data, error } = await supabaseAdmin
    .from('bots')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // If toggling is_active, manage webhook
  if (typeof body.is_active === 'boolean' && data) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    if (body.is_active && baseUrl) {
      await setWebhook(data.telegram_token, `${baseUrl}/api/telegram/${id}`)
    } else if (!body.is_active) {
      await deleteWebhook(data.telegram_token)
    }
  }

  return NextResponse.json(data)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { data: bot } = await supabaseAdmin
    .from('bots')
    .select('telegram_token')
    .eq('id', id)
    .single()

  if (bot) {
    await deleteWebhook(bot.telegram_token)
  }

  const { error } = await supabaseAdmin.from('bots').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
