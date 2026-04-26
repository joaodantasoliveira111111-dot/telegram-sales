'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bot, CreditCard, LayoutDashboard, ListOrdered, Users, Megaphone, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/bots', label: 'Bots', icon: Bot },
  { href: '/dashboard/plans', label: 'Planos', icon: ListOrdered },
  { href: '/dashboard/broadcasts', label: 'Transmissões', icon: Megaphone },
  { href: '/dashboard/payments', label: 'Pagamentos', icon: CreditCard },
  { href: '/dashboard/subscriptions', label: 'Assinaturas', icon: Users },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-zinc-800/60 bg-zinc-950 px-3 py-6">
      {/* Logo */}
      <div className="mb-8 px-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-zinc-100">TelegramSales</h1>
            <p className="text-xs text-zinc-600">Painel de Controle</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-blue-600/20 text-blue-400'
                  : 'text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-200'
              )}
            >
              <Icon className={cn('h-4 w-4 shrink-0 transition-transform group-hover:scale-110', active && 'text-blue-400')} />
              {label}
              {href === '/dashboard/broadcasts' && (
                <span className="ml-auto rounded-full bg-blue-600/20 px-1.5 py-0.5 text-xs text-blue-400">
                  Novo
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto px-3">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
          <p className="text-xs font-medium text-zinc-400">Webhook AmploPay</p>
          <p className="mt-1 break-all text-xs text-zinc-600 select-all">
            {typeof window !== 'undefined' ? `${window.location.origin}/api/amplopay/webhook` : '/api/amplopay/webhook'}
          </p>
        </div>
      </div>
    </aside>
  )
}
