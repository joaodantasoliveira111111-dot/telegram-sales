import { supabaseAdmin } from '@/lib/supabase'
import { RedirectPageView } from './redirect-page-view'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function RedirectSlugPage({ params }: Props) {
  const { slug } = await params

  const { data: page } = await supabaseAdmin
    .from('redirect_pages')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!page) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: '#06040f' }}
      >
        <div className="text-center space-y-3">
          <p className="text-2xl font-bold text-slate-300">404</p>
          <p className="text-slate-500">Página não encontrada</p>
        </div>
      </div>
    )
  }

  // Increment clicks (fire-and-forget)
  supabaseAdmin
    .from('redirect_pages')
    .update({ clicks: (page.clicks ?? 0) + 1 })
    .eq('id', page.id)
    .then(() => {})

  return <RedirectPageView page={page} />
}
