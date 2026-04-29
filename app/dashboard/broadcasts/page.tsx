export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromCookies, getUserBotIds } from '@/lib/session'
import { PostagensClient } from './postagens-client'

export default async function BroadcastsPage() {
  const cookieStore = await cookies()
  const session = await getSessionFromCookies(cookieStore)

  let botIds: string[] | null = null
  if (session?.type === 'user') {
    botIds = await getUserBotIds(session.userId!)
    if (botIds.length === 0) {
      return (
        <PostagensClient
          broadcasts={[]}
          scheduledPosts={[]}
          bots={[]}
          groups={[]}
        />
      )
    }
  }

  let broadcastsQ = supabaseAdmin.from('broadcasts').select('*, bot:bots(name)').order('created_at', { ascending: false })
  let botsQ = supabaseAdmin.from('bots').select('id, name, telegram_token').eq('is_active', true).order('name')
  let scheduledPostsQ = supabaseAdmin.from('scheduled_posts').select('*, bot:bots(id, name)').order('scheduled_at', { ascending: false })

  if (botIds !== null) {
    broadcastsQ = broadcastsQ.in('bot_id', botIds)
    botsQ = botsQ.in('id', botIds)
    scheduledPostsQ = scheduledPostsQ.in('bot_id', botIds)
  }

  const [
    { data: broadcasts },
    { data: bots },
    { data: scheduledPosts },
    { data: groups },
  ] = await Promise.all([
    broadcastsQ,
    botsQ,
    scheduledPostsQ,
    supabaseAdmin.from('telegram_groups').select('telegram_chat_id, title, type').order('title'),
  ])

  return (
    <PostagensClient
      broadcasts={broadcasts ?? []}
      scheduledPosts={scheduledPosts ?? []}
      bots={bots ?? []}
      groups={groups ?? []}
    />
  )
}
