export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/lib/supabase'
import { CrmClient } from './crm-client'

export default async function CrmPage() {
  const { data: bots } = await supabaseAdmin.from('bots').select('id, name').eq('is_active', true).order('name')
  return <CrmClient bots={bots ?? []} />
}
