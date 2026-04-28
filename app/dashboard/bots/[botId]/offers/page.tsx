export const dynamic = 'force-dynamic'

import { supabaseAdmin } from '@/lib/supabase'
import { OfferList } from '@/app/dashboard/offers/offer-list'

interface PageProps {
  params: Promise<{ botId: string }>
}

export default async function BotOffersPage({ params }: PageProps) {
  const { botId } = await params

  const [{ data: offers }, { data: bot }, { data: plans }] = await Promise.all([
    supabaseAdmin
      .from('offers')
      .select('*, bot:bots(name), trigger_plan:plans!offers_trigger_plan_id_fkey(name, price), offer_plan:plans!offers_offer_plan_id_fkey(name, price)')
      .eq('bot_id', botId)
      .order('created_at', { ascending: false }),
    supabaseAdmin.from('bots').select('id, name').eq('id', botId).single(),
    supabaseAdmin.from('plans').select('id, name, price, bot_id').eq('bot_id', botId),
  ])

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-100">Upsell & Downsell</h2>
        <p className="text-sm text-slate-500 mt-1">
          Configure ofertas automáticas para aumentar o ticket médio deste bot.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-xl p-4" style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)' }}>
          <h3 className="mb-1 font-semibold text-blue-400 text-sm">📈 Upsell</h3>
          <p className="text-xs text-slate-400">
            Enviado automaticamente após o pagamento. Oferece um plano melhor para quem acabou de comprar.
          </p>
        </div>
        <div className="rounded-xl p-4" style={{ background: 'rgba(251,146,60,0.05)', border: '1px solid rgba(251,146,60,0.15)' }}>
          <h3 className="mb-1 font-semibold text-orange-400 text-sm">📉 Downsell</h3>
          <p className="text-xs text-slate-400">
            Dispare via Transmissões (alvo: Não pagaram) com uma oferta mais acessível para converter leads frios.
          </p>
        </div>
      </div>

      <OfferList
        initialOffers={offers ?? []}
        bots={bot ? [bot] : []}
        plans={plans ?? []}
      />
    </div>
  )
}
