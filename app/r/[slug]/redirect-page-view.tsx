'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, Check, ExternalLink } from 'lucide-react'

const THEMES: Record<string, {
  bg: string
  accent: string
  btnGrad: string
  glow: string
  btnText?: string
}> = {
  dark: {
    bg: 'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.25) 0%, #06040f 60%)',
    accent: '#8b5cf6',
    btnGrad: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
    glow: 'rgba(139,92,246,0.5)',
  },
  neon: {
    bg: 'radial-gradient(ellipse at 50% 0%, rgba(0,255,170,0.2) 0%, #000 60%)',
    accent: '#00ffaa',
    btnGrad: 'linear-gradient(135deg, #00ffaa, #00d4ff)',
    glow: 'rgba(0,255,170,0.5)',
    btnText: '#000',
  },
  pink: {
    bg: 'radial-gradient(ellipse at 50% 0%, rgba(236,72,153,0.25) 0%, #1a0010 60%)',
    accent: '#ec4899',
    btnGrad: 'linear-gradient(135deg, #ec4899, #be185d)',
    glow: 'rgba(236,72,153,0.5)',
  },
  warm: {
    bg: 'radial-gradient(ellipse at 50% 0%, rgba(249,115,22,0.2) 0%, #0f0500 60%)',
    accent: '#f97316',
    btnGrad: 'linear-gradient(135deg, #f97316, #dc2626)',
    glow: 'rgba(249,115,22,0.5)',
  },
  ocean: {
    bg: 'radial-gradient(ellipse at 50% 0%, rgba(6,182,212,0.2) 0%, #000a14 60%)',
    accent: '#06b6d4',
    btnGrad: 'linear-gradient(135deg, #06b6d4, #0284c7)',
    glow: 'rgba(6,182,212,0.5)',
  },
}

interface RedirectPage {
  id: string
  slug: string
  name: string
  bio: string | null
  photo_url: string | null
  button_text: string
  bot_link: string
  theme: string
  show_countdown: boolean
  countdown_minutes: number
  show_verification: boolean
  highlights: string[] | null
  clicks: number
}

interface Props {
  page: RedirectPage
}

function CountdownTimer({ minutes }: { minutes: number }) {
  const [seconds, setSeconds] = useState(minutes * 60)

  useEffect(() => {
    if (seconds <= 0) return
    const id = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [seconds])

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')

  return (
    <span className="font-mono text-2xl font-bold tracking-widest">
      {mm}:{ss}
    </span>
  )
}

export function RedirectPageView({ page }: Props) {
  const theme = THEMES[page.theme] ?? THEMES.dark
  const [verified, setVerified] = useState(!page.show_verification)
  const highlights = (page.highlights ?? []).filter(Boolean)

  useEffect(() => {
    if (!page.show_verification) return
    const timer = setTimeout(() => setVerified(true), 2500)
    return () => clearTimeout(timer)
  }, [page.show_verification])

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ background: theme.bg }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-8 space-y-6"
        style={{
          background: `rgba(${hexToRgb(theme.accent)},0.07)`,
          border: `1px solid rgba(${hexToRgb(theme.accent)},0.18)`,
          backdropFilter: 'blur(24px)',
        }}
      >
        {/* Profile photo */}
        <div className="flex flex-col items-center gap-4">
          <div
            className="h-24 w-24 rounded-full overflow-hidden flex items-center justify-center text-3xl font-bold text-white"
            style={{
              boxShadow: `0 0 0 3px ${theme.accent}, 0 0 24px ${theme.glow}`,
              background: page.photo_url ? undefined : `linear-gradient(135deg, ${theme.accent}, rgba(${hexToRgb(theme.accent)},0.4))`,
            }}
          >
            {page.photo_url ? (
              <img src={page.photo_url} alt={page.name} className="h-full w-full object-cover" />
            ) : (
              <span>{page.name.charAt(0).toUpperCase()}</span>
            )}
          </div>

          {/* Name + verified badge */}
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">{page.name}</h1>
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" style={{ color: theme.accent }} />
          </div>

          {/* Bio */}
          {page.bio && (
            <p className="text-sm text-zinc-400 text-center leading-relaxed">{page.bio}</p>
          )}
        </div>

        {/* Highlights */}
        {highlights.length > 0 && (
          <div className="space-y-2">
            {highlights.map((h, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div
                  className="h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: `rgba(${hexToRgb(theme.accent)},0.15)` }}
                >
                  <Check className="h-3 w-3" style={{ color: theme.accent }} />
                </div>
                <span className="text-sm text-zinc-300">{h}</span>
              </div>
            ))}
          </div>
        )}

        {/* Countdown */}
        {page.show_countdown && (
          <div
            className="rounded-2xl p-4 text-center space-y-1"
            style={{
              background: `rgba(${hexToRgb(theme.accent)},0.08)`,
              border: `1px solid rgba(${hexToRgb(theme.accent)},0.2)`,
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.accent }}>
              Oferta expira em
            </p>
            <div style={{ color: theme.accent }}>
              <CountdownTimer minutes={page.countdown_minutes} />
            </div>
          </div>
        )}

        {/* Verification + CTA button */}
        {page.show_verification && !verified ? (
          <div className="flex flex-col items-center gap-3 py-2">
            <div
              className="h-8 w-8 rounded-full border-2 animate-spin"
              style={{ borderColor: `${theme.accent} transparent transparent transparent` }}
            />
            <p className="text-sm text-zinc-400">Verificando sua identidade...</p>
          </div>
        ) : (
          <a
            href={page.bot_link}
            target="_blank"
            rel="noreferrer"
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-base font-bold transition-all duration-200 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: theme.btnGrad,
              color: theme.btnText ?? '#fff',
              boxShadow: `0 8px 32px ${theme.glow}`,
              opacity: verified ? 1 : 0,
              transition: 'opacity 0.5s ease, transform 0.2s ease',
            }}
          >
            {page.button_text}
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>

      {/* Powered by */}
      <p className="mt-8 text-[11px] text-zinc-700">Powered by FlowBot</p>
    </div>
  )
}

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '')
  if (h.length === 6) {
    const r = parseInt(h.slice(0, 2), 16)
    const g = parseInt(h.slice(2, 4), 16)
    const b = parseInt(h.slice(4, 6), 16)
    return `${r},${g},${b}`
  }
  return '139,92,246'
}
