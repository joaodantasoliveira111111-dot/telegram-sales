export const dynamic = 'force-dynamic'

import { supabaseAdmin } from '@/lib/supabase'
import { BroadcastList } from './broadcast-list'

export default async function BroadcastsPage() {
  const [{ data: broadcasts }, { data: bots }] = await Promise.all([
    supabaseAdmin
      .from('broadcasts')
      .select('*, bot:bots(name)')
      .order('created_at', { ascending: false }),
    supabaseAdmin.from('bots').select('id, name, telegram_token').eq('is_active', true),
  ])

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-100">Transmissões</h2>
        <p className="text-sm text-zinc-500">
          Envie mensagens, fotos ou vídeos para seus usuários segmentados
        </p>
      </div>
      <BroadcastList initialBroadcasts={broadcasts ?? []} bots={bots ?? []} />
    </div>
  )
}
