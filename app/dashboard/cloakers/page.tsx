export const dynamic = 'force-dynamic'

import { supabaseAdmin } from '@/lib/supabase'
import { CloakerClient } from './cloaker-client'

export default async function CloakersPage() {
  const [{ data: cloakers }, { data: bots }] = await Promise.all([
    supabaseAdmin
      .from('cloakers')
      .select('*, bot:bots(id, name)')
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('bots')
      .select('id, name')
      .eq('is_active', true)
      .order('name'),
  ])

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? ''

  return (
    <CloakerClient
      initialCloakers={cloakers ?? []}
      bots={bots ?? []}
      baseUrl={baseUrl}
    />
  )
}
