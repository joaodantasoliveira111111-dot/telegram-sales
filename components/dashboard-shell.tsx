'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, Zap } from 'lucide-react'
import { Sidebar } from './sidebar'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => { setOpen(false) }, [pathname])

  return (
    <div className="relative flex h-screen overflow-hidden" style={{ background: '#07071a' }}>
      {/* Background blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="blob-1 absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full opacity-[0.12]"
          style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }}
        />
        <div
          className="blob-2 absolute top-1/2 -right-60 h-[500px] w-[500px] rounded-full opacity-[0.08]"
          style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }}
        />
        <div
          className="blob-3 absolute -bottom-32 left-1/3 h-[400px] w-[400px] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)' }}
        />
      </div>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 backdrop-blur-sm lg:hidden"
          style={{ background: 'rgba(7,7,26,0.75)' }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={[
          'fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out',
          'lg:relative lg:z-auto lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <Sidebar onClose={() => setOpen(false)} />
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header
          className="flex h-14 shrink-0 items-center gap-3 border-b px-4 backdrop-blur-2xl lg:hidden"
          style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(7,7,26,0.85)' }}
        >
          <button
            onClick={() => setOpen(true)}
            className="rounded-xl p-2 text-slate-400 transition-all hover:text-slate-200"
            style={{ background: 'rgba(255,255,255,0.06)' }}
            aria-label="Abrir menu"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 overflow-hidden rounded-lg">
              <img src="/logo.svg" alt="FlowBot" className="h-7 w-7" />
            </div>
            <span className="text-sm font-bold text-slate-100">FlowBot</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
