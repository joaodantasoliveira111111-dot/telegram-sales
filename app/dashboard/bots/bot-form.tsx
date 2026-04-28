'use client'

import { useState } from 'react'
import { Bot, CreateBotForm } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Zap, Package, Link as LinkIcon, Bot as BotIcon, Sparkles, ArrowRight, Eye, MessageCircle, FlaskConical, ShieldCheck, ChevronRight, X, Check, GitBranch, CreditCard } from 'lucide-react'
import { MediaUpload } from '@/components/media-upload'
import { FUNNEL_TEMPLATES, FunnelTemplate } from '@/lib/funnel-templates'

interface BotFormProps {
  bot?: Bot
  onSaved: (bot: Bot) => void
  onCancel: () => void
}

type BotType = 'account_stock' | 'channel_link'
type FlowType = 'direct' | 'presentation' | 'consultive' | 'visual'

export function BotForm({ bot, onSaved, onCancel }: BotFormProps) {
  const isEdit = !!bot
  const [loading, setLoading] = useState(false)
  const [botfatherLoading, setBotfatherLoading] = useState(false)
  const [error, setError] = useState('')
  const botAny = bot as Bot & { bot_type?: string; flow_type?: string; ab_test_enabled?: boolean; flow_type_b?: string; protect_content?: boolean }
  const [botType, setBotType] = useState<BotType>(botAny?.bot_type as BotType ?? 'channel_link')
  const [flowType, setFlowType] = useState<FlowType>(botAny?.flow_type as FlowType ?? 'direct')
  const [abEnabled, setAbEnabled] = useState<boolean>(botAny?.ab_test_enabled ?? false)
  const [flowTypeB, setFlowTypeB] = useState<FlowType>(botAny?.flow_type_b as FlowType ?? 'presentation')
  const [protectContent, setProtectContent] = useState<boolean>(botAny?.protect_content ?? false)
  const [gateway, setGateway] = useState<'default' | 'amplopay' | 'pushinpay'>((botAny as Record<string, unknown>)?.gateway as 'amplopay' | 'pushinpay' ?? 'default')
  const [selectedTemplate, setSelectedTemplate] = useState<FunnelTemplate | null>(null)
  const [form, setForm] = useState<CreateBotForm & { bot_type?: string; flow_type?: string }>({
    name: bot?.name ?? '',
    telegram_token: bot?.telegram_token ?? '',
    welcome_message: bot?.welcome_message ?? 'Olá! Seja bem-vindo(a). Escolha um plano abaixo:',
    welcome_media_url: bot?.welcome_media_url ?? '',
    welcome_media_type: bot?.welcome_media_type ?? undefined,
    bot_type: botAny?.bot_type ?? 'channel_link',
    flow_type: botAny?.flow_type ?? 'direct',
  })
  const [botUsername, setBotUsername] = useState('')
  const [showBotFather, setShowBotFather] = useState(false)

  function applyTemplate(t: FunnelTemplate) {
    setSelectedTemplate(t)
    setBotType(t.bot_type)
    setFlowType(t.flow_type)
    setProtectContent(t.protect_content)
    if (!form.name) {
      setForm(f => ({ ...f, welcome_message: t.messages.welcome ?? f.welcome_message }))
    } else {
      setForm(f => ({ ...f, welcome_message: t.messages.welcome ?? f.welcome_message }))
    }
  }

  async function handleBotFatherCreate() {
    if (!form.name || !botUsername) {
      setError('Preencha o nome do bot e o username para criação automática')
      return
    }
    setError('')
    setBotfatherLoading(true)
    try {
      const res = await fetch('/api/bots/create-via-botfather', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botName: form.name, botUsername }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setForm((f) => ({ ...f, telegram_token: data.token }))
      setShowBotFather(false)
    } finally {
      setBotfatherLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const url = bot ? `/api/bots/${bot.id}` : '/api/bots'
      const method = bot ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          bot_type: botType,
          flow_type: flowType,
          ab_test_enabled: abEnabled,
          flow_type_b: flowTypeB,
          protect_content: protectContent,
          gateway: gateway === 'default' ? null : gateway,
          welcome_media_url: form.welcome_media_url || null,
          welcome_media_type: form.welcome_media_type || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erro ao salvar bot.'); return }

      // Apply template after creation
      if (!isEdit && selectedTemplate) {
        await fetch('/api/funnel-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bot_id: data.id, template_id: selectedTemplate.id }),
        })
      }

      onSaved(data)
    } finally {
      setLoading(false)
    }
  }

  const flowOptions: { value: FlowType; label: string; desc: string; badge: string; icon: React.ReactNode; color: string }[] = [
    {
      value: 'direct',
      label: 'Direto',
      desc: 'Boas-vindas + planos na mesma mensagem. Rápido e simples.',
      badge: 'Simples',
      icon: <ArrowRight className="h-4 w-4" />,
      color: 'slate',
    },
    {
      value: 'presentation',
      label: 'Apresentação',
      desc: 'Boas-vindas → explica como funciona e entrega → planos. Recomendado para venda de contas.',
      badge: 'Recomendado',
      icon: <Eye className="h-4 w-4" />,
      color: 'blue',
    },
    {
      value: 'consultive',
      label: 'Consultivo',
      desc: 'Boas-vindas + botão "Como funciona?" → clica → explica entrega → planos.',
      badge: 'Alta conversão',
      icon: <MessageCircle className="h-4 w-4" />,
      color: 'violet',
    },
    {
      value: 'visual',
      label: 'Fluxo Visual',
      desc: 'Monte uma jornada personalizada com o editor de fluxo drag-and-drop.',
      badge: 'Avançado',
      icon: <GitBranch className="h-4 w-4" />,
      color: 'emerald',
    },
  ]

  const typeOptions: { value: BotType; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      value: 'channel_link',
      label: 'Canal / Link',
      desc: 'Vende acesso a canal do Telegram, grupo ou link externo',
      icon: <LinkIcon className="h-5 w-5 text-blue-400" />,
    },
    {
      value: 'account_stock',
      label: 'Venda de Contas',
      desc: 'Entrega automática de login/senha do seu estoque',
      icon: <Package className="h-5 w-5 text-violet-400" />,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)' }}
          >
            <BotIcon className="h-4.5 w-4.5 text-blue-400" />
          </div>
          <CardTitle>{isEdit ? 'Editar Bot' : 'Novo Bot'}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <p className="rounded-xl px-4 py-2.5 text-sm text-red-300" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</p>
          )}

          {/* Template Selection — only on creation */}
          {!isEdit && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Template de Funil <span className="text-slate-500 font-normal">(opcional)</span></Label>
                {selectedTemplate && (
                  <button type="button" onClick={() => setSelectedTemplate(null)} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300">
                    <X className="h-3 w-3" /> Remover
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500">Selecione um template para pré-configurar mensagens, planos e fluxo automaticamente.</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {FUNNEL_TEMPLATES.map((t) => {
                  const active = selectedTemplate?.id === t.id
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => active ? setSelectedTemplate(null) : applyTemplate(t)}
                      className="relative rounded-xl p-3 text-left transition-all duration-150"
                      style={active ? {
                        background: 'rgba(59,130,246,0.12)',
                        border: '1px solid rgba(59,130,246,0.4)',
                        boxShadow: '0 0 16px rgba(59,130,246,0.12)',
                      } : {
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.07)',
                      }}
                    >
                      {active && (
                        <div className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full" style={{ background: 'rgba(59,130,246,0.8)' }}>
                          <Check className="h-2.5 w-2.5 text-white" />
                        </div>
                      )}
                      <span className="text-lg leading-none">{t.emoji}</span>
                      <p className={`mt-1.5 text-xs font-semibold ${active ? 'text-blue-300' : 'text-slate-300'}`}>{t.name}</p>
                      <p className="mt-0.5 text-[10px] text-slate-500">{t.niche}</p>
                    </button>
                  )
                })}
              </div>
              {selectedTemplate && (
                <div
                  className="rounded-xl p-3 space-y-1.5"
                  style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)' }}
                >
                  <p className="text-xs font-medium text-blue-300">{selectedTemplate.emoji} {selectedTemplate.name} selecionado</p>
                  <p className="text-xs text-slate-400">{selectedTemplate.description}</p>
                  {selectedTemplate.tips.length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {selectedTemplate.tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-[10px] text-slate-500">
                          <ChevronRight className="h-2.5 w-2.5 mt-0.5 flex-shrink-0 text-blue-500" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Bot Type — only on creation */}
          {!isEdit && (
            <div className="space-y-2">
              <Label>Tipo do Bot</Label>
              <div className="grid grid-cols-2 gap-3">
                {typeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setBotType(opt.value)}
                    className="rounded-xl p-4 text-left transition-all duration-150"
                    style={botType === opt.value ? {
                      background: 'rgba(59,130,246,0.12)',
                      border: '1px solid rgba(59,130,246,0.4)',
                      boxShadow: '0 0 20px rgba(59,130,246,0.15)',
                    } : {
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <div className="mb-2">{opt.icon}</div>
                    <p className={`text-sm font-semibold ${botType === opt.value ? 'text-blue-300' : 'text-slate-300'}`}>{opt.label}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Flow Type */}
          <div className="space-y-2">
            <Label>Fluxo de venda</Label>
            <p className="text-xs text-slate-500">Define a sequência de mensagens quando o usuário inicia o bot</p>
            <div className="space-y-2">
              {flowOptions.map((opt) => {
                const active = flowType === opt.value
                const colorMap: Record<string, { bg: string; border: string; text: string; badgeBg: string }> = {
                  slate: { bg: 'rgba(100,116,139,0.10)', border: 'rgba(100,116,139,0.35)', text: 'text-slate-300', badgeBg: 'rgba(100,116,139,0.2)' },
                  blue: { bg: 'rgba(59,130,246,0.10)', border: 'rgba(59,130,246,0.35)', text: 'text-blue-300', badgeBg: 'rgba(59,130,246,0.2)' },
                  violet: { bg: 'rgba(139,92,246,0.10)', border: 'rgba(139,92,246,0.35)', text: 'text-violet-300', badgeBg: 'rgba(139,92,246,0.2)' },
                  emerald: { bg: 'rgba(52,211,153,0.10)', border: 'rgba(52,211,153,0.35)', text: 'text-emerald-300', badgeBg: 'rgba(52,211,153,0.2)' },
                }
                const c = colorMap[opt.color]
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFlowType(opt.value)}
                    className="w-full rounded-xl p-3.5 text-left transition-all duration-150"
                    style={active ? {
                      background: c.bg,
                      border: `1px solid ${c.border}`,
                      boxShadow: `0 0 16px ${c.border}`,
                    } : {
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className={active ? c.text : 'text-slate-500'}>{opt.icon}</span>
                        <span className={`text-sm font-semibold ${active ? c.text : 'text-slate-400'}`}>{opt.label}</span>
                      </div>
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: active ? c.badgeBg : 'rgba(255,255,255,0.05)', color: active ? undefined : '#64748b' }}
                      >
                        {opt.badge}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 pl-6.5">{opt.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* A/B Test */}
          <div
            className="rounded-xl p-4 space-y-3"
            style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-violet-400" />
                <p className="text-sm font-medium text-slate-200">Teste A/B de fluxo</p>
              </div>
              <button
                type="button"
                onClick={() => setAbEnabled((s) => !s)}
                className="relative h-5 w-9 rounded-full transition-colors duration-200 flex-shrink-0"
                style={{ background: abEnabled ? 'rgba(139,92,246,0.6)' : 'rgba(255,255,255,0.1)' }}
              >
                <span
                  className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-200"
                  style={{ transform: abEnabled ? 'translateX(16px)' : 'translateX(0)' }}
                />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Divide os usuários 50/50 entre dois fluxos para medir qual converte mais. Veja os resultados em <b className="text-slate-400">Funil</b>.
            </p>
            {abEnabled && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="rounded px-1.5 py-0.5 font-semibold" style={{ background: 'rgba(96,165,250,0.15)', color: '#93c5fd' }}>A</span>
                  <span>Variante A: <span className="text-slate-300 font-medium">{flowType === 'direct' ? 'Direto' : flowType === 'presentation' ? 'Apresentação' : 'Consultivo'}</span> (fluxo principal acima)</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                    <span className="rounded px-1.5 py-0.5 font-semibold" style={{ background: 'rgba(167,139,250,0.15)', color: '#c4b5fd' }}>B</span>
                    <span>Variante B:</span>
                  </div>
                  <div className="space-y-1.5 pl-5">
                    {flowOptions.filter((o) => o.value !== flowType).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFlowTypeB(opt.value)}
                        className="w-full rounded-lg p-2.5 text-left flex items-center gap-2.5 transition-all duration-150"
                        style={flowTypeB === opt.value ? {
                          background: 'rgba(139,92,246,0.12)',
                          border: '1px solid rgba(139,92,246,0.3)',
                        } : {
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        <span className={flowTypeB === opt.value ? 'text-violet-400' : 'text-slate-500'}>{opt.icon}</span>
                        <div>
                          <p className={`text-xs font-semibold ${flowTypeB === opt.value ? 'text-violet-300' : 'text-slate-400'}`}>{opt.label}</p>
                          <p className="text-[10px] text-slate-600">{opt.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Anti-fraud / Protect Content */}
          <div
            className="rounded-xl p-4"
            style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.12)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 text-red-400" />
                <div>
                  <p className="text-sm font-medium text-slate-200">Anti-fraude (Protect Content)</p>
                  <p className="text-xs text-slate-500 mt-0.5">Bloqueia encaminhamento e download de mídia no Telegram</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProtectContent((s) => !s)}
                className="relative h-5 w-9 rounded-full transition-colors duration-200 flex-shrink-0"
                style={{ background: protectContent ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.1)' }}
              >
                <span
                  className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-200"
                  style={{ transform: protectContent ? 'translateX(16px)' : 'translateX(0)' }}
                />
              </button>
            </div>
          </div>

          {/* Gateway per bot */}
          <div
            className="rounded-xl p-4 space-y-3"
            style={{ background: 'rgba(52,211,153,0.04)', border: '1px solid rgba(52,211,153,0.12)' }}
          >
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-400" />
              <p className="text-sm font-medium text-slate-200">Gateway de Pagamento</p>
            </div>
            <p className="text-xs text-slate-500">Escolha o gateway para este bot. <span className="text-slate-400">Padrão</span> usa o gateway global das Configurações.</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'default', label: 'Padrão', desc: 'Global' },
                { value: 'amplopay', label: 'AmploPay', desc: 'Forçar' },
                { value: 'pushinpay', label: 'PushinPay', desc: 'Forçar' },
              ] as const).map((opt) => {
                const active = gateway === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setGateway(opt.value)}
                    className="rounded-lg p-2.5 text-left transition-all duration-150"
                    style={active ? {
                      background: 'rgba(52,211,153,0.12)',
                      border: '1px solid rgba(52,211,153,0.35)',
                    } : {
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <p className={`text-xs font-semibold ${active ? 'text-emerald-300' : 'text-slate-400'}`}>{opt.label}</p>
                    <p className="text-[10px] text-slate-600">{opt.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome do Bot</Label>
            <Input
              id="name"
              placeholder="Meu Bot de Vendas"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          {/* Token */}
          <div className="space-y-1.5">
            <Label htmlFor="token">Token do Telegram</Label>
            <div className="flex gap-2">
              <Input
                id="token"
                placeholder="110201543:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw"
                value={form.telegram_token}
                onChange={(e) => setForm({ ...form, telegram_token: e.target.value })}
                required
                className="flex-1"
              />
              {!isEdit && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBotFather((s) => !s)}
                  title="Criar via BotFather automaticamente"
                >
                  <Sparkles className="h-4 w-4 text-violet-400" />
                  Auto
                </Button>
              )}
            </div>
            <p className="text-xs text-slate-600">Obtenha em @BotFather ou use o botão Auto</p>
          </div>

          {/* BotFather auto-create panel */}
          {showBotFather && !isEdit && (
            <div
              className="rounded-xl p-4 space-y-3"
              style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.2)' }}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-400" />
                <p className="text-sm font-medium text-violet-300">Criar via BotFather automaticamente</p>
              </div>
              <p className="text-xs text-slate-500">Usa sua conta Telegram conectada para criar o bot no BotFather e puxar o token.</p>
              <div className="space-y-1.5">
                <Label htmlFor="bot-username">Username do bot</Label>
                <Input
                  id="bot-username"
                  placeholder="meubot (deve terminar em 'bot')"
                  value={botUsername}
                  onChange={(e) => setBotUsername(e.target.value)}
                />
                <p className="text-xs text-slate-600">Ex: FlowBot, vendas_bot, meuproduto_bot</p>
              </div>
              <Button
                type="button"
                onClick={handleBotFatherCreate}
                disabled={botfatherLoading || !form.name || !botUsername}
                className="w-full"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
              >
                {botfatherLoading
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Criando via BotFather...</>
                  : <><Zap className="h-4 w-4" /> Criar e puxar token</>
                }
              </Button>
            </div>
          )}

          {/* Welcome message */}
          <div className="space-y-1.5">
            <Label htmlFor="welcome">Mensagem de Boas-vindas</Label>
            <Textarea
              id="welcome"
              placeholder="Olá! Seja bem-vindo(a). Escolha um plano abaixo:"
              value={form.welcome_message}
              onChange={(e) => setForm({ ...form, welcome_message: e.target.value })}
              required
              className="min-h-[90px]"
            />
          </div>

          {/* Media */}
          <div className="space-y-1.5">
            <Label>Mídia de boas-vindas (opcional)</Label>
            <MediaUpload
              value={form.welcome_media_url ?? ''}
              mediaType={form.welcome_media_type ?? ''}
              onChange={(url, type) => setForm({ ...form, welcome_media_url: url, welcome_media_type: type as 'image' | 'video' })}
              onClear={() => setForm({ ...form, welcome_media_url: '', welcome_media_type: undefined })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? 'Salvar' : selectedTemplate ? `Criar com template ${selectedTemplate.emoji}` : 'Criar Bot'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
