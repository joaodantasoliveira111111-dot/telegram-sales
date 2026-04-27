'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Bot, CreditCard, LayoutDashboard, ListOrdered, Users,
  Megaphone, Zap, TrendingUp, Package, BarChart2, MessageSquare, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navGroups = [
  {
    label: 'Geral',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
      { href: '/dashboard/reports', label: 'Relatórios', icon: BarChart2 },
    ],
  },
  {
    label: 'Produtos',
    items: [
      { href: '/dashboard/bots', label: 'Bots', icon: Bot },
      { href: '/dashboard/plans', label: 'Planos', icon: ListOrdered },
      { href: '/dashboard/account-stock', label: 'Estoque de Contas', icon: Package },
      { href: '/dashboard/messages', label: 'Mensagens do Bot', icon: MessageSquare },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { href: '/dashboard/broadcasts', label: 'Transmissões', icon: Megaphone },
      { href: '/dashboard/offers', label: 'Upsell & Downsell', icon: TrendingUp },
    ],
  },
  {
    label: 'Financeiro',
    items: [
      { href: '/dashboard/payments', label: 'Pagamentos', icon: CreditCard },
      { href: '/dashboard/subscriptions', label: 'Assinaturas', icon: Users },
    ],
  },
]

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-64 flex-col border-r border-zinc-800/60 bg-zinc-900">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center justify-between px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/30">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-zinc-100">TelegramSales</p>
            <p className="text-[10px] text-zinc-500">Painel de Controle</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-500 transition-colors hover:text-zinc-300 lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-zinc-800/60" />

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
              {group.label}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.items.map(({ href, label, icon: Icon, exact }) => {
                const active = exact ? pathname === href : pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                      active
                        ? 'bg-blue-600/15 text-blue-400'
                        : 'text-zinc-500 hover:bg-zinc-800/70 hover:text-zinc-200'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0 transition-colors',
                        active ? 'text-blue-400' : 'text-zinc-600 group-hover:text-zinc-400'
                      )}
                    />
                    <span className="flex-1">{label}</span>
                    {active && (
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="shrink-0 p-4">
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/60 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Webhook AmploPay</p>
          <p className="mt-0.5 break-all font-mono text-[10px] text-zinc-700">
            /api/amplopay/webhook
          </p>
        </div>
      </div>
    </aside>
  )
}
