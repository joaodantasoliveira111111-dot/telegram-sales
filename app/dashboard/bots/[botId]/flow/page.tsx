export const dynamic = 'force-dynamic'

import { supabaseAdmin } from '@/lib/supabase'
import { FlowEditorClient } from './flow-editor-client'
import { BotDetailShell } from '../bot-detail-shell'

interface PageProps {
  params: Promise<{ botId: string }>
}

export default async function FlowPage({ params }: PageProps) {
  const { botId } = await params

  const { data: bot } = await supabaseAdmin
    .from('bots')
    .select('id, name, is_active, bot_type, flow_config')
    .eq('id', botId)
    .single()

  if (!bot) return <div className="text-slate-400">Bot não encontrado.</div>

  return (
    <BotDetailShell bot={bot}>
      <FlowEditorClient botId={botId} initialFlowConfig={bot.flow_config} />
    </BotDetailShell>
  )
}
