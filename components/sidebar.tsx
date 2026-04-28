'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Bot, Users2, Megaphone, Handshake,
  Shield, ExternalLink, CreditCard, BarChart2, UserCheck,
  LayoutTemplate, Wand2, Settings, LogOut, Link2, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Navigation structure ─────────────────────────────────────────────────────
// Merged: Relatórios → Dashboard  |  Templates de Funil → Templates
// Postagens Agendadas → inside Postagens  |  CRM — Leads → CRM
// Ferramentas de Mídia → Ferramentas  |  Página de Redirect → Redirects

const NAV = [
  {
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: 'Bots',
    items: [
      { href: '/dashboard/bots', label: 'Meus Bots', icon: Bot },
      { href: '/dashboard/groups', label: 'Grupos & Canais', icon: Users2 },
      { href: '/dashboard/telegram-connect', label: 'Conta Telegram', icon: Link2 },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { href: '/dashboard/broadcasts', label: 'Postagens', icon: Megaphone },
      { href: '/dashboard/affiliates', label: 'Afiliados', icon: Handshake },
      { href: '/dashboard/cloakers', label: 'Cloaker', icon: Shield },
      { href: '/dashboard/redirect-pages', label: 'Redirects', icon: ExternalLink },
    ],
  },
  {
    label: 'Clientes',
    items: [
      { href: '/dashboard/payments', label: 'Pagamentos', icon: CreditCard },
      { href: '/dashboard/subscriptions', label: 'Assinaturas', icon: BarChart2 },
      { href: '/dashboard/crm', label: 'CRM', icon: UserCheck },
    ],
  },
  {
    label: 'Builder',
    items: [
      { href: '/dashboard/funnel-templates', label: 'Templates', icon: LayoutTemplate },
      { href: '/dashboard/tools', label: 'Ferramentas', icon: Wand2 },
    ],
  },
]

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

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  return (
    <aside
      className="flex h-full flex-col"
      style={{
        width: 'var(--sidebar-w)',
        background: 'rgba(6,4,18,0.88)',
        backdropFilter: 'blur(60px) saturate(160%)',
        WebkitBackdropFilter: 'blur(60px) saturate(160%)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl overflow-hidden"
            style={{ boxShadow: '0 0 16px rgba(139,92,246,0.5)' }}
          >
            <img src="/logo.svg" alt="FlowBot" className="h-8 w-8" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-zinc-100 tracking-tight leading-none">FlowBot</p>
            <p className="text-[9px] tracking-[0.12em] uppercase mt-0.5" style={{ color: 'rgba(139,92,246,0.7)' }}>
              Painel
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-600 transition-colors hover:text-zinc-400 lg:hidden"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="mx-4 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />

      {/* Nav */}
      <nav className="flex flex-1 flex-col overflow-y-auto px-2.5 py-3 gap-0.5">
        {NAV.map((group, gi) => (
          <div key={gi} className={gi > 0 ? 'mt-4' : ''}>
            {group.label && (
              <p
                className="mb-1 px-2.5 text-[9px] font-bold uppercase tracking-[0.14em]"
                style={{ color: 'rgba(255,255,255,0.22)' }}
              >
                {group.label}
              </p>
            )}
            {group.items.map(({ href, label, icon: Icon, ...rest }) => {
              const exact = 'exact' in rest ? (rest as { exact?: boolean }).exact : undefined
              const active = isActive(href, exact)
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'group relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium transition-all duration-150',
                    active
                      ? 'sidebar-active-bar text-violet-300'
                      : 'text-zinc-500 hover:text-zinc-200'
                  )}
                  style={
                    active
                      ? {
                          background: 'linear-gradient(90deg, rgba(139,92,246,0.14), rgba(139,92,246,0.04))',
                          border: '1px solid rgba(139,92,246,0.2)',
                        }
                      : undefined
                  }
                >
                  {/* Hover bg */}
                  {!active && (
                    <div
                      className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                      style={{ background: 'rgba(255,255,255,0.03)' }}
                    />
                  )}

                  <Icon
                    className={cn(
                      'relative h-[15px] w-[15px] shrink-0 transition-colors duration-150',
                      active ? 'text-violet-400' : 'text-zinc-600 group-hover:text-zinc-400'
                    )}
                  />
                  <span className="relative flex-1 leading-none">{label}</span>

                  {/* Active dot */}
                  {active && (
                    <span
                      className="relative h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: '#8b5cf6', boxShadow: '0 0 6px rgba(139,92,246,0.8)' }}
                    />
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Divider */}
      <div className="mx-4 h-px mb-2" style={{ background: 'rgba(255,255,255,0.05)' }} />

      {/* Footer */}
      <div className="shrink-0 px-2.5 pb-4 space-y-0.5">
        <Link
          href="/dashboard/settings"
          className={cn(
            'group relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium transition-all duration-150',
            pathname.startsWith('/dashboard/settings')
              ? 'sidebar-active-bar text-violet-300'
              : 'text-zinc-500 hover:text-zinc-200'
          )}
          style={
            pathname.startsWith('/dashboard/settings')
              ? {
                  background: 'linear-gradient(90deg, rgba(139,92,246,0.14), rgba(139,92,246,0.04))',
                  border: '1px solid rgba(139,92,246,0.2)',
                }
              : undefined
          }
        >
          {!pathname.startsWith('/dashboard/settings') && (
            <div
              className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-150 group-hover:opacity-100"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            />
          )}
          <Settings
            className={cn(
              'relative h-[15px] w-[15px] shrink-0',
              pathname.startsWith('/dashboard/settings') ? 'text-violet-400' : 'text-zinc-600 group-hover:text-zinc-400'
            )}
          />
          <span className="relative flex-1 leading-none">Configurações</span>
        </Link>

        <button
          onClick={handleLogout}
          className="group relative flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium text-zinc-500 transition-all duration-150 hover:text-red-400"
        >
          <div
            className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-150 group-hover:opacity-100"
            style={{ background: 'rgba(239,68,68,0.06)' }}
          />
          <LogOut className="relative h-[15px] w-[15px] shrink-0 text-zinc-600 group-hover:text-red-500 transition-colors" />
          <span className="relative leading-none">Sair</span>
        </button>
      </div>
    </aside>
  )
}
