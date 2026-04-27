export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { BotForm } from '../bot-form'
import { Bot } from '@/types'

interface PageProps {
  params: Promise<{ botId: string }>
}

export default async function BotSettingsPage({ params }: PageProps) {
  const { botId } = await params

  const { data: bot } = await supabaseAdmin
    .from('bots')
    .select('*')
    .eq('id', botId)
    .single()

  if (!bot) notFound()

  return (
    <div className="max-w-2xl">
      <BotFormClient bot={bot as Bot} />
    </div>
  )
}

// Thin client wrapper to provide onSaved/onCancel without router complexity
import { BotFormClientWrapper } from './bot-form-client-wrapper'
function BotFormClient({ bot }: { bot: Bot }) {
  return <BotFormClientWrapper bot={bot} />
}
