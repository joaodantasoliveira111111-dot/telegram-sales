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
    .select('id, name, meta_pixel_id, meta_access_token, meta_test_event_code')
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
      }}
    />
  )
}
