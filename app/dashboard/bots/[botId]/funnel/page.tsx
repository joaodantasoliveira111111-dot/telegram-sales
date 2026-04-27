export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { FunnelClient } from './funnel-client'

interface PageProps {
  params: Promise<{ botId: string }>
}

export default async function FunnelPage({ params }: PageProps) {
  const { botId } = await params

  const { data: bot } = await supabaseAdmin
    .from('bots')
    .select('id, name, ab_test_enabled, flow_type, flow_type_b')
    .eq('id', botId)
    .single()

  if (!bot) notFound()

  return (
    <FunnelClient
      botId={bot.id}
      abEnabled={!!(bot as Record<string, unknown>).ab_test_enabled}
      flowTypeA={(bot as Record<string, unknown>).flow_type as string ?? 'direct'}
      flowTypeB={(bot as Record<string, unknown>).flow_type_b as string ?? 'direct'}
    />
  )
}
