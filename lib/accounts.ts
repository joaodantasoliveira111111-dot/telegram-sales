import { supabaseAdmin } from './supabase'
import { AccountStock } from '@/types'

export async function reserveAccountForPlan(
  planId: string,
  paymentId: string,
  telegramId: string
): Promise<AccountStock | null> {
  const { data, error } = await supabaseAdmin.rpc('reserve_account', {
    p_plan_id: planId,
    p_payment_id: paymentId,
    p_telegram_id: telegramId,
  })
  if (error) throw error
  return (data as AccountStock[])?.[0] ?? null
}

export async function markAccountDelivered(accountId: string) {
  const { error } = await supabaseAdmin
    .from('account_stocks')
    .update({
      status: 'delivered',
      delivered_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', accountId)
  if (error) throw error
}

export async function countAvailableAccounts(planId: string): Promise<number> {
  const { count } = await supabaseAdmin
    .from('account_stocks')
    .select('id', { count: 'exact', head: true })
    .eq('plan_id', planId)
    .eq('status', 'available')
  return count ?? 0
}
