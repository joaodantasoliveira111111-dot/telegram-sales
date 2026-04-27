export const dynamic = 'force-dynamic'

import { supabaseAdmin } from '@/lib/supabase'
import { BotPlansList } from './bot-plans-list'

interface PageProps {
  params: Promise<{ botId: string }>
}

export default async function BotPlansPage({ params }: PageProps) {
  const { botId } = await params

  const [{ data: plans }, { data: bot }] = await Promise.all([
    supabaseAdmin
      .from('plans')
      .select('*')
      .eq('bot_id', botId)
      .order('price', { ascending: true }),
    supabaseAdmin
      .from('bots')
      .select('id, name')
      .eq('id', botId)
      .single(),
  ])

  return <BotPlansList botId={botId} botName={bot?.name ?? ''} initialPlans={plans ?? []} />
}
