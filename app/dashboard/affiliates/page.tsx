export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/lib/supabase'
import { AffiliatesClient } from './affiliates-client'

export default async function AffiliatesPage() {
  const [{ data: affiliates }, { data: bots }] = await Promise.all([
    supabaseAdmin.from('affiliates').select('*').order('created_at', { ascending: false }),
    supabaseAdmin.from('bots').select('id, name').eq('is_active', true).order('name'),
  ])
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? ''
  return <AffiliatesClient initialAffiliates={affiliates ?? []} bots={bots ?? []} baseUrl={baseUrl} />
}
