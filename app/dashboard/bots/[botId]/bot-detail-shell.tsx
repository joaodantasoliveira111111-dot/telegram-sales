'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bot, ListOrdered, MessageSquare, Package, Sparkles, ArrowLeft, Cpu, BarChart2, TrendingUp, GitBranch } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Breadcrumbs } from '@/components/breadcrumbs'

interface BotDetailShellProps {
  bot: { id: string; name: string; is_active: boolean; bot_type?: string }
  children: React.ReactNode
}

export function BotDetailShell({ bot, children }: BotDetailShellProps) {
  const pathname = usePathname()
  const base = `/dashboard/bots/${bot.id}`
  const isAccountBot = bot.bot_type === 'account_stock'

  const tabs = [
    { href: base,               label: 'Configurações', icon: Bot,           exact: true },
    { href: `${base}/plans`,    label: 'Planos',         icon: ListOrdered,   exact: false },
    { href: `${base}/messages`, label: 'Mensagens',      icon: MessageSquare, exact: false },
    { href: `${base}/offers`,   label: 'Upsell',         icon: TrendingUp,    exact: false },
    ...(isAccountBot ? [{ href: `${base}/accounts`, label: 'Estoque', icon: Package, exact: false }] : []),
    { href: `${base}/flow`,     label: 'Fluxo Visual',   icon: GitBranch,  exact: false },
    { href: `${base}/pixel`,    label: 'Pixel',          icon: Sparkles,   exact: false },
    { href: `${base}/funnel`,   label: 'Funil',          icon: BarChart2,  exact: false },
  ]

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Breadcrumbs */}
      <Breadcrumbs labels={{ [bot.id]: bot.name }} />

      {/* Back + Header */}
      <div>
        <Link
          href="/dashboard/bots"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Todos os bots
        </Link>

        <div className="flex items-center gap-4">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{
              background: bot.is_active
                ? 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(99,102,241,0.2))'
                : 'rgba(255,255,255,0.78)',
              border: bot.is_active ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(255,255,255,0.88)',
              boxShadow: bot.is_active ? '0 0 24px rgba(59,130,246,0.2)' : undefined,
            }}
          >
            <Cpu className={`h-6 w-6 ${bot.is_active ? 'text-blue-400' : 'text-slate-600'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-100">{bot.name}</h1>
              {isAccountBot && (
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-300"
                  style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}
                >
                  Contas
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div
                className={`h-1.5 w-1.5 rounded-full ${bot.is_active ? 'bg-emerald-400' : 'bg-slate-600'}`}
                style={bot.is_active ? { boxShadow: '0 0 6px rgba(52,211,153,0.5)' } : undefined}
              />
              <span className={`text-sm ${bot.is_active ? 'text-emerald-400' : 'text-slate-500'}`}>
                {bot.is_active ? 'Online' : 'Inativo'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 overflow-x-auto rounded-2xl p-1.5"
        style={{ background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(255,255,255,0.82)' }}
      >
        {tabs.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-150 whitespace-nowrap',
                ''
              )}
              style={active ? {
                background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(99,102,241,0.08))',
                border: '1px solid rgba(59,130,246,0.22)',
                color: '#1d4ed8',
              } : { color: '#71717a' }}
            >
              <Icon className="h-4 w-4" style={{ color: active ? '#2563eb' : '#a1a1aa' }} />
              {label}
            </Link>
          )
        })}
      </div>

      <div>{children}</div>
    </div>
  )
}
