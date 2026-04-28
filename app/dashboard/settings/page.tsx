export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { getSettings } from '@/lib/settings'
import { getSessionFromCookies } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase'
import { SettingsForm } from './settings-form'
import { UserSettingsForm } from './user-settings-form'

const ADMIN_SETTING_KEYS = [
  'active_gateway',
  'amplopay_public_key',
  'amplopay_secret_key',
  'amplopay_webhook_token',
  'pushinpay_token',
  'meta_pixel_id',
  'meta_access_token',
  'meta_test_event_code',
  'meta_track_lead',
  'meta_track_purchase',
  'meta_track_initiate_checkout',
  'meta_track_view_content',
  'saas_billing_gateway',
  'saas_billing_gateway_token',
]

export default async function SettingsPage() {
  const cookieStore = await cookies()
  const session = await getSessionFromCookies(cookieStore)

  if (session?.type === 'user') {
    const { data: user } = await supabaseAdmin
      .from('saas_users')
      .select('name, email, phone, cpf_cnpj, plan_type, gateway_type, gateway_token, meta_pixel_id, meta_access_token, tiktok_pixel_id, tiktok_access_token, ga4_measurement_id, ga4_api_secret, gtm_container_id, kwai_pixel_id, kwai_access_token')
      .eq('id', session.userId!)
      .single()

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-100">Minha Conta</h2>
          <p className="text-sm text-zinc-500">Configurações do seu perfil e integrações</p>
        </div>
        <UserSettingsForm userId={session.userId!} initial={user ?? {}} />
      </div>
    )
  }

  const settings = await getSettings(ADMIN_SETTING_KEYS)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-zinc-100">Configurações</h2>
        <p className="text-sm text-zinc-500">Gerencie integrações, rastreamento e gateway de cobrança SaaS</p>
      </div>
      <SettingsForm initial={settings} />
    </div>
  )
}
