import { supabaseAdmin } from './supabase'

export async function getSetting(key: string): Promise<string> {
  const { data } = await supabaseAdmin
    .from('settings')
    .select('value')
    .eq('key', key)
    .maybeSingle()
  return data?.value ?? ''
}

export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  const { data } = await supabaseAdmin
    .from('settings')
    .select('key, value')
    .in('key', keys)
  return Object.fromEntries((data ?? []).map((r) => [r.key, r.value ?? '']))
}

export async function setSettings(settings: Record<string, string>): Promise<void> {
  const rows = Object.entries(settings).map(([key, value]) => ({
    key,
    value,
    updated_at: new Date().toISOString(),
  }))
  await supabaseAdmin.from('settings').upsert(rows, { onConflict: 'key' })
}
