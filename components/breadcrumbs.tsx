'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'

// Static segment → label mapping
const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  bots: 'Meus Bots',
  groups: 'Grupos & Canais',
  broadcasts: 'Postagens',
  affiliates: 'Afiliados',
  cloakers: 'Cloaker',
  'redirect-pages': 'Redirects',
  payments: 'Pagamentos',
  subscriptions: 'Assinaturas',
  crm: 'CRM',
  'funnel-templates': 'Templates',
  tools: 'Ferramentas',
  settings: 'Configurações',
  'telegram-connect': 'Conta Telegram',
  'scheduled-posts': 'Agendados',
  'account-stock': 'Estoque',
  plans: 'Planos',
  messages: 'Mensagens',
  offers: 'Upsell',
  flow: 'Fluxo Visual',
  pixel: 'Pixel',
  funnel: 'Funil',
  accounts: 'Contas',
  users: 'Usuários',
  reports: 'Relatórios',
}

interface Crumb {
  label: string
  href: string
}

interface BreadcrumbsProps {
  /** Extra label overrides for dynamic segments (e.g. { [botId]: 'Nome do Bot' }) */
  labels?: Record<string, string>
  className?: string
}

export function Breadcrumbs({ labels = {}, className }: BreadcrumbsProps) {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  const crumbs: Crumb[] = segments.reduce<Crumb[]>((acc, seg, i) => {
    const href = '/' + segments.slice(0, i + 1).join('/')
    const label = labels[seg] ?? SEGMENT_LABELS[seg] ?? null
    if (label) acc.push({ label, href })
    return acc
  }, [])

  if (crumbs.length <= 1) return null

  return (
    <nav
      className={`flex items-center gap-1 text-xs text-zinc-500 mb-4 ${className ?? ''}`}
      aria-label="Breadcrumb"
    >
      <Link href="/dashboard" className="flex items-center gap-1 hover:text-zinc-300 transition-colors">
        <Home className="h-3 w-3" />
      </Link>
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3 text-zinc-700" />
          {i === crumbs.length - 1 ? (
            <span className="text-zinc-300 font-medium">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-zinc-300 transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}
