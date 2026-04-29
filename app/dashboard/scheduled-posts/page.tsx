export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromCookies, getUserBotIds } from '@/lib/session'
import { ScheduledPostsClient } from './scheduled-posts-client'

export default async function ScheduledPostsPage() {
  const cookieStore = await cookies()
  const session = await getSessionFromCookies(cookieStore)

  let postsQuery = supabaseAdmin.from('scheduled_posts').select('*, bot:bots(id, name)').order('scheduled_at', { ascending: true })
  let botsQuery = supabaseAdmin.from('bots').select('id, name, telegram_token').eq('is_active', true).order('name')

  if (session?.type === 'user') {
    const botIds = await getUserBotIds(session.userId!)
    if (botIds.length === 0) {
      const { data: groups } = await supabaseAdmin.from('telegram_groups').select('telegram_chat_id, title, type').order('title')
      return <ScheduledPostsClient initialPosts={[]} bots={[]} groups={groups ?? []} />
    }
    postsQuery = postsQuery.in('bot_id', botIds)
    botsQuery = botsQuery.in('id', botIds)
  }

  const [{ data: posts }, { data: bots }, { data: groups }] = await Promise.all([
    postsQuery,
    botsQuery,
    supabaseAdmin.from('telegram_groups').select('telegram_chat_id, title, type').order('title'),
  ])
  return <ScheduledPostsClient initialPosts={posts ?? []} bots={bots ?? []} groups={groups ?? []} />
}
