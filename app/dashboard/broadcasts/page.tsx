export const dynamic = 'force-dynamic'

import { supabaseAdmin } from '@/lib/supabase'
import { PostagensClient } from './postagens-client'

export default async function BroadcastsPage() {
  const [
    { data: broadcasts },
    { data: bots },
    { data: scheduledPosts },
    { data: groups },
  ] = await Promise.all([
    supabaseAdmin.from('broadcasts').select('*, bot:bots(name)').order('created_at', { ascending: false }),
    supabaseAdmin.from('bots').select('id, name, telegram_token').eq('is_active', true).order('name'),
    supabaseAdmin.from('scheduled_posts').select('*, bot:bots(id, name)').order('scheduled_at', { ascending: false }),
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
