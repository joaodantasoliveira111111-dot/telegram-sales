import { supabaseAdmin } from './supabase'
import { AccountStock, Plan } from '@/types'
import { getBotMessage, buildAccountStockMessage } from './messages'

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

// Builds the "your access is ready" message for a delivered account_stock item,
// using the plan's custom product type (arbitrary fields) when set, or the
// legacy fixed login/password template otherwise.
export async function buildAccountDeliveryMessage(
  botId: string,
  plan: Pick<Plan, 'name' | 'product_type_id'>,
  account: AccountStock
): Promise<string> {
  const warrantyDays = account.warranty_until
    ? Math.ceil((new Date(account.warranty_until).getTime() - Date.now()) / 86400000)
    : null

  if (plan.product_type_id) {
    const { data: productType } = await supabaseAdmin
      .from('product_types')
      .select('*')
      .eq('id', plan.product_type_id)
      .single()
    if (productType) return buildAccountStockMessage(productType, account, plan.name, warrantyDays)
  }

  return getBotMessage(botId, 'payment_confirmed_account', {
    nome: '',
    plano: plan.name,
    login: account.login ?? '',
    senha: account.password ?? '',
    extra: account.extra_info ? `📋 Extra: <code>${account.extra_info}</code>` : '',
    garantia: warrantyDays ? `- Garantia de funcionamento por <b>${warrantyDays} dias</b>` : '',
  })
}
