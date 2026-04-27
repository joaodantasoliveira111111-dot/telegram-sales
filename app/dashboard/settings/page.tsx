export const dynamic = 'force-dynamic'

import { getSettings } from '@/lib/settings'
import { SettingsForm } from './settings-form'

const SETTING_KEYS = [
  'amplopay_public_key',
  'amplopay_secret_key',
  'amplopay_webhook_token',
  'meta_pixel_id',
  'meta_access_token',
  'meta_test_event_code',
  'meta_track_purchase',
  'meta_track_initiate_checkout',
  'meta_track_view_content',
]

export default async function SettingsPage() {
  const settings = await getSettings(SETTING_KEYS)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-zinc-100">Configurações</h2>
        <p className="text-sm text-zinc-500">Gerencie suas integrações e rastreamento</p>
      </div>
      <SettingsForm initial={settings} />
    </div>
  )
}
