export const dynamic = 'force-dynamic'

import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import { Bot, TrendingUp, ArrowRight } from 'lucide-react'

export default async function OffersPage() {
  const { data: bots } = await supabaseAdmin
    .from('bots')
    .select('id, name, is_active')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-400" />
          Upsell & Downsell
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          As ofertas são configuradas dentro de cada bot. Selecione qual deseja configurar:
        </p>
      </div>

      <div className="space-y-2">
        {(bots ?? []).map(bot => (
          <Link key={bot.id} href={`/dashboard/bots/${bot.id}/offers`}
            className="flex items-center justify-between rounded-xl px-4 py-3.5 transition-all group"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <Bot className="h-4 w-4 text-blue-400" />
              </div>
              <span className="text-sm font-medium text-slate-200">{bot.name}</span>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
          </Link>
        ))}
        {(bots ?? []).length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl py-12 text-center"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
            <Bot className="h-8 w-8 text-slate-700 mb-2" />
            <p className="text-sm text-slate-500">Nenhum bot ativo encontrado</p>
            <Link href="/dashboard/bots" className="mt-2 text-xs text-blue-400 hover:text-blue-300">Criar um bot →</Link>
          </div>
        )}
      </div>
    </div>
  )
}
