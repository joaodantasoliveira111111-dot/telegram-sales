export const dynamic = 'force-dynamic'

import { supabaseAdmin } from '@/lib/supabase'
import { MESSAGE_KEYS } from '@/lib/messages'
import { MessagesEditor } from './messages-editor'
import { MessageSquare } from 'lucide-react'

async function getData() {
  const { data: bots } = await supabaseAdmin
    .from('bots')
    .select('id, name, bot_type, flow_type')
    .eq('is_active', true)
    .order('name')

  if (!bots?.length) return { bots: [] }

  // Fetch all saved messages for all bots in one query
  const { data: allSaved } = await supabaseAdmin
    .from('bot_messages')
    .select('bot_id, message_key, content')

  const savedByBot: Record<string, Record<string, string>> = {}
  for (const row of allSaved ?? []) {
    if (!savedByBot[row.bot_id]) savedByBot[row.bot_id] = {}
    savedByBot[row.bot_id][row.message_key] = row.content
  }

  const botsWithMessages = bots.map((bot) => {
    const saved = savedByBot[bot.id] ?? {}
    const messages = Object.entries(MESSAGE_KEYS).map(([key, meta]) => ({
      key,
      label: meta.label,
      description: meta.description,
      vars: meta.vars,
      default: meta.default,
      content: saved[key] ?? meta.default,
      customized: key in saved,
    }))
    return { ...bot, messages }
  })

  return { bots: botsWithMessages }
}

export default async function MessagesPage() {
  const { bots } = await getData()

  if (!bots.length) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-100">Mensagens do Bot</h2>
          <p className="text-sm text-zinc-500">Personalize todas as mensagens enviadas pelo bot</p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 py-16 text-center">
          <MessageSquare className="mb-3 h-10 w-10 text-zinc-600" />
          <p className="text-zinc-400">Nenhum bot cadastrado</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-100">Mensagens do Bot</h2>
        <p className="text-sm text-zinc-500">
          Personalize todas as mensagens enviadas pelo bot. Clique nas variáveis para inserir no cursor.
        </p>
      </div>

      {bots.length === 1 ? (
        <MessagesEditor
          botId={bots[0].id}
          botName={bots[0].name}
          botType={(bots[0] as Record<string, unknown>).bot_type as string ?? 'channel_link'}
          flowType={(bots[0] as Record<string, unknown>).flow_type as string ?? 'direct'}
          initialMessages={bots[0].messages}
        />
      ) : (
        <div className="space-y-10">
          {bots.map((bot) => (
            <div key={bot.id}>
              <div className="mb-4 border-b border-zinc-800 pb-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">{bot.name}</p>
              </div>
              <MessagesEditor
                botId={bot.id}
                botName={bot.name}
                botType={(bot as Record<string, unknown>).bot_type as string ?? 'channel_link'}
                flowType={(bot as Record<string, unknown>).flow_type as string ?? 'direct'}
                initialMessages={bot.messages}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
