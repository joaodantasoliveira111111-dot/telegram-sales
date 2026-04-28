export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/lib/supabase'
import { ScheduledPostsClient } from './scheduled-posts-client'

export default async function ScheduledPostsPage() {
  const [{ data: posts }, { data: bots }, { data: groups }] = await Promise.all([
    supabaseAdmin.from('scheduled_posts').select('*, bot:bots(id, name)').order('scheduled_at', { ascending: true }),
    supabaseAdmin.from('bots').select('id, name, telegram_token').eq('is_active', true).order('name'),
    supabaseAdmin.from('telegram_groups').select('telegram_chat_id, title, type').order('title'),
  ])
  return <ScheduledPostsClient initialPosts={posts ?? []} bots={bots ?? []} groups={groups ?? []} />
}
