export const dynamic = 'force-dynamic'

import { supabaseAdmin } from '@/lib/supabase'
import { BotsList } from './bots-list'

export default async function BotsPage() {
  const { data: bots } = await supabaseAdmin
    .from('bots')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bots</h2>
          <p className="text-sm text-zinc-400">Gerencie seus bots do Telegram</p>
        </div>
      </div>
      <BotsList initialBots={bots ?? []} />
    </div>
  )
}
