'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Bot, CreditCard, LayoutDashboard, Users,
  Megaphone, Zap, TrendingUp, BarChart2, X,
  Settings, LogOut, ChevronRight, Link2, Shield,
  UserCheck, CalendarClock, LayoutTemplate, Handshake,
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
      { href: '/dashboard/groups', label: 'Grupos & Canais', icon: Users },
      { href: '/dashboard/telegram-connect', label: 'Conta Telegram', icon: Link2 },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { href: '/dashboard/broadcasts', label: 'Transmissões', icon: Megaphone },
      { href: '/dashboard/offers', label: 'Upsell & Downsell', icon: TrendingUp },
      { href: '/dashboard/affiliates', label: 'Afiliados', icon: Handshake },
      { href: '/dashboard/scheduled-posts', label: 'Agendamento', icon: CalendarClock },
      { href: '/dashboard/cloakers', label: 'Cloaker', icon: Shield },
      { href: '/dashboard/funnel-templates', label: 'Templates de Funil', icon: LayoutTemplate },
    ],
  },
  {
    label: 'Financeiro',
    items: [
      { href: '/dashboard/payments', label: 'Pagamentos', icon: CreditCard },
      { href: '/dashboard/subscriptions', label: 'Assinaturas', icon: Users },
      { href: '/dashboard/crm', label: 'CRM — Leads', icon: UserCheck },
    ],
  },
]

const glass = {
  sidebar: {
    background: 'rgba(5,5,20,0.92)',
    borderRight: '1px solid rgba(255,255,255,0.07)',
    backdropFilter: 'blur(40px)',
  } as React.CSSProperties,
  activeItem: {
    background: 'linear-gradient(135deg, rgba(59,130,246,0.18) 0%, rgba(139,92,246,0.08) 100%)',
    border: '1px solid rgba(59,130,246,0.25)',
  } as React.CSSProperties,
  infoCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
  } as React.CSSProperties,
}

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <aside
      className="flex h-full w-64 flex-col"
      style={glass.sidebar}
    >
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center justify-between px-5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 overflow-hidden rounded-xl shadow-lg flex-shrink-0"
            style={{ boxShadow: '0 0 20px rgba(59,130,246,0.35)' }}
          >
            <img src="/logo.svg" alt="FlowBot" className="h-9 w-9" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-slate-100 tracking-tight">FlowBot</p>
            <p className="text-[10px] text-slate-500 tracking-wide">Painel de Controle</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:text-slate-300 lg:hidden"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="mx-4 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-2.5 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-600">
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
                      'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                      active ? 'text-blue-300' : 'text-slate-500 hover:text-slate-200'
                    )}
                    style={active ? glass.activeItem : undefined}
                  >
                    {!active && (
                      <div className="absolute inset-0 rounded-xl opacity-0 transition-opacity group-hover:opacity-100"
                        style={{ background: 'rgba(255,255,255,0.04)' }}
                      />
                    )}
                    <Icon
                      className={cn(
                        'relative h-4 w-4 shrink-0 transition-colors',
                        active ? 'text-blue-400' : 'text-slate-600 group-hover:text-slate-400'
                      )}
                    />
                    <span className="relative flex-1">{label}</span>
                    {active && (
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: '#3b82f6', boxShadow: '0 0 6px rgba(59,130,246,0.6)' }}
                      />
                    )}
                    {!active && (
                      <ChevronRight className="relative h-3 w-3 shrink-0 text-slate-700 opacity-0 transition-opacity group-hover:opacity-100" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="shrink-0 space-y-1.5 p-3">
        <Link
          href="/dashboard/settings"
          className={cn(
            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
            pathname.startsWith('/dashboard/settings')
              ? 'text-blue-300'
              : 'text-slate-500 hover:text-slate-200'
          )}
          style={pathname.startsWith('/dashboard/settings') ? glass.activeItem : { background: 'rgba(255,255,255,0.02)' }}
        >
          <Settings className={cn('h-4 w-4 shrink-0', pathname.startsWith('/dashboard/settings') ? 'text-blue-400' : 'text-slate-600')} />
          Configurações
        </Link>

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition-all hover:text-red-400"
          style={{ background: 'rgba(255,255,255,0.02)' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.02)' }}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sair
        </button>

        <div className="rounded-xl px-3 py-2.5" style={glass.infoCard}>
          <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-600">Webhook AmploPay</p>
          <p className="mt-0.5 break-all font-mono text-[10px] text-slate-700">
            /api/amplopay/webhook
          </p>
        </div>
      </div>
    </aside>
  )
}
