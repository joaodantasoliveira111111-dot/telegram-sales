'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bot, CreditCard, LayoutDashboard, ListOrdered, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/bots', label: 'Bots', icon: Bot },
  { href: '/dashboard/plans', label: 'Planos', icon: ListOrdered },
  { href: '/dashboard/payments', label: 'Pagamentos', icon: CreditCard },
  { href: '/dashboard/subscriptions', label: 'Assinaturas', icon: Users },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-zinc-800 bg-zinc-950 px-3 py-6">
      <div className="mb-8 px-3">
        <h1 className="text-lg font-bold text-zinc-100">TelegramSales</h1>
        <p className="text-xs text-zinc-500">Painel de Controle</p>
      </div>
      <nav className="flex flex-col gap-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
