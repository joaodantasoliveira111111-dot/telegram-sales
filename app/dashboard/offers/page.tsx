export const dynamic = 'force-dynamic'

import { supabaseAdmin } from '@/lib/supabase'
import { OfferList } from './offer-list'

export default async function OffersPage() {
  const [{ data: offers }, { data: bots }, { data: plans }] = await Promise.all([
    supabaseAdmin
      .from('offers')
      .select('*, bot:bots(name), trigger_plan:plans!offers_trigger_plan_id_fkey(name, price), offer_plan:plans!offers_offer_plan_id_fkey(name, price)')
      .order('created_at', { ascending: false }),
    supabaseAdmin.from('bots').select('id, name').eq('is_active', true),
    supabaseAdmin.from('plans').select('id, name, price, bot_id'),
  ])

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-100">Upsell & Downsell</h2>
        <p className="text-sm text-zinc-500">
          Configure ofertas automáticas enviadas após pagamento (upsell) ou para quem não comprou (downsell)
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
          <h3 className="mb-1 font-semibold text-blue-400">📈 Upsell</h3>
          <p className="text-sm text-zinc-400">
            Enviado automaticamente logo após o pagamento. Oferece um plano melhor/mais longo para quem acabou de comprar.
          </p>
        </div>
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
          <h3 className="mb-1 font-semibold text-orange-400">📉 Downsell</h3>
          <p className="text-sm text-zinc-400">
            Envie via Transmissões (alvo: Não pagaram) com uma oferta mais barata para converter quem não comprou.
          </p>
        </div>
      </div>

      <OfferList initialOffers={offers ?? []} bots={bots ?? []} plans={plans ?? []} />
    </div>
  )
}
