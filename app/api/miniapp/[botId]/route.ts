import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { DEFAULT_MINIAPP_CONFIG, MiniAppConfig } from '@/types'

// Public storefront data — no session required, this is what powers the
// Telegram Mini App page. Only ever returns display-safe fields (no tokens,
// no internal ids beyond what's needed to check out).
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  const { botId } = await params

  const { data: bot } = await supabaseAdmin
    .from('bots')
    .select('id, name, is_active, miniapp_config')
    .eq('id', botId)
    .single()

  if (!bot || !bot.is_active) return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })

  const config: MiniAppConfig = {
    ...DEFAULT_MINIAPP_CONFIG,
    store_name: bot.name,
    ...(bot.miniapp_config ?? {}),
  }

  if (!config.enabled) return NextResponse.json({ error: 'Loja não está ativa' }, { status: 404 })

  const { data: plans } = await supabaseAdmin
    .from('plans')
    .select('id, name, price, duration_days, button_text, content_type, miniapp_category, miniapp_icon, miniapp_featured_label, miniapp_sort')
    .eq('bot_id', botId)
    .eq('miniapp_visible', true)
    .order('miniapp_sort', { ascending: true })

  return NextResponse.json({ config, products: plans ?? [] })
}
