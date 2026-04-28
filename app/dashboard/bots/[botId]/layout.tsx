import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromCookies } from '@/lib/session'
import { BotDetailShell } from './bot-detail-shell'

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ botId: string }>
}

export default async function BotDetailLayout({ children, params }: LayoutProps) {
  const { botId } = await params
  const cookieStore = await cookies()
  const session = await getSessionFromCookies(cookieStore)

  let query = supabaseAdmin
    .from('bots')
    .select('id, name, is_active, bot_type')
    .eq('id', botId)

  // Ensure user can only access their own bots
  if (session?.type === 'user') {
    query = query.eq('saas_user_id', session.userId!)
  }

  const { data: bot } = await query.single()
  if (!bot) notFound()

  return (
    <BotDetailShell bot={bot}>
      {children}
    </BotDetailShell>
  )
}
