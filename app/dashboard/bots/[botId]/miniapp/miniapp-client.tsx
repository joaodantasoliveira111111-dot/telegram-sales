'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Rocket, Copy, Check, ExternalLink, Loader2, Store, Palette, Package2,
  Eye, EyeOff,
} from 'lucide-react'
import { MiniAppConfig, MiniAppTheme, Plan } from '@/types'

// ─── Theme presets ──────────────────────────────────────────────────────────

const THEMES: { id: MiniAppTheme; label: string; desc: string; a: string; b: string; c: string; dark: boolean }[] = [
  { id: 'aurora', label: 'Aurora', desc: 'Gradiente violeta com brilho suave', a: '#7c3aed', b: '#c026d3', c: '#4c1d95', dark: false },
  { id: 'neon', label: 'Neon', desc: 'Fundo escuro, grade tech e glow', a: '#0ea5e9', b: '#a855f7', c: '#020617', dark: true },
  { id: 'mono', label: 'Mono', desc: 'Preto e branco, minimalista', a: '#18181b', b: '#3f3f46', c: '#09090b', dark: true },
  { id: 'glass', label: 'Vidro', desc: 'Translúcido, claro e leve', a: '#38bdf8', b: '#818cf8', c: '#0369a1', dark: false },
  { id: 'sunset', label: 'Pôr do sol', desc: 'Laranja e rosa, quente', a: '#f97316', b: '#e11d48', c: '#7c2d12', dark: false },
]

const ACCENTS = [
  { main: '#7c3aed', soft: '#a78bfa', label: 'Violeta' },
  { main: '#2563eb', soft: '#60a5fa', label: 'Azul' },
  { main: '#059669', soft: '#34d399', label: 'Esmeralda' },
  { main: '#e11d48', soft: '#fb7185', label: 'Rosa' },
  { main: '#d97706', soft: '#fbbf24', label: 'Âmbar' },
  { main: '#0f172a', soft: '#475569', label: 'Grafite' },
]

const LOGO_OPTIONS = ['🛍️', '✨', '🎬', '💻', '🎮', '🎓', '📦', '💎']

interface MiniAppClientProps {
  botId: string
  botUsername: string
  initialConfig: MiniAppConfig
  initialPlans: Plan[]
}

export function MiniAppClient({ botId, botUsername, initialConfig, initialPlans }: MiniAppClientProps) {
  const [tab, setTab] = useState<'guide' | 'customize' | 'products'>('guide')
  const [config, setConfig] = useState<MiniAppConfig>(initialConfig)
  const [plans, setPlans] = useState<Plan[]>(initialPlans)
  const [saving, setSaving] = useState(false)

  const storeUrl = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/store/${botId}`
  }, [botId])

  async function saveConfig(patch: Partial<MiniAppConfig>) {
    const next = { ...config, ...patch }
    setConfig(next)
    setSaving(true)
    try {
      const res = await fetch(`/api/bots/${botId}/miniapp`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) { toast.error('Erro ao salvar'); return }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold" style={{ color: '#1a1625' }}>Mini App</h2>
          <p className="text-sm" style={{ color: '#71717a' }}>Uma loja dentro do Telegram, sem sair do chat</p>
        </div>
        <div className="flex items-center gap-2">
          {config.enabled && (
            <a href={storeUrl} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm"><ExternalLink className="mr-1.5 h-3.5 w-3.5" />Abrir loja</Button>
            </a>
          )}
          <StatusPill enabled={config.enabled} saving={saving} onToggle={(v) => saveConfig({ enabled: v })} />
        </div>
      </div>

      <div className="flex gap-1 rounded-2xl p-1.5" style={{ background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(255,255,255,0.82)' }}>
        <TabButton active={tab === 'guide'} onClick={() => setTab('guide')} icon={Rocket} label="Como criar" />
        <TabButton active={tab === 'customize'} onClick={() => setTab('customize')} icon={Palette} label="Personalizar" />
        <TabButton active={tab === 'products'} onClick={() => setTab('products')} icon={Package2} label="Produtos" />
      </div>

      {tab === 'guide' && <GuideTab botId={botId} botUsername={botUsername} config={config} storeUrl={storeUrl} />}
      {tab === 'customize' && <CustomizeTab config={config} onSave={saveConfig} />}
      {tab === 'products' && <ProductsTab plans={plans} setPlans={setPlans} />}
    </div>
  )
}

// ─── Shared bits ────────────────────────────────────────────────────────────

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
      style={active
        ? { background: 'linear-gradient(135deg, rgba(124,58,237,0.14), rgba(168,85,247,0.08))', border: '1px solid rgba(124,58,237,0.25)', color: '#6d28d9' }
        : { color: '#71717a', border: '1px solid transparent' }}
    >
      <Icon className="h-4 w-4" style={{ color: active ? '#7c3aed' : '#a1a1aa' }} />
      {label}
    </button>
  )
}

function StatusPill({ enabled, saving, onToggle }: { enabled: boolean; saving: boolean; onToggle: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onToggle(!enabled)}
      disabled={saving}
      className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all disabled:opacity-60"
      style={enabled
        ? { background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#059669' }
        : { background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.1)', color: '#71717a' }}
    >
      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <span className="h-1.5 w-1.5 rounded-full" style={{ background: enabled ? '#10b981' : '#a1a1aa' }} />}
      {enabled ? 'Loja ativa' : 'Loja desativada'}
    </button>
  )
}

function CopyField({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2 rounded-xl px-3.5 py-2.5" style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.08)' }}>
        <code className="flex-1 truncate text-xs" style={{ color: '#3f3f46' }}>{value}</code>
        <button
          onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
          className="shrink-0 rounded-lg p-1.5 transition-colors hover:bg-black/5"
          style={{ color: copied ? '#059669' : '#7c3aed' }}
          title="Copiar"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  )
}

// ─── Guide tab ──────────────────────────────────────────────────────────────

function GuideTab({ botId, botUsername, config, storeUrl }: { botId: string; botUsername: string; config: MiniAppConfig; storeUrl: string }) {
  const steps = [
    {
      n: 1,
      title: 'Ative a loja e escolha um nome curto',
      body: 'Vá na aba "Personalizar" e ative sua loja. O nome curto (sem espaços, minúsculo) é o que aparece no final do link do seu app — ex: loja, vip, contas.',
    },
    {
      n: 2,
      title: 'Abra uma conversa com o @BotFather',
      body: 'No Telegram, procure @BotFather e envie o comando abaixo.',
      copy: '/newapp',
    },
    {
      n: 3,
      title: 'Selecione o seu bot na lista',
      body: botUsername
        ? `O BotFather vai listar seus bots — escolha @${botUsername}.`
        : 'O BotFather vai listar seus bots — escolha o bot desta loja.',
    },
    {
      n: 4,
      title: 'Cole a URL da sua loja quando ele pedir',
      body: 'Essa é a URL exata que você configurou aqui no FlowBot — é ela que abre dentro do Telegram.',
      copy: storeUrl || `https://seu-dominio.com/store/${botId}`,
    },
    {
      n: 5,
      title: 'Escolha um nome e envie um ícone 512×512',
      body: 'O BotFather pede um título (ex: "Loja") e uma imagem quadrada — qualquer PNG serve pra testar, dá pra trocar depois.',
    },
    {
      n: 6,
      title: 'Defina o nome curto do app',
      body: 'Use exatamente o mesmo valor que você colocou no campo "Nome curto do app" na aba Personalizar.',
      copy: config.app_short_name,
    },
    {
      n: 7,
      title: 'Pronto — teste o link',
      body: 'Seu Mini App já está no ar. Cole esse link em qualquer chat do Telegram e clique pra abrir a loja.',
      copy: botUsername ? `https://t.me/${botUsername}/${config.app_short_name}` : undefined,
    },
  ]

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-4 w-4" style={{ color: '#7c3aed' }} />
            Passo a passo — publicar seu Mini App
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {steps.map((s) => (
            <div key={s.n} className="flex gap-3.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={{ background: 'rgba(124,58,237,0.12)', color: '#7c3aed' }}>
                {s.n}
              </div>
              <div className="flex-1 space-y-2 pb-1">
                <p className="text-sm font-semibold" style={{ color: '#1a1625' }}>{s.title}</p>
                <p className="text-xs leading-relaxed" style={{ color: '#71717a' }}>{s.body}</p>
                {s.copy && <div className="max-w-sm"><CopyField value={s.copy} label="" /></div>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardContent className="p-4 space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#71717a' }}>Por que um passo manual?</p>
            <p className="text-xs leading-relaxed" style={{ color: '#71717a' }}>
              O Telegram não abre isso pra automação — só o próprio dono do bot, conversando com o @BotFather, pode registrar o Mini App. É rápido (menos de 2 minutos) e só precisa ser feito uma vez.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#71717a' }}>Dica</p>
            <p className="text-xs leading-relaxed" style={{ color: '#71717a' }}>
              Depois de criar, o BotFather pergunta se quer fixar o app como <b>Menu Button</b> do bot — responda que sim pra ele aparecer como um botão de loja ao lado do campo de digitar.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ─── Customize tab ──────────────────────────────────────────────────────────

function CustomizeTab({ config, onSave }: { config: MiniAppConfig; onSave: (patch: Partial<MiniAppConfig>) => void }) {
  const [local, setLocal] = useState(config)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)

  function update<K extends keyof MiniAppConfig>(key: K, value: MiniAppConfig[K]) {
    setLocal((l) => ({ ...l, [key]: value }))
    setDirty(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await onSave(local)
      setDirty(false)
      toast.success('Loja personalizada com sucesso!')
    } finally {
      setSaving(false)
    }
  }

  const theme = THEMES.find((t) => t.id === local.theme) ?? THEMES[0]

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <Card>
        <CardContent className="p-5 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Nome da loja</Label>
              <Input value={local.store_name} onChange={(e) => update('store_name', e.target.value)} maxLength={24} />
            </div>
            <div className="space-y-1.5">
              <Label>Nome curto do app</Label>
              <Input
                value={local.app_short_name}
                onChange={(e) => update('app_short_name', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="loja"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Frase de efeito</Label>
            <Input value={local.tagline} onChange={(e) => update('tagline', e.target.value)} maxLength={48} />
          </div>

          <div className="space-y-2">
            <Label>Tema visual</Label>
            <div className="grid grid-cols-5 gap-2.5">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => update('theme', t.id)}
                  className="rounded-xl p-2.5 text-left transition-all"
                  style={{
                    border: local.theme === t.id ? '2px solid #7c3aed' : '2px solid transparent',
                    background: 'rgba(0,0,0,0.03)',
                  }}
                >
                  <div className="mb-2 h-10 w-full rounded-lg" style={{ background: `linear-gradient(135deg, ${t.a}, ${t.b} 55%, ${t.c})` }} />
                  <p className="text-[11px] font-bold" style={{ color: '#1a1625' }}>{t.label}</p>
                  <p className="text-[9.5px] leading-tight" style={{ color: '#a1a1aa' }}>{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cor de destaque</Label>
            <div className="flex flex-wrap gap-2.5">
              {ACCENTS.map((a) => (
                <button
                  key={a.main}
                  onClick={() => { update('accent', a.main); update('accent_2', a.soft) }}
                  className="h-8 w-8 rounded-full transition-transform hover:scale-110"
                  style={{
                    background: a.main,
                    boxShadow: local.accent === a.main ? '0 0 0 2px #fff, 0 0 0 4px #1a1625' : '0 0 0 1px rgba(0,0,0,0.1)',
                  }}
                  title={a.label}
                />
              ))}
              <label className="relative h-8 w-8 cursor-pointer overflow-hidden rounded-full" style={{ background: 'conic-gradient(from 0deg, red, yellow, lime, cyan, blue, magenta, red)' }} title="Cor personalizada">
                <input
                  type="color"
                  value={local.accent}
                  onChange={(e) => update('accent', e.target.value)}
                  className="absolute -inset-1 h-10 w-10 cursor-pointer border-none p-0"
                />
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Ícone da loja</Label>
            <div className="flex flex-wrap gap-2">
              {LOGO_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => update('logo_emoji', emoji)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-lg transition-all"
                  style={{ background: 'rgba(0,0,0,0.04)', border: local.logo_emoji === emoji ? '2px solid #7c3aed' : '2px solid transparent' }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Layout do catálogo</Label>
              <div className="flex rounded-xl p-1" style={{ background: 'rgba(0,0,0,0.04)' }}>
                <button onClick={() => update('layout', 'grid')} className="flex-1 rounded-lg py-2 text-xs font-semibold transition-all"
                  style={local.layout === 'grid' ? { background: '#fff', color: '#1a1625', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } : { color: '#a1a1aa' }}>▦ Grade</button>
                <button onClick={() => update('layout', 'list')} className="flex-1 rounded-lg py-2 text-xs font-semibold transition-all"
                  style={local.layout === 'list' ? { background: '#fff', color: '#1a1625', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } : { color: '#a1a1aa' }}>☰ Lista</button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Selo de avaliação</Label>
              <div className="flex gap-2">
                <Input value={local.rating_value} onChange={(e) => update('rating_value', e.target.value)} placeholder="4.9" className="w-16" />
                <Input value={local.rating_count_label} onChange={(e) => update('rating_count_label', e.target.value)} placeholder="+2.400 vendas" />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            {([
              ['show_categories', 'Mostrar categorias'],
              ['show_rating', 'Mostrar selo de avaliação'],
              ['show_trust_badges', 'Mostrar rodapé de confiança'],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex cursor-pointer items-center justify-between rounded-lg px-1 py-2.5 text-sm" style={{ color: '#3f3f46' }}>
                {label}
                <input
                  type="checkbox"
                  checked={local[key] as boolean}
                  onChange={(e) => update(key, e.target.checked as MiniAppConfig[typeof key])}
                  className="h-4 w-4 accent-violet-600"
                />
              </label>
            ))}
          </div>

          <div className="flex justify-end pt-1">
            <Button onClick={handleSave} disabled={!dirty || saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar personalização
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Live preview */}
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#71717a' }}>Prévia</p>
        <div
          className="overflow-hidden rounded-[28px] p-1.5 shadow-xl"
          style={{ background: theme.dark ? '#050505' : '#e4e4e7' }}
        >
          <div className="overflow-hidden rounded-[22px]" style={{ background: theme.dark ? '#0e1621' : '#ffffff' }}>
            <div
              className="flex h-24 flex-col items-center justify-center gap-1.5 text-center text-white"
              style={{ background: `linear-gradient(135deg, ${local.accent}, ${local.accent_2} 60%, ${theme.c})` }}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/95 text-sm">{local.logo_emoji}</div>
              <p className="text-[13px] font-bold">{local.store_name || 'Minha Loja'}</p>
            </div>
            <div className="p-3 space-y-2">
              <p className="text-[10px]" style={{ color: theme.dark ? '#7a8a99' : '#a1a1aa' }}>{local.tagline}</p>
              {local.show_rating && (
                <span className="inline-block rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: theme.dark ? '#1c2733' : '#f4f2f8', color: theme.dark ? '#f0f3f6' : '#3f3f46' }}>
                  ⭐ {local.rating_value} · {local.rating_count_label}
                </span>
              )}
              <div className={local.layout === 'grid' ? 'grid grid-cols-2 gap-1.5 pt-1' : 'flex flex-col gap-1.5 pt-1'}>
                {[1, 2].map((i) => (
                  <div key={i} className="rounded-lg p-1.5" style={{ background: theme.dark ? '#1c2733' : '#f4f2f8' }}>
                    <div className="mb-1 h-8 rounded" style={{ background: `linear-gradient(135deg, ${local.accent}, ${local.accent_2})` }} />
                    <p className="text-[8.5px] font-bold" style={{ color: theme.dark ? '#f0f3f6' : '#1a1625' }}>Produto {i}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-2.5">
              <div className="rounded-lg py-2 text-center text-[10px] font-bold text-white" style={{ background: local.accent }}>
                Ver loja
              </div>
            </div>
          </div>
        </div>
        <p className="text-[11px] leading-relaxed" style={{ color: '#a1a1aa' }}>
          Aproximação — o app real segue o tema completo escolhido, com mais produtos, categorias e o checkout Pix.
        </p>
      </div>
    </div>
  )
}

// ─── Products tab ───────────────────────────────────────────────────────────

function ProductsTab({ plans, setPlans }: { plans: Plan[]; setPlans: (p: Plan[]) => void }) {
  const [savingId, setSavingId] = useState<string | null>(null)

  async function updatePlan(id: string, patch: Partial<Plan>) {
    setPlans(plans.map((p) => p.id === id ? { ...p, ...patch } : p))
    setSavingId(id)
    try {
      const res = await fetch(`/api/plans/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) toast.error('Erro ao salvar produto')
    } finally {
      setSavingId(null)
    }
  }

  if (plans.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
          <Store className="h-8 w-8" style={{ color: '#a1a1aa' }} />
          <p className="text-sm" style={{ color: '#71717a' }}>
            Nenhum plano cadastrado ainda. Crie planos na aba <b>Planos</b> — eles aparecem aqui pra você escolher quais mostrar na loja do Mini App.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package2 className="h-4 w-4" style={{ color: '#7c3aed' }} />
          Produtos na loja
        </CardTitle>
        <p className="text-xs" style={{ color: '#71717a' }}>
          Escolha quais planos aparecem no Mini App e como eles são exibidos. Pra cadastrar um plano novo (ou o estoque dele), use a aba <b>Planos</b>{plans.some(p => p.content_type === 'account_stock') ? ' e Estoque' : ''}.
        </p>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {plans.map((plan) => (
          <div key={plan.id} className="rounded-xl p-3.5" style={{ background: 'rgba(0,0,0,0.025)', border: '1px solid rgba(0,0,0,0.06)' }}>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => updatePlan(plan.id, { miniapp_visible: !plan.miniapp_visible })}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold shrink-0"
                style={plan.miniapp_visible
                  ? { background: 'rgba(16,185,129,0.12)', color: '#059669' }
                  : { background: 'rgba(0,0,0,0.05)', color: '#a1a1aa' }}
              >
                {plan.miniapp_visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                {plan.miniapp_visible ? 'Na loja' : 'Oculto'}
              </button>

              <div className="min-w-[120px] flex-1">
                <p className="text-sm font-semibold" style={{ color: '#1a1625' }}>{plan.name}</p>
                <p className="text-xs" style={{ color: '#a1a1aa' }}>R$ {Number(plan.price).toFixed(2).replace('.', ',')}</p>
              </div>

              {savingId === plan.id && <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: '#a1a1aa' }} />}
            </div>

            {plan.miniapp_visible && (
              <div className="mt-3 grid grid-cols-2 gap-2.5 border-t pt-3 sm:grid-cols-4" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                <div className="space-y-1">
                  <Label className="text-[10px]">Ícone</Label>
                  <Input
                    defaultValue={plan.miniapp_icon ?? ''}
                    placeholder="🎬"
                    className="h-8 text-sm"
                    onBlur={(e) => e.target.value !== (plan.miniapp_icon ?? '') && updatePlan(plan.id, { miniapp_icon: e.target.value || null })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Categoria</Label>
                  <Input
                    defaultValue={plan.miniapp_category ?? ''}
                    placeholder="Streaming"
                    className="h-8 text-xs"
                    onBlur={(e) => e.target.value !== (plan.miniapp_category ?? '') && updatePlan(plan.id, { miniapp_category: e.target.value || null })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Selo (opcional)</Label>
                  <Input
                    defaultValue={plan.miniapp_featured_label ?? ''}
                    placeholder="Mais vendido"
                    className="h-8 text-xs"
                    onBlur={(e) => e.target.value !== (plan.miniapp_featured_label ?? '') && updatePlan(plan.id, { miniapp_featured_label: e.target.value || null })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Ordem</Label>
                  <Input
                    type="number"
                    defaultValue={plan.miniapp_sort ?? 0}
                    className="h-8 text-xs"
                    onBlur={(e) => Number(e.target.value) !== plan.miniapp_sort && updatePlan(plan.id, { miniapp_sort: Number(e.target.value) || 0 })}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
