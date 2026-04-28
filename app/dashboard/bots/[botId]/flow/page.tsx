export const dynamic = 'force-dynamic'

import { supabaseAdmin } from '@/lib/supabase'
import { FlowEditorClient } from './flow-editor-client'
import { BotDetailShell } from '../bot-detail-shell'

interface PageProps {
  params: Promise<{ botId: string }>
}

export default async function FlowPage({ params }: PageProps) {
  const { botId } = await params

  const [{ data: bot }, { data: plans }] = await Promise.all([
    supabaseAdmin.from('bots').select('id, name, is_active, bot_type, flow_config').eq('id', botId).single(),
    supabaseAdmin.from('plans').select('id, name, price').eq('bot_id', botId).order('price', { ascending: true }),
  ])

  if (!bot) return <div className="text-slate-400">Bot não encontrado.</div>

  return (
    <BotDetailShell bot={bot}>
      <FlowEditorClient
        botId={botId}
        initialFlowConfig={bot.flow_config}
        plans={plans ?? []}
      />
    </BotDetailShell>
  )
}
