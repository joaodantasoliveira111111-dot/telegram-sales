import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { BotDetailShell } from './bot-detail-shell'

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ botId: string }>
}

export default async function BotDetailLayout({ children, params }: LayoutProps) {
  const { botId } = await params

  const { data: bot } = await supabaseAdmin
    .from('bots')
    .select('id, name, is_active, bot_type')
    .eq('id', botId)
    .single()

  if (!bot) notFound()

  return (
    <BotDetailShell bot={bot}>
      {children}
    </BotDetailShell>
  )
}
