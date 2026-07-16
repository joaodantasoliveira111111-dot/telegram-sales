export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromCookies } from '@/lib/session'
import { ProductTypeList } from './product-type-list'

export default async function ProductTypesPage() {
  const cookieStore = await cookies()
  const session = await getSessionFromCookies(cookieStore)
  if (session?.type === 'user') redirect('/dashboard')

  const { data } = await supabaseAdmin
    .from('product_types')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight" style={{ color: '#1a1625' }}>Tipos de Produto</h2>
        <p className="text-sm text-zinc-500">Defina os campos que cada tipo de conta entregue precisa (login, senha, contra-senha, código, etc.)</p>
      </div>
      <ProductTypeList initialTypes={data ?? []} />
    </div>
  )
}
