export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { MessagesEditor } from '@/app/dashboard/messages/messages-editor'
import { MESSAGE_KEYS } from '@/lib/messages'

interface PageProps {
  params: Promise<{ botId: string }>
}

export default async function BotMessagesPage({ params }: PageProps) {
  const { botId } = await params

  const [{ data: bot }, { data: saved }] = await Promise.all([
    supabaseAdmin.from('bots').select('id, name, bot_type, flow_type').eq('id', botId).single(),
    supabaseAdmin.from('bot_messages').select('message_key, content').eq('bot_id', botId),
  ])

  if (!bot) notFound()

  const customMap = Object.fromEntries((saved ?? []).map((m) => [m.message_key, m.content]))

  const messages = Object.entries(MESSAGE_KEYS).map(([key, meta]) => ({
    key,
    label: meta.label,
    description: meta.description,
    vars: meta.vars,
    default: meta.default,
    content: customMap[key] ?? meta.default,
    customized: !!customMap[key],
  }))

  return (
    <MessagesEditor
      botId={bot.id}
      botName={bot.name}
      botType={(bot as Record<string, unknown>).bot_type as string ?? 'channel_link'}
      flowType={(bot as Record<string, unknown>).flow_type as string ?? 'direct'}
      initialMessages={messages}
    />
  )
}
