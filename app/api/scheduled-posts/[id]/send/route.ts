import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendMessage, sendMediaToChat } from '@/lib/telegram'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { data: post, error } = await supabaseAdmin
    .from('scheduled_posts')
    .select('*, bot:bots(telegram_token)')
    .eq('id', id)
    .single()

  if (error || !post) {
    return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 })
  }

  const token = (post.bot as { telegram_token: string } | null)?.telegram_token
  if (!token) return NextResponse.json({ error: 'Bot sem token' }, { status: 400 })

  try {
    if (post.media_url && post.media_type) {
      await sendMediaToChat(token, post.chat_id, post.media_url, post.media_type, post.message_text ?? undefined)
    } else if (post.message_text) {
      await sendMessage(token, post.chat_id, post.message_text)
    }
    const now = new Date().toISOString()
    await supabaseAdmin.from('scheduled_posts').update({ status: 'sent', sent_at: now }).eq('id', id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await supabaseAdmin.from('scheduled_posts').update({ status: 'failed', error_msg: msg }).eq('id', id)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
