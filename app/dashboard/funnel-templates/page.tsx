export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/lib/supabase'
import { FUNNEL_TEMPLATES } from '@/lib/funnel-templates'
import { FunnelTemplatesClient } from './funnel-templates-client'

export default async function FunnelTemplatesPage() {
  const { data: bots } = await supabaseAdmin.from('bots').select('id, name').eq('is_active', true).order('name')
  return <FunnelTemplatesClient templates={FUNNEL_TEMPLATES} bots={bots ?? []} />
}
