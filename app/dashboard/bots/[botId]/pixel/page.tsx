export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { BotPixelForm } from './bot-pixel-form'

interface PageProps {
  params: Promise<{ botId: string }>
}

export default async function BotPixelPage({ params }: PageProps) {
  const { botId } = await params

  const { data: bot } = await supabaseAdmin
    .from('bots')
    .select(`id, name,
      meta_pixel_id, meta_access_token, meta_test_event_code,
      tiktok_pixel_id, tiktok_access_token,
      ga4_measurement_id, ga4_api_secret,
      gtm_container_id,
      kwai_pixel_id, kwai_access_token`)
    .eq('id', botId)
    .single()

  if (!bot) notFound()

  return (
    <BotPixelForm
      botId={bot.id}
      initialValues={{
        meta_pixel_id: bot.meta_pixel_id ?? '',
        meta_access_token: bot.meta_access_token ?? '',
        meta_test_event_code: bot.meta_test_event_code ?? '',
        tiktok_pixel_id: bot.tiktok_pixel_id ?? '',
        tiktok_access_token: bot.tiktok_access_token ?? '',
        ga4_measurement_id: bot.ga4_measurement_id ?? '',
        ga4_api_secret: bot.ga4_api_secret ?? '',
        gtm_container_id: bot.gtm_container_id ?? '',
        kwai_pixel_id: bot.kwai_pixel_id ?? '',
        kwai_access_token: bot.kwai_access_token ?? '',
      }}
    />
  )
}
