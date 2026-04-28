'use client'

import { useState, useCallback, useRef } from 'react'
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
  Handle,
  Position,
  MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Play, MessageSquare, Clock, GitBranch, CreditCard, Gift, StopCircle,
  Plus, Save, Trash2, X, MousePointer2, Loader2, Info,
} from 'lucide-react'

// ─── Node data types ───────────────────────────────────────────────────────────

export type FlowNodeType = 'start' | 'message' | 'delay' | 'condition' | 'buttons' | 'payment' | 'deliver' | 'end'

interface NodeData {
  label?: string
  // message
  text?: string
  media_url?: string
  media_type?: 'photo' | 'video' | 'audio'
  // delay
  delay_seconds?: number
  // condition
  condition_type?: 'has_paid' | 'has_plan' | 'custom_var'
  condition_var?: string
  condition_value?: string
  // buttons
  buttons?: { label: string; value: string }[]
  // deliver
  deliver_type?: 'channel_link' | 'account'
  // generic
  [key: string]: unknown
}

// ─── Custom node components ────────────────────────────────────────────────────

const nodeStyle = (color: string, selected: boolean): React.CSSProperties => ({
  background: selected ? `rgba(${color},0.18)` : `rgba(${color},0.10)`,
  border: `1px solid rgba(${color},${selected ? '0.7' : '0.35'})`,
  borderRadius: 12,
  padding: '10px 14px',
  minWidth: 160,
  boxShadow: selected ? `0 0 20px rgba(${color},0.25)` : undefined,
  transition: 'all 0.15s',
  cursor: 'pointer',
})

function NodeBase({ color, icon, title, subtitle, selected, children, hasSource = true, hasTarget = true }: {
  color: string; icon: React.ReactNode; title: string; subtitle?: string
  selected?: boolean; children?: React.ReactNode; hasSource?: boolean; hasTarget?: boolean
}) {
  return (
    <div style={nodeStyle(color, !!selected)}>
      {hasTarget && <Handle type="target" position={Position.Top} style={{ background: `rgba(${color},0.8)`, border: 'none', width: 8, height: 8 }} />}
      <div className="flex items-center gap-2">
        <span style={{ color: `rgb(${color})` }}>{icon}</span>
        <div>
          <p className="text-xs font-semibold text-slate-200">{title}</p>
          {subtitle && <p className="text-[10px] text-slate-500 truncate max-w-[120px]">{subtitle}</p>}
        </div>
      </div>
      {children}
      {hasSource && <Handle type="source" position={Position.Bottom} style={{ background: `rgba(${color},0.8)`, border: 'none', width: 8, height: 8 }} />}
    </div>
  )
}

function StartNode({ selected }: { selected?: boolean }) {
  return (
    <NodeBase color="52,211,153" icon={<Play className="h-3.5 w-3.5" />} title="Início" hasTarget={false} selected={selected} />
  )
}

function MessageNode({ data, selected }: { data: NodeData; selected?: boolean }) {
  return (
    <NodeBase color="96,165,250" icon={<MessageSquare className="h-3.5 w-3.5" />} title="Mensagem" subtitle={data.text ? String(data.text).slice(0, 40) + (String(data.text).length > 40 ? '…' : '') : 'Sem texto'} selected={selected}>
      {data.media_type && <p className="mt-1 text-[10px] text-slate-600">{data.media_type === 'photo' ? '🖼 Imagem' : data.media_type === 'video' ? '🎬 Vídeo' : '🎵 Áudio'}</p>}
    </NodeBase>
  )
}

function DelayNode({ data, selected }: { data: NodeData; selected?: boolean }) {
  const s = Number(data.delay_seconds ?? 0)
  const label = s >= 3600 ? `${Math.round(s / 3600)}h` : s >= 60 ? `${Math.round(s / 60)}min` : `${s}s`
  return (
    <NodeBase color="251,191,36" icon={<Clock className="h-3.5 w-3.5" />} title="Delay" subtitle={label} selected={selected} />
  )
}

function ConditionNode({ data, selected }: { data: NodeData; selected?: boolean }) {
  const labels: Record<string, string> = { has_paid: 'Pagou?', has_plan: 'Tem plano?', custom_var: data.condition_var ? `${data.condition_var} = ${data.condition_value}` : 'Condição' }
  return (
    <div style={{ ...nodeStyle('251,146,60', !!selected), position: 'relative' }}>
      <Handle type="target" position={Position.Top} style={{ background: 'rgba(251,146,60,0.8)', border: 'none', width: 8, height: 8 }} />
      <div className="flex items-center gap-2">
        <span style={{ color: 'rgb(251,146,60)' }}><GitBranch className="h-3.5 w-3.5" /></span>
        <div>
          <p className="text-xs font-semibold text-slate-200">Condição</p>
          <p className="text-[10px] text-slate-500">{labels[data.condition_type ?? 'has_paid'] ?? 'Condição'}</p>
        </div>
      </div>
      <div className="mt-2 flex justify-between text-[9px] font-semibold">
        <Handle type="source" id="yes" position={Position.Bottom} style={{ left: '25%', background: 'rgba(52,211,153,0.8)', border: 'none', width: 8, height: 8 }}>
          <span style={{ position: 'absolute', top: 10, left: -6, color: '#34d399' }}>Sim</span>
        </Handle>
        <Handle type="source" id="no" position={Position.Bottom} style={{ left: '75%', background: 'rgba(239,68,68,0.8)', border: 'none', width: 8, height: 8 }}>
          <span style={{ position: 'absolute', top: 10, left: -4, color: '#f87171' }}>Não</span>
        </Handle>
      </div>
    </div>
  )
}

function ButtonsNode({ data, selected }: { data: NodeData; selected?: boolean }) {
  const btns = data.buttons ?? []
  return (
    <div style={{ ...nodeStyle('167,139,250', !!selected), position: 'relative' }}>
      <Handle type="target" position={Position.Top} style={{ background: 'rgba(167,139,250,0.8)', border: 'none', width: 8, height: 8 }} />
      <div className="flex items-center gap-2 mb-1.5">
        <span style={{ color: 'rgb(167,139,250)' }}><MousePointer2 className="h-3.5 w-3.5" /></span>
        <p className="text-xs font-semibold text-slate-200">Botões</p>
      </div>
      {btns.slice(0, 3).map((b, i) => (
        <div key={i} className="mt-0.5 rounded px-2 py-0.5 text-[10px] text-slate-400" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {b.label || `Botão ${i + 1}`}
          <Handle type="source" id={`btn_${i}`} position={Position.Right} style={{ top: 'auto', background: 'rgba(167,139,250,0.8)', border: 'none', width: 6, height: 6 }} />
        </div>
      ))}
    </div>
  )
}

function PaymentNode({ data, selected }: { data: NodeData; selected?: boolean }) {
  return (
    <NodeBase color="34,197,94" icon={<CreditCard className="h-3.5 w-3.5" />} title="Pagamento" subtitle={data.label ? String(data.label) : 'Aguarda PIX'} selected={selected} />
  )
}

function DeliverNode({ data, selected }: { data: NodeData; selected?: boolean }) {
  return (
    <NodeBase color="232,121,249" icon={<Gift className="h-3.5 w-3.5" />} title="Entrega" subtitle={data.deliver_type === 'account' ? 'Conta do estoque' : 'Link do canal'} selected={selected} />
  )
}

function EndNode({ selected }: { selected?: boolean }) {
  return (
    <NodeBase color="239,68,68" icon={<StopCircle className="h-3.5 w-3.5" />} title="Fim" hasSource={false} selected={selected} />
  )
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

// ─── Node palette ──────────────────────────────────────────────────────────────

const PALETTE: { type: FlowNodeType; label: string; icon: React.ReactNode; color: string; desc: string }[] = [
  { type: 'message',   label: 'Mensagem',    icon: <MessageSquare className="h-4 w-4" />, color: '96,165,250',   desc: 'Envia texto e/ou mídia' },
  { type: 'buttons',   label: 'Botões',      icon: <MousePointer2 className="h-4 w-4" />,  color: '167,139,250',  desc: 'Envia opções clicáveis' },
  { type: 'delay',     label: 'Delay',       icon: <Clock className="h-4 w-4" />,          color: '251,191,36',   desc: 'Aguarda antes de continuar' },
  { type: 'condition', label: 'Condição',    icon: <GitBranch className="h-4 w-4" />,      color: '251,146,60',   desc: 'Ramifica por lógica (se/senão)' },
  { type: 'payment',   label: 'Pagamento',   icon: <CreditCard className="h-4 w-4" />,     color: '34,197,94',    desc: 'Aguarda confirmação de PIX' },
  { type: 'deliver',   label: 'Entrega',     icon: <Gift className="h-4 w-4" />,           color: '232,121,249',  desc: 'Entrega link ou conta' },
  { type: 'end',       label: 'Fim',         icon: <StopCircle className="h-4 w-4" />,     color: '239,68,68',    desc: 'Encerra o fluxo' },
]

const defaultFlowConfig = {
  nodes: [
    { id: 'start_1', type: 'start', position: { x: 240, y: 40 }, data: {} },
    { id: 'msg_1', type: 'message', position: { x: 160, y: 160 }, data: { text: 'Olá! Bem-vindo(a).' } },
    { id: 'end_1', type: 'end', position: { x: 200, y: 300 }, data: {} },
  ],
  edges: [
    { id: 'e1', source: 'start_1', target: 'msg_1', markerEnd: { type: MarkerType.ArrowClosed } },
    { id: 'e2', source: 'msg_1', target: 'end_1', markerEnd: { type: MarkerType.ArrowClosed } },
  ],
}

// ─── Config panel ──────────────────────────────────────────────────────────────

function ConfigPanel({ node, onChange, onDelete }: {
  node: Node<NodeData>
  onChange: (id: string, data: NodeData) => void
  onDelete: (id: string) => void
}) {
  const d = node.data
  const set = (patch: Partial<NodeData>) => onChange(node.id, { ...d, ...patch })

  const typeLabels: Record<FlowNodeType, string> = {
    start: 'Início', message: 'Mensagem', delay: 'Delay',
    condition: 'Condição', buttons: 'Botões', payment: 'Pagamento',
    deliver: 'Entrega', end: 'Fim',
  }

  const typeDescriptions: Record<FlowNodeType, string> = {
    start: 'Ponto de entrada do fluxo. Disparado quando o usuário inicia o bot.',
    message: 'Envia uma mensagem de texto com suporte a HTML e mídia opcional (imagem, vídeo, áudio).',
    delay: 'Pausa o fluxo pelo tempo configurado antes de continuar para o próximo nó.',
    condition: 'Verifica uma condição e ramifica o fluxo em Sim ou Não.',
    buttons: 'Envia botões inline. Cada botão pode conectar a um nó diferente.',
    payment: 'Pausa o fluxo aguardando confirmação de pagamento PIX para continuar.',
    deliver: 'Entrega acesso ao comprador: link do canal ou conta do estoque.',
    end: 'Encerra o fluxo para este usuário.',
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <div>
          <p className="text-sm font-semibold text-slate-200">{typeLabels[node.type as FlowNodeType]}</p>
          <p className="text-[10px] text-slate-500 font-mono">{node.id}</p>
        </div>
        <button
          onClick={() => onDelete(node.id)}
          className="rounded-lg p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          title="Remover nó"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Info box */}
        <div className="rounded-xl p-3 flex gap-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <Info className="h-3.5 w-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-500 leading-relaxed">{typeDescriptions[node.type as FlowNodeType]}</p>
        </div>

        {/* Message config */}
        {node.type === 'message' && (
          <>
            <div className="space-y-1.5">
              <Label>Texto da mensagem</Label>
              <Textarea
                value={String(d.text ?? '')}
                onChange={e => set({ text: e.target.value })}
                placeholder="Olá! Seja bem-vindo..."
                className="min-h-[100px] text-sm"
              />
              <p className="text-[10px] text-slate-600">Suporta HTML: &lt;b&gt;negrito&lt;/b&gt;, &lt;i&gt;itálico&lt;/i&gt;, &lt;code&gt;código&lt;/code&gt;</p>
            </div>
            <div className="space-y-1.5">
              <Label>Tipo de mídia (opcional)</Label>
              <div className="flex gap-2">
                {(['', 'photo', 'video', 'audio'] as const).map(t => (
                  <button key={t} type="button"
                    onClick={() => set({ media_type: t || undefined })}
                    className="rounded-lg px-3 py-1.5 text-xs transition-colors"
                    style={(d.media_type ?? '') === t ? { background: 'rgba(96,165,250,0.2)', border: '1px solid rgba(96,165,250,0.4)', color: '#93c5fd' } : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b' }}
                  >
                    {t === '' ? 'Nenhuma' : t === 'photo' ? '🖼 Imagem' : t === 'video' ? '🎬 Vídeo' : '🎵 Áudio'}
                  </button>
                ))}
              </div>
            </div>
            {d.media_type && (
              <div className="space-y-1.5">
                <Label>URL da mídia</Label>
                <Input value={String(d.media_url ?? '')} onChange={e => set({ media_url: e.target.value })} placeholder="https://..." className="text-sm" />
              </div>
            )}
          </>
        )}

        {/* Buttons config */}
        {node.type === 'buttons' && (
          <>
            <div className="space-y-1.5">
              <Label>Texto antes dos botões</Label>
              <Textarea value={String(d.text ?? '')} onChange={e => set({ text: e.target.value })} placeholder="Escolha uma opção:" className="min-h-[60px] text-sm" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Botões</Label>
                <button type="button"
                  onClick={() => set({ buttons: [...(d.buttons ?? []), { label: `Botão ${(d.buttons?.length ?? 0) + 1}`, value: `btn_${(d.buttons?.length ?? 0) + 1}` }] })}
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                >
                  <Plus className="h-3 w-3" /> Adicionar
                </button>
              </div>
              {(d.buttons ?? []).map((btn, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input value={btn.label} onChange={e => {
                    const nb = [...(d.buttons ?? [])]
                    nb[i] = { ...nb[i], label: e.target.value }
                    set({ buttons: nb })
                  }} placeholder={`Botão ${i + 1}`} className="flex-1 text-sm" />
                  <button type="button" onClick={() => {
                    const nb = (d.buttons ?? []).filter((_, j) => j !== i)
                    set({ buttons: nb })
                  }} className="text-slate-600 hover:text-red-400"><X className="h-3.5 w-3.5" /></button>
                </div>
              ))}
              <p className="text-[10px] text-slate-600">Conecte cada botão a um nó diferente arrastando a seta da lateral direita do botão.</p>
            </div>
          </>
        )}

        {/* Delay config */}
        {node.type === 'delay' && (
          <div className="space-y-2">
            <Label>Tempo de espera</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                min={1}
                value={String(d.delay_seconds ?? 60)}
                onChange={e => set({ delay_seconds: Number(e.target.value) })}
                className="flex-1 text-sm"
              />
              <div className="flex gap-1">
                {[{ l: 'seg', m: 1 }, { l: 'min', m: 60 }, { l: 'h', m: 3600 }].map(({ l, m }) => (
                  <button key={l} type="button"
                    onClick={() => set({ delay_seconds: (d.delay_seconds ?? 60) })}
                    className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:text-slate-300"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >{l}</button>
                ))}
              </div>
            </div>
            <p className="text-[10px] text-slate-600">Valor em segundos. 60 = 1 minuto, 3600 = 1 hora, 86400 = 1 dia.</p>
          </div>
        )}

        {/* Condition config */}
        {node.type === 'condition' && (
          <>
            <div className="space-y-1.5">
              <Label>Tipo de condição</Label>
              <div className="space-y-1.5">
                {[
                  { value: 'has_paid', label: 'Já pagou?', desc: 'Verifica se o usuário tem algum pagamento aprovado' },
                  { value: 'has_plan', label: 'Tem plano ativo?', desc: 'Verifica se a assinatura ainda está válida' },
                  { value: 'custom_var', label: 'Variável personalizada', desc: 'Verifica um valor salvo na sessão do usuário' },
                ].map(opt => (
                  <button key={opt.value} type="button"
                    onClick={() => set({ condition_type: opt.value as NodeData['condition_type'] })}
                    className="w-full rounded-xl p-3 text-left transition-colors"
                    style={(d.condition_type ?? 'has_paid') === opt.value
                      ? { background: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.4)' }
                      : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    <p className="text-xs font-semibold text-slate-300">{opt.label}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            {d.condition_type === 'custom_var' && (
              <div className="space-y-2">
                <div className="space-y-1.5">
                  <Label>Nome da variável</Label>
                  <Input value={String(d.condition_var ?? '')} onChange={e => set({ condition_var: e.target.value })} placeholder="ex: escolha_plano" className="text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label>Valor esperado</Label>
                  <Input value={String(d.condition_value ?? '')} onChange={e => set({ condition_value: e.target.value })} placeholder="ex: premium" className="text-sm" />
                </div>
              </div>
            )}
          </>
        )}

        {/* Deliver config */}
        {node.type === 'deliver' && (
          <div className="space-y-1.5">
            <Label>Tipo de entrega</Label>
            <div className="space-y-1.5">
              {[
                { value: 'channel_link', label: 'Link do canal/grupo', desc: 'Gera link único de acesso via Telegram' },
                { value: 'account', label: 'Conta do estoque', desc: 'Entrega login/senha do estoque de contas' },
              ].map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => set({ deliver_type: opt.value as NodeData['deliver_type'] })}
                  className="w-full rounded-xl p-3 text-left transition-colors"
                  style={(d.deliver_type ?? 'channel_link') === opt.value
                    ? { background: 'rgba(232,121,249,0.12)', border: '1px solid rgba(232,121,249,0.4)' }
                    : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <p className="text-xs font-semibold text-slate-300">{opt.label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main editor ───────────────────────────────────────────────────────────────

interface Props {
  botId: string
  initialFlowConfig: unknown
}

export function FlowEditorClient({ botId, initialFlowConfig }: Props) {
  const cfg = (initialFlowConfig ?? defaultFlowConfig) as { nodes: Node<NodeData>[]; edges: Edge[] }

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodeData>>(cfg.nodes as Node<NodeData>[])
  const [edges, setEdges, onEdgesChange] = useEdgesState(cfg.edges)
  const [selectedNode, setSelectedNode] = useState<Node<NodeData> | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const idCounter = useRef(Date.now())

  const onConnect = useCallback((params: Connection) => {
    setEdges(eds => addEdge({ ...params, markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: 'rgba(148,163,184,0.4)', strokeWidth: 1.5 } }, eds))
  }, [setEdges])

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node<NodeData>) => {
    if (node.type === 'start' || node.type === 'end') {
      setSelectedNode(null)
      return
    }
    setSelectedNode(node)
  }, [])

  const onPaneClick = useCallback(() => setSelectedNode(null), [])

  function addNode(type: FlowNodeType) {
    const id = `${type}_${++idCounter.current}`
    const defaultData: NodeData = type === 'message' ? { text: '' }
      : type === 'delay' ? { delay_seconds: 60 }
      : type === 'condition' ? { condition_type: 'has_paid' }
      : type === 'buttons' ? { text: 'Escolha uma opção:', buttons: [{ label: 'Opção 1', value: 'opt_1' }] }
      : type === 'deliver' ? { deliver_type: 'channel_link' }
      : {}

    const newNode: Node<NodeData> = {
      id,
      type,
      position: { x: 200 + Math.random() * 100, y: 200 + Math.random() * 80 },
      data: defaultData,
    }
    setNodes(ns => [...ns, newNode])
  }

  function updateNodeData(id: string, data: NodeData) {
    setNodes(ns => ns.map(n => n.id === id ? { ...n, data } : n))
    setSelectedNode(prev => prev?.id === id ? { ...prev, data } : prev)
  }

  function deleteNode(id: string) {
    setNodes(ns => ns.filter(n => n.id !== id))
    setEdges(es => es.filter(e => e.source !== id && e.target !== id))
    setSelectedNode(null)
  }

  async function saveFlow() {
    setSaving(true)
    try {
      await fetch(`/api/bots/${botId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flow_config: { nodes, edges } }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-100">Editor Visual de Fluxo</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Arraste nós do painel e conecte-os para montar a jornada do usuário. Para executar este fluxo, selecione "Visual" como fluxo de venda nas configurações do bot.
          </p>
        </div>
        <Button onClick={saveFlow} disabled={saving} size="sm" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.8), rgba(99,102,241,0.8))' }}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? '✓ Salvo' : <><Save className="h-4 w-4" /> Salvar fluxo</>}
        </Button>
      </div>

      <div className="flex gap-4" style={{ height: 560 }}>
        {/* Palette */}
        <div className="flex flex-col gap-1.5 w-40 flex-shrink-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 px-1">Nós disponíveis</p>
          {PALETTE.map(item => (
            <button
              key={item.type}
              onClick={() => addNode(item.type)}
              className="flex items-center gap-2.5 rounded-xl p-3 text-left transition-all duration-150 hover:scale-[1.02]"
              style={{ background: `rgba(${item.color},0.08)`, border: `1px solid rgba(${item.color},0.2)` }}
            >
              <span style={{ color: `rgb(${item.color})` }}>{item.icon}</span>
              <div>
                <p className="text-xs font-semibold text-slate-300">{item.label}</p>
                <p className="text-[9px] text-slate-600 leading-tight">{item.desc}</p>
              </div>
              <Plus className="h-3 w-3 text-slate-600 ml-auto flex-shrink-0" />
            </button>
          ))}
        </div>

        {/* Canvas */}
        <div className="flex-1 rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            defaultEdgeOptions={{ markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: 'rgba(148,163,184,0.35)', strokeWidth: 1.5 } }}
          >
            <Background color="rgba(255,255,255,0.04)" gap={20} />
            <Controls style={{ background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
            <MiniMap
              style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}
              nodeColor={(n) => {
                const colors: Record<string, string> = { start: '#34d399', message: '#60a5fa', delay: '#fbbf24', condition: '#fb923c', buttons: '#a78bfa', payment: '#22c55e', deliver: '#e879f9', end: '#ef4444' }
                return colors[n.type ?? ''] ?? '#64748b'
              }}
            />
          </ReactFlow>
        </div>

        {/* Config panel */}
        {selectedNode && (
          <div
            className="w-72 flex-shrink-0 rounded-2xl overflow-hidden"
            style={{ background: 'rgba(15,23,42,0.97)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <ConfigPanel
              node={selectedNode}
              onChange={updateNodeData}
              onDelete={deleteNode}
            />
          </div>
        )}
        {!selectedNode && (
          <div
            className="w-64 flex-shrink-0 rounded-2xl flex flex-col items-center justify-center gap-3 text-center p-6"
            style={{ background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.07)' }}
          >
            <MousePointer2 className="h-8 w-8 text-slate-700" />
            <div>
              <p className="text-sm font-medium text-slate-500">Clique em um nó</p>
              <p className="text-xs text-slate-600 mt-1">para configurar suas propriedades</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
