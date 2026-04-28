'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { Sidebar } from './sidebar'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => { setOpen(false) }, [pathname])

  return (
    <div className="relative flex h-screen overflow-hidden" style={{ background: 'var(--background)' }}>

      {/* ── Ambient background ────────────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        {/* Mesh grid */}
        <div
          className="absolute inset-0 tech-grid opacity-100"
        />

        {/* Blobs */}
        <div
          className="blob-1 absolute -top-48 -left-48 h-[700px] w-[700px] rounded-full"
          style={{ background: 'radial-gradient(circle at 40% 40%, rgba(99,102,241,0.12) 0%, transparent 65%)', filter: 'blur(1px)' }}
        />
        <div
          className="blob-2 absolute top-1/3 -right-64 h-[600px] w-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle at 60% 50%, rgba(139,92,246,0.09) 0%, transparent 65%)', filter: 'blur(1px)' }}
        />
        <div
          className="blob-3 absolute -bottom-40 left-1/4 h-[500px] w-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle at 50% 60%, rgba(6,182,212,0.07) 0%, transparent 65%)', filter: 'blur(1px)' }}
        />

        {/* Top glow bar */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.4) 40%, rgba(99,102,241,0.4) 60%, transparent 100%)' }}
        />
      </div>

      {/* ── Mobile overlay ────────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-40 backdrop-blur-sm lg:hidden"
          style={{ background: 'rgba(5,4,14,0.8)' }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <div
        className={[
          'fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out',
          'lg:relative lg:z-auto lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        style={{ zIndex: 50 }}
      >
        <Sidebar onClose={() => setOpen(false)} />
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden" style={{ zIndex: 1 }}>

        {/* Mobile header */}
        <header
          className="flex h-12 shrink-0 items-center gap-3 px-4 lg:hidden"
          style={{
            background: 'rgba(6,4,18,0.85)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <button
            onClick={() => setOpen(true)}
            className="rounded-xl p-2 text-zinc-500 transition-all hover:text-zinc-200 hover:bg-white/5"
            aria-label="Abrir menu"
          >
            <Menu className="h-[15px] w-[15px]" />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 overflow-hidden rounded-lg">
              <img src="/logo.svg" alt="FlowBot" className="h-6 w-6" />
            </div>
            <span
              className="text-[13px] font-bold text-zinc-100 tracking-tight"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              FlowBot
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-7">
          {children}
        </main>
      </div>
    </div>
  )
}
