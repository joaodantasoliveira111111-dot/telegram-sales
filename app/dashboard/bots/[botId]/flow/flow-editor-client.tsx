'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  type EdgeTypes,
  Handle,
  Position,
  MarkerType,
  BaseEdge,
  EdgeLabelRenderer,
  getStraightPath,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Play, MessageSquare, Clock, GitBranch, CreditCard, Gift, StopCircle,
  Plus, Save, Trash2, X, MousePointer2, Loader2, Info, Keyboard,
  CheckCircle2,
} from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────────────────────

type FlowNodeType = 'start' | 'message' | 'delay' | 'condition' | 'buttons' | 'payment' | 'deliver' | 'end'

interface NodeData {
  text?: string
  media_url?: string
  media_type?: 'photo' | 'video' | 'audio'
  delay_seconds?: number
  condition_type?: 'has_paid' | 'has_plan' | 'custom_var'
  condition_var?: string
  condition_value?: string
  buttons?: { label: string; value: string }[]
  plan_id?: string
  plan_name?: string
  deliver_type?: 'channel_link' | 'account'
  [key: string]: unknown
}

export interface Plan { id: string; name: string; price: number }

// ─── Design tokens ─────────────────────────────────────────────────────────────

const C: Record<FlowNodeType, { rgb: string; label: string; icon: React.ReactNode }> = {
  start:     { rgb: '52,211,153',  label: 'Início',      icon: <Play className="h-3.5 w-3.5" /> },
  message:   { rgb: '96,165,250',  label: 'Mensagem',    icon: <MessageSquare className="h-3.5 w-3.5" /> },
  delay:     { rgb: '251,191,36',  label: 'Delay',       icon: <Clock className="h-3.5 w-3.5" /> },
  condition: { rgb: '251,146,60',  label: 'Condição',    icon: <GitBranch className="h-3.5 w-3.5" /> },
  buttons:   { rgb: '167,139,250', label: 'Botões',      icon: <MousePointer2 className="h-3.5 w-3.5" /> },
  payment:   { rgb: '34,197,94',   label: 'Pagamento',   icon: <CreditCard className="h-3.5 w-3.5" /> },
  deliver:   { rgb: '232,121,249', label: 'Entrega',     icon: <Gift className="h-3.5 w-3.5" /> },
  end:       { rgb: '239,68,68',   label: 'Fim',         icon: <StopCircle className="h-3.5 w-3.5" /> },
}

const NODE_TIPS: Record<FlowNodeType, string> = {
  start:     'Executado quando o usuário envia /start. Conecte ao primeiro nó do seu fluxo.',
  message:   'Envia texto para o usuário. Suporta HTML (<b>, <i>, <code>) e mídia opcional.',
  delay:     'Pausa o fluxo. Na próxima mensagem do usuário o fluxo retoma automaticamente.',
  condition: 'Dois caminhos: Sim (handle verde) e Não (handle vermelho). Conecte cada um a um nó diferente.',
  buttons:   'Envia botões inline. Cada botão tem uma saída própria — arraste a seta lateral para conectar ao próximo nó.',
  payment:   'Gera PIX para o plano selecionado. Após pagamento confirmado, continua para o próximo nó.',
  deliver:   'Entrega acesso ao comprador: link único do canal/grupo ou login/senha do estoque.',
  end:       'Encerra o fluxo. A sessão do usuário é removida.',
}

// ─── Custom edge with delete button ───────────────────────────────────────────

function DeletableEdge(props: {
  id: string; sourceX: number; sourceY: number; targetX: number; targetY: number
  selected?: boolean; markerEnd?: string; style?: React.CSSProperties
}) {
  const { id, sourceX, sourceY, targetX, targetY, selected } = props
  const { setEdges } = useReactFlow()
  const [edgePath, lx, ly] = getStraightPath({ sourceX, sourceY, targetX, targetY })

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={props.markerEnd}
        style={{ stroke: selected ? '#f87171' : 'rgba(148,163,184,0.35)', strokeWidth: selected ? 2 : 1.5, transition: 'stroke 0.12s' }}
      />
      <EdgeLabelRenderer>
        <div style={{ position: 'absolute', transform: `translate(-50%,-50%) translate(${lx}px,${ly}px)`, pointerEvents: 'all', opacity: selected ? 1 : 0, transition: 'opacity 0.12s' }} className="nodrag nopan">
          <button onClick={() => setEdges(es => es.filter(e => e.id !== id))}
            className="flex h-5 w-5 items-center justify-center rounded-full text-white shadow-lg hover:scale-110 transition-transform"
            style={{ background: '#ef4444', border: '1.5px solid rgba(239,68,68,0.5)' }} title="Remover conexão">
            <X className="h-3 w-3" />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

const edgeTypes: EdgeTypes = { deletable: DeletableEdge as EdgeTypes[string] }

// ─── Node shell ────────────────────────────────────────────────────────────────

function Shell({ type, selected, hasTarget = true, hasSource = true, children }: {
  type: FlowNodeType; selected?: boolean; hasTarget?: boolean; hasSource?: boolean; children: React.ReactNode
}) {
  const c = C[type]
  return (
    <div style={{
      background: selected ? `rgba(${c.rgb},0.16)` : `rgba(${c.rgb},0.05)`,
      border: `1px solid rgba(${c.rgb},${selected ? 0.65 : 0.28})`,
      borderRadius: 14,
      minWidth: 176,
      boxShadow: selected ? `0 0 0 2px rgba(${c.rgb},0.2), 0 8px 28px rgba(0,0,0,0.5)` : '0 2px 10px rgba(0,0,0,0.35)',
      transition: 'all 0.12s',
    }}>
      {hasTarget && <Handle type="target" position={Position.Top}
        style={{ background: `rgb(${c.rgb})`, border: `2px solid rgba(${c.rgb},0.35)`, width: 10, height: 10, top: -5 }} />}
      <div className="px-3.5 py-3">{children}</div>
      {hasSource && <Handle type="source" position={Position.Bottom}
        style={{ background: `rgb(${c.rgb})`, border: `2px solid rgba(${c.rgb},0.35)`, width: 10, height: 10, bottom: -5 }} />}
    </div>
  )
}

function Header({ type, sub }: { type: FlowNodeType; sub?: string }) {
  const c = C[type]
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg" style={{ background: `rgba(${c.rgb},0.18)` }}>
        <span style={{ color: `rgb(${c.rgb})` }}>{c.icon}</span>
      </div>
      <div>
        <p className="text-xs font-bold text-slate-200 leading-none">{c.label}</p>
        {sub && <p className="text-[10px] text-slate-500 mt-0.5 leading-tight max-w-[140px]" style={{ wordBreak: 'break-word' }}>{sub}</p>}
      </div>
    </div>
  )
}

// ─── Node components ───────────────────────────────────────────────────────────

function StartNode({ selected }: { selected?: boolean }) {
  return <Shell type="start" selected={selected} hasTarget={false}><Header type="start" sub="/start → entrada do fluxo" /></Shell>
}

function MessageNode({ data, selected }: { data: NodeData; selected?: boolean }) {
  const preview = data.text ? String(data.text).slice(0, 48) + (String(data.text).length > 48 ? '…' : '') : '(sem texto)'
  return (
    <Shell type="message" selected={selected}>
      <Header type="message" sub={preview} />
      {data.media_type && <p className="mt-1.5 text-[10px] text-slate-600 pl-8">{data.media_type === 'photo' ? '🖼 com imagem' : data.media_type === 'video' ? '🎬 com vídeo' : '🎵 com áudio'}</p>}
    </Shell>
  )
}

function DelayNode({ data, selected }: { data: NodeData; selected?: boolean }) {
  const s = Number(data.delay_seconds ?? 60)
  const label = s >= 86400 ? `${Math.floor(s / 86400)}d` : s >= 3600 ? `${Math.floor(s / 3600)}h` : s >= 60 ? `${Math.floor(s / 60)} min` : `${s}s`
  return <Shell type="delay" selected={selected}><Header type="delay" sub={`Aguarda ${label}`} /></Shell>
}

function ConditionNode({ data, selected }: { data: NodeData; selected?: boolean }) {
  const c = C.condition
  const sub: Record<string, string> = { has_paid: 'Já pagou?', has_plan: 'Tem plano ativo?', custom_var: data.condition_var ? `${data.condition_var} = ?` : 'Condição personalizada' }
  return (
    <div style={{ background: selected ? `rgba(${c.rgb},0.16)` : `rgba(${c.rgb},0.05)`, border: `1px solid rgba(${c.rgb},${selected ? 0.65 : 0.28})`, borderRadius: 14, minWidth: 176, boxShadow: selected ? `0 0 0 2px rgba(${c.rgb},0.2), 0 8px 28px rgba(0,0,0,0.5)` : '0 2px 10px rgba(0,0,0,0.35)', transition: 'all 0.12s' }}>
      <Handle type="target" position={Position.Top} style={{ background: `rgb(${c.rgb})`, border: `2px solid rgba(${c.rgb},0.35)`, width: 10, height: 10, top: -5 }} />
      <div className="px-3.5 py-3">
        <Header type="condition" sub={sub[data.condition_type ?? 'has_paid']} />
        <div className="mt-2.5 flex justify-between px-1">
          <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: 'rgba(52,211,153,0.8)' }}>✓ Sim</span>
          <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: 'rgba(239,68,68,0.8)' }}>✗ Não</span>
        </div>
      </div>
      <div style={{ position: 'relative', height: 16 }}>
        <Handle type="source" id="yes" position={Position.Bottom} style={{ background: 'rgb(52,211,153)', border: '2px solid rgba(52,211,153,0.35)', width: 10, height: 10, left: '28%', bottom: -5 }} />
        <Handle type="source" id="no" position={Position.Bottom} style={{ background: 'rgb(239,68,68)', border: '2px solid rgba(239,68,68,0.35)', width: 10, height: 10, left: '72%', bottom: -5 }} />
      </div>
    </div>
  )
}

function ButtonsNode({ data, selected }: { data: NodeData; selected?: boolean }) {
  const c = C.buttons
  const btns = (data.buttons ?? []) as { label: string; value: string }[]
  return (
    <div style={{ background: selected ? `rgba(${c.rgb},0.16)` : `rgba(${c.rgb},0.05)`, border: `1px solid rgba(${c.rgb},${selected ? 0.65 : 0.28})`, borderRadius: 14, minWidth: 190, boxShadow: selected ? `0 0 0 2px rgba(${c.rgb},0.2), 0 8px 28px rgba(0,0,0,0.5)` : '0 2px 10px rgba(0,0,0,0.35)', transition: 'all 0.12s' }}>
      <Handle type="target" position={Position.Top} style={{ background: `rgb(${c.rgb})`, border: `2px solid rgba(${c.rgb},0.35)`, width: 10, height: 10, top: -5 }} />
      <div className="px-3.5 pt-3 pb-2">
        <Header type="buttons" sub={data.text ? String(data.text).slice(0, 30) : 'Escolha uma opção'} />
        <div className="mt-2.5 space-y-1.5">
          {btns.map((b, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <div className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-slate-300"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', paddingRight: 20 }}>
                <span className="truncate max-w-[120px]">{b.label || `Botão ${i + 1}`}</span>
              </div>
              <Handle type="source" id={`btn_${i}`} position={Position.Right}
                style={{ background: `rgb(${c.rgb})`, border: `2px solid rgba(${c.rgb},0.35)`, width: 8, height: 8, right: -10, top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          ))}
          {btns.length === 0 && <p className="text-[10px] text-slate-600 italic">Sem botões — adicione no painel</p>}
        </div>
      </div>
    </div>
  )
}

function PaymentNode({ data, selected }: { data: NodeData; selected?: boolean }) {
  return (
    <Shell type="payment" selected={selected}>
      <Header type="payment" sub={data.plan_name ? `Plano: ${data.plan_name}` : '⚠ Selecione um plano'} />
      <p className="mt-1 text-[10px] text-slate-600 pl-8">Gera PIX → aguarda confirmação</p>
    </Shell>
  )
}

function DeliverNode({ data, selected }: { data: NodeData; selected?: boolean }) {
  return (
    <Shell type="deliver" selected={selected}>
      <Header type="deliver" sub={data.deliver_type === 'account' ? 'Conta do estoque' : 'Link do canal/grupo'} />
    </Shell>
  )
}

function EndNode({ selected }: { selected?: boolean }) {
  return <Shell type="end" selected={selected} hasSource={false}><Header type="end" sub="Encerra o fluxo" /></Shell>
}

const nodeTypes: NodeTypes = {
  start: StartNode as NodeTypes[string],
  message: MessageNode as NodeTypes[string],
  delay: DelayNode as NodeTypes[string],
  condition: ConditionNode as NodeTypes[string],
  buttons: ButtonsNode as NodeTypes[string],
  payment: PaymentNode as NodeTypes[string],
  deliver: DeliverNode as NodeTypes[string],
  end: EndNode as NodeTypes[string],
}

// ─── Config panel ──────────────────────────────────────────────────────────────

function ConfigPanel({ node, plans, onChange, onDelete }: {
  node: Node<NodeData>; plans: Plan[]
  onChange: (id: string, data: NodeData) => void
  onDelete: (id: string) => void
}) {
  const d = node.data
  const set = (patch: Partial<NodeData>) => onChange(node.id, { ...d, ...patch })
  const c = C[node.type as FlowNodeType]

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2.5">
          <div className="h-2.5 w-2.5 rounded-full" style={{ background: `rgb(${c.rgb})`, boxShadow: `0 0 8px rgba(${c.rgb},0.7)` }} />
          <p className="text-sm font-bold text-slate-200">{c.label}</p>
        </div>
        <button onClick={() => onDelete(node.id)}
          className="rounded-lg p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Tip */}
        <div className="rounded-xl p-3 flex gap-2" style={{ background: `rgba(${c.rgb},0.06)`, border: `1px solid rgba(${c.rgb},0.15)` }}>
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: `rgba(${c.rgb},0.7)` }} />
          <p className="text-[11px] leading-relaxed text-slate-400">{NODE_TIPS[node.type as FlowNodeType]}</p>
        </div>

        {node.type === 'message' && (
          <>
            <Field label="Texto da mensagem">
              <Textarea value={String(d.text ?? '')} onChange={e => set({ text: e.target.value })}
                placeholder="Olá {nome}! Seja bem-vindo..." className="min-h-[88px] text-xs resize-none" />
              <p className="text-[10px] text-slate-600 mt-1">Variáveis: <code className="text-slate-500">{'{nome}'}</code> — HTML: &lt;b&gt; &lt;i&gt; &lt;code&gt;</p>
            </Field>
            <Field label="Mídia (opcional)">
              <div className="flex flex-wrap gap-1.5">
                {(['', 'photo', 'video', 'audio'] as const).map(t => (
                  <Chip key={t} active={(d.media_type ?? '') === t} color={c.rgb}
                    onClick={() => set({ media_type: t || undefined, media_url: t ? d.media_url : undefined })}>
                    {t === '' ? 'Nenhuma' : t === 'photo' ? '🖼 Imagem' : t === 'video' ? '🎬 Vídeo' : '🎵 Áudio'}
                  </Chip>
                ))}
              </div>
              {d.media_type && (
                <Input value={String(d.media_url ?? '')} onChange={e => set({ media_url: e.target.value })}
                  placeholder="https://cdn.exemplo.com/foto.jpg" className="text-xs mt-2" />
              )}
            </Field>
          </>
        )}

        {node.type === 'buttons' && (
          <>
            <Field label="Mensagem acima dos botões">
              <Textarea value={String(d.text ?? '')} onChange={e => set({ text: e.target.value })}
                placeholder="Escolha uma opção:" className="min-h-[52px] text-xs resize-none" />
            </Field>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Botões</span>
                <button type="button" onClick={() => set({ buttons: [...(d.buttons ?? []), { label: `Botão ${(d.buttons?.length ?? 0) + 1}`, value: `btn_${Date.now()}` }] })}
                  className="flex items-center gap-1 text-[11px] font-semibold transition-colors" style={{ color: `rgb(${c.rgb})` }}>
                  <Plus className="h-3 w-3" /> Adicionar
                </button>
              </div>
              {(d.buttons ?? []).map((btn, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[9px] font-bold"
                    style={{ background: `rgba(${c.rgb},0.15)`, color: `rgb(${c.rgb})` }}>{i + 1}</span>
                  <Input value={btn.label} onChange={e => {
                    const nb = [...(d.buttons ?? [])]
                    nb[i] = { ...nb[i], label: e.target.value }
                    set({ buttons: nb })
                  }} placeholder={`Texto do botão ${i + 1}`} className="flex-1 text-xs h-8" />
                  <button type="button" onClick={() => set({ buttons: (d.buttons ?? []).filter((_, j) => j !== i) })}
                    className="text-slate-700 hover:text-red-400 transition-colors"><X className="h-3.5 w-3.5" /></button>
                </div>
              ))}
              {(d.buttons ?? []).length > 0 && (
                <p className="text-[10px] text-slate-600 leading-relaxed">A seta lateral direita de cada botão é uma saída independente. Conecte cada uma ao próximo nó desejado.</p>
              )}
            </div>
          </>
        )}

        {node.type === 'delay' && (
          <Field label="Tempo de espera">
            <div className="grid grid-cols-3 gap-1.5 mb-2">
              {[{ l: '30s', s: 30 }, { l: '1 min', s: 60 }, { l: '5 min', s: 300 }, { l: '1 hora', s: 3600 }, { l: '6h', s: 21600 }, { l: '1 dia', s: 86400 }].map(({ l, s }) => (
                <Chip key={s} active={d.delay_seconds === s} color={c.rgb} onClick={() => set({ delay_seconds: s })}>{l}</Chip>
              ))}
            </div>
            <Input type="number" min={1} value={String(d.delay_seconds ?? 60)} onChange={e => set({ delay_seconds: Number(e.target.value) })}
              className="text-xs h-8" placeholder="Segundos personalizados" />
          </Field>
        )}

        {node.type === 'condition' && (
          <Field label="Condição">
            <div className="space-y-1.5">
              {[
                { v: 'has_paid', l: 'Já pagou?', d: 'Verdadeiro se há pagamento aprovado' },
                { v: 'has_plan', l: 'Plano ativo?', d: 'Verdadeiro se a assinatura não expirou' },
                { v: 'custom_var', l: 'Variável de sessão', d: 'Compara valor salvo no fluxo' },
              ].map(opt => (
                <button key={opt.v} type="button" onClick={() => set({ condition_type: opt.v as NodeData['condition_type'] })}
                  className="w-full rounded-xl p-3 text-left transition-all"
                  style={(d.condition_type ?? 'has_paid') === opt.v
                    ? { background: `rgba(${c.rgb},0.12)`, border: `1px solid rgba(${c.rgb},0.45)` }
                    : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p className="text-[11px] font-semibold text-slate-300">{opt.l}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{opt.d}</p>
                </button>
              ))}
            </div>
            {d.condition_type === 'custom_var' && (
              <div className="mt-2 space-y-1.5">
                <Input value={String(d.condition_var ?? '')} onChange={e => set({ condition_var: e.target.value })}
                  placeholder="Nome da variável" className="text-xs h-8" />
                <Input value={String(d.condition_value ?? '')} onChange={e => set({ condition_value: e.target.value })}
                  placeholder="Valor esperado" className="text-xs h-8" />
              </div>
            )}
          </Field>
        )}

        {node.type === 'payment' && (
          <Field label="Plano a cobrar">
            <div className="space-y-1.5">
              {plans.length === 0 ? (
                <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.08)' }}>
                  <p className="text-[11px] text-slate-500">Nenhum plano cadastrado.</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">Crie planos na aba Planos primeiro.</p>
                </div>
              ) : plans.map(plan => (
                <button key={plan.id} type="button" onClick={() => set({ plan_id: plan.id, plan_name: plan.name })}
                  className="w-full rounded-xl px-3 py-2.5 flex items-center justify-between text-left transition-all"
                  style={d.plan_id === plan.id
                    ? { background: `rgba(${c.rgb},0.12)`, border: `1px solid rgba(${c.rgb},0.45)` }
                    : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-center gap-2">
                    {d.plan_id === plan.id && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: `rgb(${c.rgb})` }} />}
                    <p className="text-[11px] font-semibold text-slate-300">{plan.name}</p>
                  </div>
                  <p className="text-[11px] font-bold" style={{ color: `rgb(${c.rgb})` }}>
                    R$ {Number(plan.price).toFixed(2).replace('.', ',')}
                  </p>
                </button>
              ))}
            </div>
          </Field>
        )}

        {node.type === 'deliver' && (
          <Field label="Tipo de entrega">
            <div className="space-y-1.5">
              {[
                { v: 'channel_link', l: 'Link de canal/grupo', d: 'Envia link único de acesso' },
                { v: 'account', l: 'Conta do estoque', d: 'Entrega login/senha' },
              ].map(opt => (
                <button key={opt.v} type="button" onClick={() => set({ deliver_type: opt.v as NodeData['deliver_type'] })}
                  className="w-full rounded-xl p-3 text-left transition-all"
                  style={(d.deliver_type ?? 'channel_link') === opt.v
                    ? { background: `rgba(${c.rgb},0.12)`, border: `1px solid rgba(${c.rgb},0.45)` }
                    : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p className="text-[11px] font-semibold text-slate-300">{opt.l}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{opt.d}</p>
                </button>
              ))}
            </div>
          </Field>
        )}
      </div>
    </div>
  )
}

// ─── Micro components ──────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-slate-400">{label}</Label>
      {children}
    </div>
  )
}

function Chip({ active, color, onClick, children }: { active: boolean; color: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className="rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all"
      style={active
        ? { background: `rgba(${color},0.2)`, border: `1px solid rgba(${color},0.5)`, color: `rgb(${color})` }
        : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b' }}>
      {children}
    </button>
  )
}

// ─── Palette ───────────────────────────────────────────────────────────────────

const PALETTE: { type: FlowNodeType; desc: string }[] = [
  { type: 'message',   desc: 'Envia texto e/ou mídia' },
  { type: 'buttons',   desc: 'Botões inline clicáveis' },
  { type: 'delay',     desc: 'Pausa antes de continuar' },
  { type: 'condition', desc: 'Ramifica por condição' },
  { type: 'payment',   desc: 'Gera PIX e aguarda' },
  { type: 'deliver',   desc: 'Entrega acesso' },
  { type: 'end',       desc: 'Encerra o fluxo' },
]

const DEFAULT_FLOW = {
  nodes: [
    { id: 'start_1', type: 'start', position: { x: 200, y: 30 }, data: {} },
    { id: 'msg_1', type: 'message', position: { x: 155, y: 160 }, data: { text: 'Olá! Bem-vindo ao nosso bot.' } },
    { id: 'end_1', type: 'end', position: { x: 185, y: 320 }, data: {} },
  ],
  edges: [
    { id: 'e1', source: 'start_1', target: 'msg_1' },
    { id: 'e2', source: 'msg_1', target: 'end_1' },
  ],
}

// ─── Inner editor (needs ReactFlowProvider context) ────────────────────────────

function EditorInner({ botId, initialFlowConfig, plans }: { botId: string; initialFlowConfig: unknown; plans: Plan[] }) {
  const cfg = (initialFlowConfig ?? DEFAULT_FLOW) as { nodes: Node<NodeData>[]; edges: Edge[] }
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodeData>>(cfg.nodes as Node<NodeData>[])
  const [edges, setEdges, onEdgesChange] = useEdgesState(cfg.edges.map(e => ({ ...e, type: 'deletable' })))
  const [selectedNode, setSelectedNode] = useState<Node<NodeData> | null>(null)
  const [saving, setSaving] = useState(false)
  const [savedOk, setSavedOk] = useState(false)
  const counter = useRef(Date.now())

  // keep config panel in sync
  useEffect(() => {
    if (!selectedNode) return
    const n = nodes.find(x => x.id === selectedNode.id)
    if (n) setSelectedNode(n)
  }, [nodes]) // eslint-disable-line

  const onConnect = useCallback((p: Connection) =>
    setEdges(es => addEdge({ ...p, type: 'deletable', markerEnd: { type: MarkerType.ArrowClosed } }, es)), [setEdges])

  const onNodeClick = useCallback((_: React.MouseEvent, n: Node<NodeData>) => {
    if (n.type === 'start' || n.type === 'end') { setSelectedNode(null); return }
    setSelectedNode(n)
  }, [])

  function addNode(type: FlowNodeType) {
    const id = `${type}_${++counter.current}`
    const d: Partial<NodeData> = type === 'message' ? { text: '' } : type === 'delay' ? { delay_seconds: 60 } : type === 'condition' ? { condition_type: 'has_paid' } : type === 'buttons' ? { text: 'Escolha uma opção:', buttons: [{ label: 'Opção 1', value: `b${Date.now()}` }] } : type === 'deliver' ? { deliver_type: 'channel_link' } : {}
    setNodes(ns => [...ns, { id, type, position: { x: 200 + Math.random() * 100, y: 200 + Math.random() * 80 }, data: d }])
  }

  function deleteNode(id: string) {
    setNodes(ns => ns.filter(n => n.id !== id))
    setEdges(es => es.filter(e => e.source !== id && e.target !== id))
    setSelectedNode(null)
  }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch(`/api/bots/${botId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flow_config: { nodes, edges } }),
      })
      if (res.ok) { setSavedOk(true); setTimeout(() => setSavedOk(false), 2000) }
    } finally { setSaving(false) }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-100">Editor Visual de Fluxo</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monte a jornada do usuário. Para ativar: <span className="text-slate-400">Configurações → Fluxo de venda → Fluxo Visual</span>
          </p>
        </div>
        <Button onClick={save} disabled={saving} size="sm"
          style={{ background: savedOk ? 'rgba(52,211,153,0.2)' : 'linear-gradient(135deg, rgba(59,130,246,0.7), rgba(99,102,241,0.6))', border: savedOk ? '1px solid rgba(52,211,153,0.4)' : undefined }}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : savedOk ? <><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Salvo!</> : <><Save className="h-4 w-4" /> Salvar fluxo</>}
        </Button>
      </div>

      <div className="flex gap-3" style={{ height: 580 }}>
        {/* Palette */}
        <div className="w-40 shrink-0 flex flex-col gap-1.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 px-1 pb-0.5">Adicionar nó</p>
          {PALETTE.map(item => {
            const c = C[item.type]
            return (
              <button key={item.type} onClick={() => addNode(item.type)}
                className="flex items-center gap-2 rounded-xl p-2.5 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: `rgba(${c.rgb},0.07)`, border: `1px solid rgba(${c.rgb},0.2)` }}>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: `rgba(${c.rgb},0.15)` }}>
                  <span style={{ color: `rgb(${c.rgb})` }}>{c.icon}</span>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-300">{c.label}</p>
                  <p className="text-[9px] text-slate-600 leading-tight">{item.desc}</p>
                </div>
              </button>
            )
          })}

          <div className="mt-auto">
            <div className="rounded-xl p-2.5 space-y-1.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                <Keyboard className="h-2.5 w-2.5" /> Dicas
              </p>
              <p className="text-[9px] text-slate-700">Clique na seta → <b className="text-slate-600">Delete</b> remove a conexão</p>
              <p className="text-[9px] text-slate-700">Clique no nó → painel de config abre</p>
              <p className="text-[9px] text-slate-700">Scroll para zoom, drag para mover</p>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 rounded-2xl overflow-hidden" style={{ background: 'rgba(8,13,26,0.99)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <ReactFlow
            nodes={nodes} edges={edges}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={() => setSelectedNode(null)}
            nodeTypes={nodeTypes} edgeTypes={edgeTypes}
            deleteKeyCode={['Backspace', 'Delete']}
            fitView
            defaultEdgeOptions={{ type: 'deletable', markerEnd: { type: MarkerType.ArrowClosed } }}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="rgba(255,255,255,0.022)" gap={24} size={1} />
            <Controls showInteractive={false}
              style={{ background: 'rgba(13,19,33,0.96)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }} />
            <MiniMap nodeColor={n => `rgb(${C[n.type as FlowNodeType]?.rgb ?? '100,116,139'})`}
              maskColor="rgba(0,0,0,0.55)"
              style={{ background: 'rgba(8,13,26,0.99)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10 }} />
          </ReactFlow>
        </div>

        {/* Config panel */}
        <div className="w-64 shrink-0">
          {selectedNode ? (
            <div className="h-full rounded-2xl overflow-hidden" style={{ background: 'rgba(11,17,30,0.99)', border: '1px solid rgba(255,255,255,0.09)' }}>
              <ConfigPanel node={selectedNode} plans={plans}
                onChange={(id, data) => setNodes(ns => ns.map(n => n.id === id ? { ...n, data } : n))}
                onDelete={deleteNode} />
            </div>
          ) : (
            <div className="h-full rounded-2xl flex flex-col items-center justify-center gap-4 p-5 text-center"
              style={{ background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.06)' }}>
              <div className="h-12 w-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <MousePointer2 className="h-5 w-5 text-slate-700" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">Selecione um nó</p>
                <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">Clique em qualquer nó no canvas para ver e editar suas configurações aqui</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Public export ─────────────────────────────────────────────────────────────

export function FlowEditorClient({ botId, initialFlowConfig, plans = [] }: {
  botId: string; initialFlowConfig: unknown; plans?: Plan[]
}) {
  return (
    <ReactFlowProvider>
      <EditorInner botId={botId} initialFlowConfig={initialFlowConfig} plans={plans} />
    </ReactFlowProvider>
  )
}
