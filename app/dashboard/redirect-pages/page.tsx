export const dynamic = 'force-dynamic'

import { supabaseAdmin } from '@/lib/supabase'
import { RedirectPageClient } from './redirect-page-client'

export default async function RedirectPagesPage() {
  const [{ data: pages }, { data: bots }] = await Promise.all([
    supabaseAdmin
      .from('redirect_pages')
      .select('*')
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('bots')
      .select('id, name')
      .order('name'),
  ])

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? ''

  return (
    <RedirectPageClient
      initialPages={pages ?? []}
      bots={bots ?? []}
      baseUrl={baseUrl}
    />
  )
}
