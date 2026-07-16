'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MiniAppConfig, MiniAppTheme } from '@/types'

interface Product {
  id: string
  name: string
  price: number
  duration_days: number
  button_text: string
  content_type: string
  miniapp_category: string | null
  miniapp_icon: string | null
  miniapp_image_url: string | null
  miniapp_featured_label: string | null
  miniapp_sort: number
}

interface StoreData { config: MiniAppConfig; products: Product[] }

interface TelegramWebApp {
  ready: () => void
  expand: () => void
  close: () => void
  initData: string
  colorScheme: 'light' | 'dark'
  themeParams?: Record<string, string>
  MainButton: {
    text: string
    show: () => void
    hide: () => void
    setText: (t: string) => void
    setParams: (p: { color?: string; text_color?: string }) => void
    onClick: (fn: () => void) => void
    offClick: (fn: () => void) => void
    showProgress: (leaveActive: boolean) => void
    hideProgress: () => void
  }
  BackButton: { show: () => void; hide: () => void; onClick: (fn: () => void) => void; offClick: (fn: () => void) => void }
  HapticFeedback?: { impactOccurred: (style: string) => void; notificationOccurred: (type: string) => void; selectionChanged: () => void }
}

declare global {
  interface Window { Telegram?: { WebApp?: TelegramWebApp } }
}

function useTelegram() {
  const [tg, setTg] = useState<TelegramWebApp | null>(null)
  useEffect(() => {
    const w = window.Telegram?.WebApp
    if (w) {
      w.ready()
      w.expand()
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing with the Telegram WebApp SDK, which only attaches to window after this component mounts
      setTg(w)
    }
  }, [])
  return tg
}

const THEME_TOKENS: Record<MiniAppTheme, {
  bg: string; headerBorder: string; text: string; hint: string; fieldBg: string; cardShadow: string
  dark: boolean; pattern: 'dots' | 'grid' | 'none'; glow: boolean
}> = {
  aurora: { bg: '#ffffff', headerBorder: '#e7e5ea', text: '#1a1625', hint: '#8b8594', fieldBg: '#f4f2f8', cardShadow: '0 1px 2px rgba(20,10,40,0.04)', dark: false, pattern: 'dots', glow: false },
  neon: { bg: '#080b14', headerBorder: '#151f33', text: '#eaf4ff', hint: '#5f7fa3', fieldBg: '#101828', cardShadow: '0 0 0 1px rgba(255,255,255,0.04)', dark: true, pattern: 'grid', glow: true },
  mono: { bg: '#0a0a0a', headerBorder: '#1c1c1c', text: '#f4f4f5', hint: '#71717a', fieldBg: '#161616', cardShadow: 'none', dark: true, pattern: 'none', glow: false },
  glass: { bg: '#eff8ff', headerBorder: '#dbeafe', text: '#0c4a6e', hint: '#5b7a94', fieldBg: 'rgba(255,255,255,0.65)', cardShadow: '0 1px 2px rgba(3,80,130,0.06)', dark: false, pattern: 'dots', glow: false },
  sunset: { bg: '#fff7ed', headerBorder: '#fed7aa', text: '#431407', hint: '#a8825f', fieldBg: '#ffedd5', cardShadow: 'none', dark: false, pattern: 'none', glow: false },
}
type ThemeTokens = (typeof THEME_TOKENS)[MiniAppTheme]

function formatBRL(n: number) {
  return `R$ ${Number(n).toFixed(2).replace('.', ',')}`
}

export function StoreClient({ botId }: { botId: string }) {
  const tg = useTelegram()
  const [data, setData] = useState<StoreData | null>(null)
  const [loadError, setLoadError] = useState('')
  const [screen, setScreen] = useState<'store' | 'detail' | 'checkout'>('store')
  const [direction, setDirection] = useState<1 | -1>(1)
  const [activeCategory, setActiveCategory] = useState<string>('Todos')
  const [selected, setSelected] = useState<Product | null>(null)
  const [checkout, setCheckout] = useState<{ payment_id: string; pix_code: string | null; qr_code: string | null } | null>(null)
  const [checkoutError, setCheckoutError] = useState('')
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'other'>('pending')
  const [creatingPix, setCreatingPix] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetch(`/api/miniapp/${botId}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then(setData)
      .catch(() => setLoadError('Essa loja não está disponível no momento.'))
  }, [botId])

  const theme = THEME_TOKENS[data?.config.theme ?? 'aurora']
  const accent = data?.config.accent ?? '#7c3aed'
  const accent2 = data?.config.accent_2 ?? '#a78bfa'

  const categories = useMemo(() => {
    if (!data) return []
    const set = new Set(data.products.map((p) => p.miniapp_category).filter(Boolean) as string[])
    return ['Todos', ...set]
  }, [data])

  const visibleProducts = useMemo(() => {
    if (!data) return []
    if (activeCategory === 'Todos') return data.products
    return data.products.filter((p) => p.miniapp_category === activeCategory)
  }, [data, activeCategory])

  const goTo = useCallback((next: 'store' | 'detail' | 'checkout', dir: 1 | -1) => {
    setDirection(dir)
    setScreen(next)
    tg?.HapticFeedback?.selectionChanged()
  }, [tg])

  const openDetail = useCallback((p: Product) => {
    setSelected(p)
    setCheckout(null)
    setCheckoutError('')
    goTo('detail', 1)

    if (tg?.initData) {
      fetch(`/api/miniapp/${botId}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'view_content', init_data: tg.initData, plan_id: p.id, plan_name: p.name, value: p.price }),
      }).catch(() => {})
    }
  }, [tg, botId, goTo])

  const createCheckout = useCallback(async () => {
    if (!selected || !tg?.initData) {
      setCheckoutError('Abra essa loja pelo Telegram pra finalizar a compra.')
      return
    }
    setCreatingPix(true)
    setCheckoutError('')
    try {
      const res = await fetch(`/api/miniapp/${botId}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: selected.id, init_data: tg.initData }),
      })
      const json = await res.json()
      if (!res.ok) { setCheckoutError(json.error ?? 'Erro ao gerar Pix'); return }
      setCheckout(json)
      setPaymentStatus('pending')
      goTo('checkout', 1)
    } finally {
      setCreatingPix(false)
    }
  }, [selected, tg, botId, goTo])

  // Poll payment status while on the checkout screen
  useEffect(() => {
    if (screen !== 'checkout' || !checkout) return
    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/miniapp/${botId}/payment-status?payment_id=${checkout.payment_id}`)
      if (!res.ok) return
      const json = await res.json()
      if (json.status === 'paid') {
        setPaymentStatus('paid')
        tg?.HapticFeedback?.notificationOccurred('success')
        if (pollRef.current) clearInterval(pollRef.current)
      } else if (json.status && json.status !== 'pending') {
        setPaymentStatus('other')
        if (pollRef.current) clearInterval(pollRef.current)
      }
    }, 3500)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [screen, checkout, botId, tg])

  // Native Back Button
  useEffect(() => {
    if (!tg) return
    if (screen === 'store') { tg.BackButton.hide(); return }
    const onBack = () => goTo(screen === 'checkout' ? 'detail' : 'store', -1)
    tg.BackButton.show()
    tg.BackButton.onClick(onBack)
    return () => tg.BackButton.offClick(onBack)
  }, [tg, screen, goTo])

  // Native Main Button
  useEffect(() => {
    if (!tg) return
    const mb = tg.MainButton
    mb.setParams({ color: accent, text_color: '#ffffff' })

    if (screen === 'store') { mb.hide(); return }
    if (screen === 'detail') {
      mb.setText(creatingPix ? 'Gerando Pix...' : `Comprar · ${selected ? formatBRL(selected.price) : ''}`)
      mb.show()
      const onClick = () => createCheckout()
      mb.onClick(onClick)
      return () => mb.offClick(onClick)
    }
    if (screen === 'checkout') {
      if (paymentStatus === 'paid') {
        mb.setText('✅ Fechar')
        mb.show()
        const onClick = () => tg.close()
        mb.onClick(onClick)
        return () => mb.offClick(onClick)
      }
      mb.hide()
    }
  }, [tg, screen, selected, creatingPix, paymentStatus, accent, createCheckout])

  if (loadError) {
    return <Centered theme={THEME_TOKENS.aurora}><p style={{ color: '#71717a', fontSize: 14 }}>{loadError}</p></Centered>
  }
  if (!data) {
    return <SkeletonScreen />
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: theme.bg,
      color: theme.text,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      paddingBottom: 24,
      position: 'relative',
      overflowX: 'hidden',
    }}>
      <GlobalFx />
      {theme.pattern === 'grid' && (
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', opacity: 0.55,
          backgroundImage: `linear-gradient(${accent}26 1px, transparent 1px), linear-gradient(90deg, ${accent}26 1px, transparent 1px)`,
          backgroundSize: '26px 26px',
          maskImage: 'radial-gradient(ellipse 80% 55% at 50% 0%, black 25%, transparent 80%)',
        }} />
      )}
      {theme.pattern === 'dots' && (
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', opacity: 0.5,
          backgroundImage: `radial-gradient(${accent}22 1.3px, transparent 1.3px)`,
          backgroundSize: '18px 18px',
          maskImage: 'radial-gradient(ellipse 85% 50% at 50% 0%, black 20%, transparent 75%)',
        }} />
      )}

      <div key={screen} className={`ma-screen ma-enter-${direction === 1 ? 'right' : 'left'}`}>
        {screen === 'store' && (
          <StoreScreen
            config={data.config} theme={theme} accent={accent} accent2={accent2}
            categories={categories} activeCategory={activeCategory} setActiveCategory={setActiveCategory}
            products={visibleProducts} onSelect={openDetail}
          />
        )}
        {screen === 'detail' && selected && (
          <DetailScreen product={selected} theme={theme} accent={accent} accent2={accent2} error={checkoutError} creating={creatingPix} onBuy={createCheckout} onBack={() => goTo('store', -1)} />
        )}
        {screen === 'checkout' && selected && checkout && (
          <CheckoutScreen product={selected} theme={theme} accent={accent} checkout={checkout} status={paymentStatus} />
        )}
      </div>
    </div>
  )
}

function GlobalFx() {
  return (
    <style>{`
      @keyframes ma-slide-in-r { from { opacity: 0; transform: translateX(14px); } to { opacity: 1; transform: translateX(0); } }
      @keyframes ma-slide-in-l { from { opacity: 0; transform: translateX(-14px); } to { opacity: 1; transform: translateX(0); } }
      @keyframes ma-shimmer { 0% { background-position: -300px 0; } 100% { background-position: 300px 0; } }
      @keyframes ma-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
      @keyframes ma-spin { to { transform: rotate(360deg); } }
      @keyframes ma-kenburns { from { transform: scale(1.06); } to { transform: scale(1.14); } }
      .ma-enter-right { animation: ma-slide-in-r 0.28s cubic-bezier(0.22,1,0.36,1) both; }
      .ma-enter-left { animation: ma-slide-in-l 0.28s cubic-bezier(0.22,1,0.36,1) both; }
      .ma-card { transition: transform 0.12s ease, box-shadow 0.12s ease; }
      .ma-card:active { transform: scale(0.965); }
      @media (prefers-reduced-motion: reduce) {
        .ma-enter-right, .ma-enter-left { animation: none; }
        .ma-kenburns { animation: none !important; }
      }
    `}</style>
  )
}

function Centered({ children, theme }: { children: React.ReactNode; theme: ThemeTokens }) {
  return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.bg }}>{children}</div>
}

function Spinner({ color = '#7c3aed' }: { color?: string }) {
  return (
    <div style={{
      width: 26, height: 26, borderRadius: '50%',
      border: `3px solid ${color}33`, borderTopColor: color,
      animation: 'ma-spin 0.8s linear infinite',
    }} />
  )
}

function SkeletonScreen() {
  const bar = (w: string, h: number, style?: React.CSSProperties) => (
    <div style={{
      width: w, height: h, borderRadius: 8,
      background: 'linear-gradient(90deg, #eee 25%, #f6f6f6 37%, #eee 63%)',
      backgroundSize: '400px 100%',
      animation: 'ma-shimmer 1.4s ease-in-out infinite',
      ...style,
    }} />
  )
  return (
    <div style={{ minHeight: '100vh', background: '#fff', padding: 0 }}>
      <GlobalFx />
      <div style={{ height: 132, background: 'linear-gradient(90deg, #ece9f6 25%, #f4f2fa 37%, #ece9f6 63%)', backgroundSize: '400px 100%', animation: 'ma-shimmer 1.4s ease-in-out infinite' }} />
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {bar('40%', 12)}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {bar('100%', 80, { borderRadius: 16 })}
              {bar('70%', 10)}
              {bar('40%', 12)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ProductVisual({ product, accent, accent2, width, height, radius }: {
  product: Product; accent: string; accent2: string; width: number | string; height: number; radius: number
}) {
  return (
    <div style={{
      position: 'relative', overflow: 'hidden', flexShrink: 0, width, height, borderRadius: radius,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `linear-gradient(135deg, ${accent}, ${accent2})`,
    }}>
      {product.miniapp_image_url ? (
        // eslint-disable-next-line @next/next/no-img-element -- user-uploaded product photo, arbitrary external/storage URL
        <img src={product.miniapp_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span style={{ fontSize: Math.round(height * 0.34) }}>{product.miniapp_icon || '📦'}</span>
      )}
      {product.miniapp_featured_label && (
        <span style={{
          position: 'absolute', top: 6, left: 6, fontSize: 9, fontWeight: 800,
          background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '2px 6px', borderRadius: 5, backdropFilter: 'blur(4px)',
        }}>
          {product.miniapp_featured_label}
        </span>
      )}
    </div>
  )
}

// ─── Store screen ───────────────────────────────────────────────────────────

function StoreScreen({ config, theme, accent, accent2, categories, activeCategory, setActiveCategory, products, onSelect }: {
  config: MiniAppConfig
  theme: ThemeTokens
  accent: string; accent2: string
  categories: string[]; activeCategory: string; setActiveCategory: (c: string) => void
  products: Product[]; onSelect: (p: Product) => void
}) {
  return (
    <div>
      <div style={{ height: 152, position: 'relative', overflow: 'hidden' }}>
        {config.banner_url ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- user-uploaded banner, arbitrary storage URL, background cover treatment */}
            <img src={config.banner_url} alt="" className="ma-kenburns" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', animation: 'ma-kenburns 14s ease-out forwards' }} />
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${accent}55 0%, rgba(0,0,0,0.55) 100%)` }} />
          </>
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${accent}, ${accent2} 60%, ${theme.dark ? '#000' : '#00000022'})` }} />
        )}
        {theme.glow && (
          <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: accent, opacity: 0.35, filter: 'blur(50px)', top: -80, right: -40 }} />
        )}
        <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 15, background: 'rgba(255,255,255,0.96)', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
            marginBottom: 9, boxShadow: '0 10px 22px rgba(0,0,0,0.28)',
          }}>
            {config.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- user-uploaded logo, arbitrary storage URL
              <img src={config.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : config.logo_emoji}
          </div>
          <p style={{ color: '#fff', fontSize: 17.5, fontWeight: 800, margin: 0, textShadow: '0 2px 10px rgba(0,0,0,0.25)' }}>{config.store_name}</p>
          <p style={{ color: 'rgba(255,255,255,0.92)', fontSize: 12, margin: '3px 0 0' }}>{config.tagline}</p>
          {config.show_rating && (
            <span style={{
              display: 'inline-flex', marginTop: 9, background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(6px)',
              padding: '4px 11px', borderRadius: 999, fontSize: 11, fontWeight: 700, color: '#fff',
            }}>
              ⭐ {config.rating_value} · {config.rating_count_label}
            </span>
          )}
        </div>
      </div>

      {config.show_categories && categories.length > 1 && (
        <div style={{ display: 'flex', gap: 7, overflowX: 'auto', padding: '14px 16px 4px' }}>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              style={{
                flexShrink: 0, fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap',
                padding: '7px 14px', borderRadius: 999, border: `1.5px solid ${activeCategory === c ? `${accent}55` : 'transparent'}`,
                background: activeCategory === c ? `${accent}1f` : theme.fieldBg,
                color: activeCategory === c ? accent : theme.hint,
                cursor: 'pointer',
              }}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: theme.hint, margin: '16px 16px 10px' }}>
        {activeCategory === 'Todos' ? 'Catálogo' : activeCategory}
      </p>

      <div style={{
        display: config.layout === 'grid' ? 'grid' : 'flex',
        gridTemplateColumns: config.layout === 'grid' ? '1fr 1fr' : undefined,
        flexDirection: config.layout === 'list' ? 'column' : undefined,
        gap: 10, padding: '0 16px',
      }}>
        {products.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p)}
            className="ma-card"
            style={{
              textAlign: 'left', cursor: 'pointer', border: 'none', borderRadius: 16, overflow: 'hidden',
              background: theme.fieldBg, boxShadow: theme.cardShadow,
              padding: config.layout === 'list' ? 8 : 0,
              display: config.layout === 'list' ? 'flex' : 'block',
              alignItems: config.layout === 'list' ? 'center' : undefined,
              gap: config.layout === 'list' ? 11 : undefined,
            }}
          >
            <ProductVisual
              product={p} accent={accent} accent2={accent2}
              width={config.layout === 'list' ? 60 : '100%'}
              height={config.layout === 'list' ? 60 : 84}
              radius={config.layout === 'list' ? 12 : 0}
            />
            <div style={{ padding: config.layout === 'list' ? 0 : '9px 10px 11px', flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12.5, fontWeight: 700, color: theme.text, margin: 0, lineHeight: 1.25 }}>{p.name}</p>
              {p.miniapp_category && <p style={{ fontSize: 10, color: theme.hint, margin: '2px 0 0' }}>{p.miniapp_category}</p>}
              <p style={{ fontSize: 13.5, fontWeight: 800, color: theme.text, margin: '5px 0 0' }}>{formatBRL(p.price)}</p>
            </div>
          </button>
        ))}
        {products.length === 0 && (
          <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: theme.hint, fontSize: 13, padding: '30px 0' }}>Nenhum produto nessa categoria.</p>
        )}
      </div>

      {config.show_trust_badges && (
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 16, margin: '22px 16px 4px',
          paddingTop: 16, borderTop: `1px solid ${theme.headerBorder}`,
        }}>
          {[['⚡', 'Entrega automática'], ['🔒', 'Pagamento via Pix'], ['🛡️', 'Garantia incluída']].map(([ic, label]) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 70, textAlign: 'center' }}>
              <span style={{ fontSize: 17 }}>{ic}</span>
              <span style={{ fontSize: 9.5, fontWeight: 600, color: theme.hint }}>{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Detail screen ──────────────────────────────────────────────────────────

function DetailScreen({ product, theme, accent, accent2, error, creating, onBuy, onBack }: {
  product: Product; theme: ThemeTokens; accent: string; accent2: string
  error: string; creating: boolean; onBuy: () => void; onBack: () => void
}) {
  return (
    <div style={{ padding: 16 }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: theme.hint, fontSize: 13, marginBottom: 14, cursor: 'pointer', padding: 0 }}>‹ Voltar</button>

      <div style={{ position: 'relative', height: 190, borderRadius: 18, marginBottom: 16, overflow: 'hidden' }}>
        <ProductVisual product={product} accent={accent} accent2={accent2} width="100%" height={190} radius={18} />
        <div style={{ position: 'absolute', inset: 0, background: product.miniapp_image_url ? 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.55) 100%)' : 'none' }} />
        <span style={{
          position: 'absolute', bottom: 12, left: 14, right: 14, color: '#fff', fontSize: 15.5, fontWeight: 800,
          textShadow: '0 2px 8px rgba(0,0,0,0.35)',
        }}>
          {product.name}
        </span>
      </div>

      <p style={{ fontSize: 24, fontWeight: 800, color: theme.text, margin: '0 0 4px' }}>{formatBRL(product.price)}</p>
      <p style={{ fontSize: 12.5, color: theme.hint, margin: '0 0 18px' }}>Acesso por {product.duration_days} dias</p>

      <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: theme.hint, margin: '0 0 10px' }}>Entrega</p>
      <div style={{ background: theme.fieldBg, borderRadius: 14, padding: '12px 13px', fontSize: 11.5, color: theme.hint, lineHeight: 1.5, display: 'flex', gap: 9 }}>
        <span style={{ fontSize: 15, flexShrink: 0 }}>📧</span>
        <span>O acesso chega <b style={{ color: theme.text }}>direto nesse chat do Telegram</b>, assim que o Pix cair.</span>
      </div>

      {error && <p style={{ marginTop: 16, fontSize: 12.5, color: '#ef4444', textAlign: 'center' }}>{error}</p>}

      {/* Fallback button for browsers without the native Telegram MainButton (e.g. dashboard preview) */}
      <button
        onClick={onBuy}
        disabled={creating}
        style={{
          marginTop: 20, width: '100%', border: 'none', borderRadius: 14, padding: 14,
          fontSize: 14.5, fontWeight: 700, color: '#fff', background: accent, cursor: 'pointer', opacity: creating ? 0.7 : 1,
          boxShadow: `0 10px 24px -8px ${accent}88`,
        }}
      >
        {creating ? 'Gerando Pix...' : `Comprar · ${formatBRL(product.price)}`}
      </button>
    </div>
  )
}

// ─── Checkout screen ────────────────────────────────────────────────────────

function CheckoutScreen({ product, theme, accent, checkout, status }: {
  product: Product; theme: ThemeTokens; accent: string
  checkout: { pix_code: string | null; qr_code: string | null }; status: 'pending' | 'paid' | 'other'
}) {
  const [copied, setCopied] = useState(false)
  const qrImgSrc = checkout.pix_code
    ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(checkout.pix_code)}`
    : null

  if (status === 'paid') {
    return (
      <div style={{ padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: 14 }}>✅</div>
        <p style={{ fontSize: 17, fontWeight: 800, color: theme.text, margin: '0 0 6px' }}>Pagamento confirmado!</p>
        <p style={{ fontSize: 13, color: theme.hint }}>Seu acesso já foi enviado aqui no chat do Telegram.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: 16 }}>
      <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: theme.hint, margin: '0 0 10px' }}>Resumo</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, background: theme.fieldBg, borderRadius: 14, padding: 11, marginBottom: 18 }}>
        <ProductVisual product={product} accent={accent} accent2={accent} width={40} height={40} radius={11} />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 12.5, fontWeight: 700, color: theme.text, margin: 0 }}>{product.name}</p>
          <p style={{ fontSize: 10.5, color: theme.hint, margin: 0 }}>Pix</p>
        </div>
        <p style={{ fontSize: 14.5, fontWeight: 800, color: theme.text, margin: 0 }}>{formatBRL(product.price)}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px 0 14px' }}>
        <div style={{ width: 200, height: 200, borderRadius: 16, background: theme.fieldBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 11, overflow: 'hidden', boxShadow: theme.glow ? `0 0 30px ${accent}44` : 'none' }}>
          {qrImgSrc ? (
            // eslint-disable-next-line @next/next/no-img-element -- external QR image, not a Next-optimizable local asset
            <img src={qrImgSrc} alt="QR code Pix" width={180} height={180} />
          ) : <Spinner color={accent} />}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 700, color: '#10b981' }}>
          <span style={{ width: 7, height: 7, borderRadius: 999, background: '#10b981', animation: 'ma-pulse 1.4s ease-in-out infinite' }} />
          Aguardando pagamento
        </div>
      </div>

      {checkout.pix_code && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: theme.fieldBg, borderRadius: 12, padding: '10px 12px', marginBottom: 14 }}>
          <code style={{ flex: 1, fontSize: 10, color: theme.hint, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{checkout.pix_code}</code>
          <button
            onClick={() => { navigator.clipboard.writeText(checkout.pix_code!); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
            style={{ fontSize: 11, fontWeight: 700, color: accent, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
          >
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {[
          'Abra o app do seu banco e escolha Pix Copia e Cola',
          'Cole o código ou escaneie o QR acima',
          'Confirme — o acesso chega automaticamente aqui no chat',
        ].map((step, i) => (
          <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', fontSize: 11.5, color: theme.hint, lineHeight: 1.5 }}>
            <span style={{ width: 17, height: 17, borderRadius: 999, background: theme.fieldBg, color: theme.hint, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9.5, fontWeight: 800, flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
            <span>{step}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
