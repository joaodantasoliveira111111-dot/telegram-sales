import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendMessage, sendMediaToChat } from '@/lib/telegram'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const h = request.headers.get('authorization')
  const s = process.env.CRON_SECRET
  if (s && h !== `Bearer ${s}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date().toISOString()

  const { data: posts, error } = await supabaseAdmin
    .from('scheduled_posts')
    .select('*, bot:bots(telegram_token)')
    .eq('status', 'pending')
    .lte('scheduled_at', now)
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let sent = 0
  let failed = 0

  for (const post of posts ?? []) {
    const token = post.bot?.telegram_token as string | undefined
    if (!token) continue

    try {
      if (post.media_url && post.media_type) {
        await sendMediaToChat(token, post.chat_id, post.media_url, post.media_type, post.message_text ?? undefined)
      } else if (post.message_text) {
        await sendMessage(token, post.chat_id, post.message_text)
      }
      await supabaseAdmin.from('scheduled_posts').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', post.id)
      sent++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      await supabaseAdmin.from('scheduled_posts').update({ status: 'failed', error_msg: msg }).eq('id', post.id)
      failed++
    }
  }

  return NextResponse.json({ ok: true, sent, failed })
}
