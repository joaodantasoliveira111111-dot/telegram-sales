export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromCookies } from '@/lib/session'
import { UsersClient } from './users-client'

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; plan?: string; status?: string; q?: string }>
}) {
  const cookieStore = await cookies()
  const session = await getSessionFromCookies(cookieStore)
  if (session?.type === 'user') redirect('/dashboard')

  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1'))
  const limit = 20
  const offset = (page - 1) * limit

  // Stats
  const { data: allUsers } = await supabaseAdmin
    .from('saas_users')
    .select('id, plan_type, is_active, pending_fee_total, payout_pending, payout_total_released, created_at')

  const stats = {
    total: allUsers?.length ?? 0,
    active: allUsers?.filter(u => u.is_active).length ?? 0,
    pendingFees: allUsers?.reduce((a, u) => a + (u.pending_fee_total ?? 0), 0) ?? 0,
    payoutPending: allUsers?.reduce((a, u) => a + (u.payout_pending ?? 0), 0) ?? 0,
    totalReleased: allUsers?.reduce((a, u) => a + (u.payout_total_released ?? 0), 0) ?? 0,
  }

  // Paginated users
  let query = supabaseAdmin
    .from('saas_users')
    .select('id, name, email, phone, cpf_cnpj, plan_type, is_active, sales_count_cycle, pending_fee_total, payout_pending, payout_total_released, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (params.plan) query = query.eq('plan_type', params.plan)
  if (params.status === 'active') query = query.eq('is_active', true)
  if (params.status === 'inactive') query = query.eq('is_active', false)
  if (params.q) query = query.or(`name.ilike.%${params.q}%,email.ilike.%${params.q}%`)

  const { data: users, count } = await query

  return (
    <UsersClient
      users={users ?? []}
      total={count ?? 0}
      page={page}
      limit={limit}
      stats={stats}
      filters={{ plan: params.plan, status: params.status, q: params.q }}
    />
  )
}
