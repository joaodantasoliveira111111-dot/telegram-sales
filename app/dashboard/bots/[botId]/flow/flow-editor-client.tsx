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
  Plus, Save, Trash2, X, MousePointer2, Loader2, Info, Keyboard, CheckCircle2,
  Layers, Image as ImageIcon, Video, Music, Paperclip, Film, MoreHorizontal,
  MapPin, AlarmClock, Zap, Shuffle, ArrowRightCircle, ShoppingCart,
  TrendingUp, TrendingDown, Users, Pencil,
} from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────────────────────

type FlowNodeType =
  | 'start' | 'message' | 'delay' | 'condition' | 'buttons' | 'payment' | 'deliver' | 'end'
  | 'composite' | 'image' | 'video' | 'audio' | 'file' | 'video_note' | 'typing' | 'user_input' | 'location'
  | 'smart_delay' | 'trigger' | 'randomizer' | 'goto'
  | 'order_bump'
  | 'upsell' | 'downsell'
  | 'temp_group'
  | 'note'

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
  caption?: string
  file_url?: string
  variable_name?: string
  variable_type?: 'text' | 'number' | 'email' | 'phone'
  prompt_text?: string
  smart_delay_hours?: number
  smart_delay_condition?: 'no_response' | 'no_payment' | 'always'
  trigger_event?: 'message' | 'payment_success' | 'payment_failed'
  paths?: number
  goto_node_id?: string
  order_bump_name?: string
  order_bump_price?: number
  order_bump_desc?: string
  upsell_plan_id?: string
  upsell_plan_name?: string
  upsell_message?: string
  downsell_plan_id?: string
  downsell_plan_name?: string
  downsell_message?: string
  temp_group_link?: string
  temp_group_days?: number
  note_text?: string
  [key: string]: unknown
}

export interface Plan { id: string; name: string; price: number }

// ─── Design tokens ─────────────────────────────────────────────────────────────

const IC = 'h-3.5 w-3.5'

const C: Record<FlowNodeType, { rgb: string; label: string; icon: React.ReactNode }> = {
  start:       { rgb: '52,211,153',  label: 'Início',           icon: <Play className={IC} /> },
  message:     { rgb: '96,165,250',  label: 'Texto',            icon: <MessageSquare className={IC} /> },
  composite:   { rgb: '56,189,248',  label: 'Msg Composta',     icon: <Layers className={IC} /> },
  image:       { rgb: '96,165,250',  label: 'Imagem',           icon: <ImageIcon className={IC} /> },
  video:       { rgb: '96,165,250',  label: 'Vídeo',            icon: <Video className={IC} /> },
  audio:       { rgb: '96,165,250',  label: 'Áudio',            icon: <Music className={IC} /> },
  file:        { rgb: '96,165,250',  label: 'Arquivo',          icon: <Paperclip className={IC} /> },
  video_note:  { rgb: '96,165,250',  label: 'Vídeo Nota',       icon: <Film className={IC} /> },
  typing:      { rgb: '100,116,139', label: 'Digitando...',     icon: <MoreHorizontal className={IC} /> },
  buttons:     { rgb: '167,139,250', label: 'Botões',           icon: <MousePointer2 className={IC} /> },
  user_input:  { rgb: '167,139,250', label: 'Input Usuário',    icon: <Keyboard className={IC} /> },
  location:    { rgb: '96,165,250',  label: 'Localização',      icon: <MapPin className={IC} /> },
  delay:       { rgb: '251,191,36',  label: 'Atraso',           icon: <Clock className={IC} /> },
  smart_delay: { rgb: '251,191,36',  label: 'Smart Delay',      icon: <AlarmClock className={IC} /> },
  trigger:     { rgb: '251,146,60',  label: 'Gatilho',          icon: <Zap className={IC} /> },
  condition:   { rgb: '251,146,60',  label: 'Condição',         icon: <GitBranch className={IC} /> },
  randomizer:  { rgb: '236,72,153',  label: 'Randomizer',       icon: <Shuffle className={IC} /> },
  goto:        { rgb: '148,163,184', label: 'Go To',            icon: <ArrowRightCircle className={IC} /> },
  payment:     { rgb: '34,197,94',   label: 'Gerar PIX',        icon: <CreditCard className={IC} /> },
  order_bump:  { rgb: '34,197,94',   label: 'Order Bump',       icon: <ShoppingCart className={IC} /> },
  upsell:      { rgb: '52,211,153',  label: 'Upsell',           icon: <TrendingUp className={IC} /> },
  downsell:    { rgb: '251,146,60',  label: 'Downsell',         icon: <TrendingDown className={IC} /> },
  temp_group:  { rgb: '232,121,249', label: 'Grupo Temporário', icon: <Users className={IC} /> },
  deliver:     { rgb: '232,121,249', label: 'Entrega',          icon: <Gift className={IC} /> },
  note:        { rgb: '202,138,4',   label: 'Nota',             icon: <Pencil className={IC} /> },
  end:         { rgb: '239,68,68',   label: 'Fim',              icon: <StopCircle className={IC} /> },
}

const NODE_TIPS: Record<FlowNodeType, string> = {
  start:       'Executado quando o usuário envia /start. Conecte ao primeiro nó do fluxo.',
  message:     'Envia texto para o usuário. Suporta HTML (<b>, <i>, <code>) e variáveis {nome}.',
  composite:   'Combina texto, mídia e botões em uma única mensagem. O bloco mais versátil.',
  image:       'Envia uma imagem (JPEG/PNG/WEBP). Adicione uma legenda opcional.',
  video:       'Envia um vídeo MP4. Adicione legenda opcional.',
  audio:       'Envia áudio ou música (MP3/OGG).',
  file:        'Envia qualquer arquivo/documento (PDF, ZIP, DOCX...).',
  video_note:  'Vídeo circular estilo Telegram. Duração máxima: 60 segundos.',
  typing:      'Exibe o indicador "digitando..." por alguns segundos antes do próximo nó.',
  buttons:     'Mensagem com botões inline. Cada botão tem saída independente no canvas.',
  user_input:  'Pausa o fluxo aguardando resposta do usuário e salva em variável.',
  location:    'Solicita ao usuário que compartilhe sua localização.',
  delay:       'Pausa o fluxo por um tempo fixo antes de continuar.',
  smart_delay: 'Delay inteligente: só dispara o próximo nó se a condição for verdadeira.',
  trigger:     'Reage a um evento específico como pagamento aprovado ou mensagem recebida.',
  condition:   'Bifurca o fluxo: saída Sim (verde) e Não (vermelho) conforme a condição.',
  randomizer:  'Divide o tráfego em N caminhos aleatórios — ideal para testes A/B.',
  goto:        'Pula para um nó específico pelo ID. Útil para loops e atalhos no fluxo.',
  payment:     'Gera um PIX para o plano selecionado e aguarda confirmação de pagamento.',
  order_bump:  'Oferta adicional apresentada junto ao checkout. Ex: upgrade ou complemento.',
  upsell:      'Oferta de plano superior após uma ação positiva do usuário.',
  downsell:    'Oferta de valor menor para quem recusou o upsell.',
  temp_group:  'Adiciona o usuário a um grupo/canal por um período determinado.',
  deliver:     'Entrega o acesso: link único de canal/grupo ou conta do estoque.',
  note:        'Anotação visual no canvas. Não é executada pelo bot.',
  end:         'Encerra o fluxo e limpa a sessão ativa do usuário.',
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
        style={{ stroke: selected ? '#f87171' : 'rgba(148,163,184,0.5)', strokeWidth: selected ? 2 : 1.5, transition: 'stroke 0.12s' }}
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

// ─── Node shell & header ───────────────────────────────────────────────────────

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
      boxShadow: selected ? `0 0 0 2px rgba(${c.rgb},0.2), 0 8px 28px rgba(0,0,0,0.12)` : '0 2px 10px rgba(0,0,0,0.06)',
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
        <p className="text-xs font-bold leading-none" style={{ color: '#1e1b2e' }}>{c.label}</p>
        {sub && <p className="text-[10px] mt-0.5 leading-tight max-w-[140px]" style={{ wordBreak: 'break-word', color: '#6b7280' }}>{sub}</p>}
      </div>
    </div>
  )
}

// ─── Node factory (for simple shell-based nodes) ───────────────────────────────

function mkNode(
  type: FlowNodeType,
  sub: (d: NodeData) => string,
  noTarget?: boolean,
  noSource?: boolean,
) {
  return function NodeImpl({ data, selected }: { data: NodeData; selected?: boolean }) {
    return (
      <Shell type={type} selected={selected} hasTarget={!noTarget} hasSource={!noSource}>
        <Header type={type} sub={sub(data)} />
      </Shell>
    )
  }
}

// ─── Simple node components ────────────────────────────────────────────────────

const StartNode    = mkNode('start',      () => '/start → entrada do fluxo', true)
const MessageNode  = mkNode('message',    d => d.text ? String(d.text).slice(0, 48) + (String(d.text).length > 48 ? '…' : '') : '(sem texto)')
const CompositeNode = mkNode('composite', d => {
  const parts: string[] = []
  if (d.text) parts.push(String(d.text).slice(0, 22))
  if (d.file_url) parts.push('[mídia]')
  if ((d.buttons as { label: string }[] | undefined)?.length) parts.push(`${(d.buttons as unknown[]).length} botões`)
  return parts.join(' · ') || '(configure o bloco)'
})
const ImageNode    = mkNode('image',      d => d.file_url ? (d.file_url as string).split('/').pop()?.slice(0, 30) ?? 'imagem' : '(sem URL)')
const VideoNode    = mkNode('video',      d => d.file_url ? (d.file_url as string).split('/').pop()?.slice(0, 30) ?? 'vídeo' : '(sem URL)')
const AudioNode    = mkNode('audio',      d => d.file_url ? (d.file_url as string).split('/').pop()?.slice(0, 30) ?? 'áudio' : '(sem URL)')
const FileNode     = mkNode('file',       d => d.file_url ? (d.file_url as string).split('/').pop()?.slice(0, 30) ?? 'arquivo' : '(sem URL)')
const VideoNoteNode = mkNode('video_note',d => d.file_url ? (d.file_url as string).split('/').pop()?.slice(0, 30) ?? 'vídeo nota' : '(sem URL)')
const TypingNode   = mkNode('typing',     d => `Simula digitação por ${d.delay_seconds ?? 2}s`)
const UserInputNode = mkNode('user_input',d => d.variable_name ? `→ {${d.variable_name}}` : '(defina uma variável)')
const LocationNode = mkNode('location',   () => 'Solicita localização do usuário')
const DelayNode    = mkNode('delay',      d => {
  const s = Number(d.delay_seconds ?? 60)
  return s >= 86400 ? `Aguarda ${Math.floor(s / 86400)}d` : s >= 3600 ? `Aguarda ${Math.floor(s / 3600)}h` : s >= 60 ? `Aguarda ${Math.floor(s / 60)} min` : `Aguarda ${s}s`
})
const SmartDelayNode = mkNode('smart_delay', d => {
  const h = d.smart_delay_hours ?? 1
  const cond = d.smart_delay_condition === 'no_response' ? 'sem resposta' : d.smart_delay_condition === 'no_payment' ? 'sem pagamento' : 'sempre'
  return `${h}h · ${cond}`
})
const TriggerNode  = mkNode('trigger',    d => {
  const labels: Record<string, string> = { message: 'Mensagem recebida', payment_success: 'Pagamento aprovado', payment_failed: 'Pagamento recusado' }
  return labels[d.trigger_event ?? ''] ?? '(selecione evento)'
})
const GotoNode     = mkNode('goto',       d => d.goto_node_id ? `→ ${d.goto_node_id}` : '(selecione nó destino)')
const PaymentNode  = mkNode('payment',    d => d.plan_name ? `Plano: ${d.plan_name}` : '⚠ Selecione um plano')
const OrderBumpNode = mkNode('order_bump',d => d.order_bump_name ? `${String(d.order_bump_name).slice(0, 22)} · R$ ${Number(d.order_bump_price ?? 0).toFixed(2).replace('.', ',')}` : '(configure oferta)')
const UpsellNode   = mkNode('upsell',     d => d.upsell_plan_name ? `→ ${d.upsell_plan_name}` : '(selecione plano)')
const DownsellNode = mkNode('downsell',   d => d.downsell_plan_name ? `→ ${d.downsell_plan_name}` : '(selecione plano)')
const TempGroupNode = mkNode('temp_group',d => d.temp_group_link ? `${d.temp_group_days ?? 30} dias · ${String(d.temp_group_link).slice(0, 18)}` : '(configure o grupo)')
const DeliverNode  = mkNode('deliver',    d => d.deliver_type === 'account' ? 'Conta do estoque' : 'Link do canal/grupo')
const EndNode      = mkNode('end',        () => 'Encerra o fluxo', false, true)

// ─── Complex node components (custom handles) ─────────────────────────────────

function ConditionNode({ data, selected }: { data: NodeData; selected?: boolean }) {
  const c = C.condition
  const sub: Record<string, string> = { has_paid: 'Já pagou?', has_plan: 'Plano ativo?', custom_var: data.condition_var ? `${data.condition_var} = ?` : 'Variável personalizada' }
  return (
    <div style={{ background: selected ? `rgba(${c.rgb},0.16)` : `rgba(${c.rgb},0.05)`, border: `1px solid rgba(${c.rgb},${selected ? 0.65 : 0.28})`, borderRadius: 14, minWidth: 186, boxShadow: selected ? `0 0 0 2px rgba(${c.rgb},0.2), 0 8px 28px rgba(0,0,0,0.12)` : '0 2px 10px rgba(0,0,0,0.06)', transition: 'all 0.12s' }}>
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
        <Handle type="source" id="no"  position={Position.Bottom} style={{ background: 'rgb(239,68,68)',  border: '2px solid rgba(239,68,68,0.35)',  width: 10, height: 10, left: '72%', bottom: -5 }} />
      </div>
    </div>
  )
}

function ButtonsNode({ data, selected }: { data: NodeData; selected?: boolean }) {
  const c = C.buttons
  const btns = (data.buttons ?? []) as { label: string; value: string }[]
  return (
    <div style={{ background: selected ? `rgba(${c.rgb},0.16)` : `rgba(${c.rgb},0.05)`, border: `1px solid rgba(${c.rgb},${selected ? 0.65 : 0.28})`, borderRadius: 14, minWidth: 196, boxShadow: selected ? `0 0 0 2px rgba(${c.rgb},0.2), 0 8px 28px rgba(0,0,0,0.12)` : '0 2px 10px rgba(0,0,0,0.06)', transition: 'all 0.12s' }}>
      <Handle type="target" position={Position.Top} style={{ background: `rgb(${c.rgb})`, border: `2px solid rgba(${c.rgb},0.35)`, width: 10, height: 10, top: -5 }} />
      <div className="px-3.5 pt-3 pb-2">
        <Header type="buttons" sub={data.text ? String(data.text).slice(0, 30) : 'Escolha uma opção'} />
        <div className="mt-2.5 space-y-1.5">
          {btns.map((b, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <div className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[11px] font-medium"
                style={{ background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(0,0,0,0.10)', paddingRight: 20, color: '#374151' }}>
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

function RandomizerNode({ data, selected }: { data: NodeData; selected?: boolean }) {
  const c = C.randomizer
  const n = Math.max(2, Math.min(5, Number(data.paths ?? 2)))
  const pct = Math.round(100 / n)
  return (
    <div style={{ background: selected ? `rgba(${c.rgb},0.16)` : `rgba(${c.rgb},0.05)`, border: `1px solid rgba(${c.rgb},${selected ? 0.65 : 0.28})`, borderRadius: 14, minWidth: 196, boxShadow: selected ? `0 0 0 2px rgba(${c.rgb},0.2), 0 8px 28px rgba(0,0,0,0.12)` : '0 2px 10px rgba(0,0,0,0.06)', transition: 'all 0.12s' }}>
      <Handle type="target" position={Position.Top} style={{ background: `rgb(${c.rgb})`, border: `2px solid rgba(${c.rgb},0.35)`, width: 10, height: 10, top: -5 }} />
      <div className="px-3.5 py-3">
        <Header type="randomizer" sub={`${n} caminhos · ~${pct}% cada`} />
        <div className="mt-2 flex justify-around px-2">
          {Array.from({ length: n }, (_, i) => (
            <span key={i} className="text-[9px] font-bold text-slate-600">{pct}%</span>
          ))}
        </div>
      </div>
      <div style={{ position: 'relative', height: 16 }}>
        {Array.from({ length: n }, (_, i) => {
          const left = `${Math.round((i + 1) * 100 / (n + 1))}%`
          return (
            <Handle key={i} type="source" id={`path_${i}`} position={Position.Bottom}
              style={{ background: `rgb(${c.rgb})`, border: `2px solid rgba(${c.rgb},0.35)`, width: 8, height: 8, left, bottom: -5 }} />
          )
        })}
      </div>
    </div>
  )
}

function NoteNode({ data, selected }: { data: NodeData; selected?: boolean }) {
  const rgb = '202,138,4'
  const text = data.note_text ? String(data.note_text) : 'Clique para editar...'
  return (
    <div style={{
      background: selected ? `rgba(${rgb},0.18)` : `rgba(${rgb},0.06)`,
      border: `1px solid rgba(${rgb},${selected ? 0.6 : 0.22})`,
      borderRadius: 10,
      minWidth: 160,
      maxWidth: 220,
      padding: '10px 14px',
      boxShadow: selected ? `0 0 0 2px rgba(${rgb},0.2)` : '0 2px 10px rgba(0,0,0,0.05)',
      transition: 'all 0.12s',
    }}>
      <div className="flex items-center gap-2 mb-2">
        <Pencil className="h-3 w-3 shrink-0" style={{ color: `rgb(${rgb})` }} />
        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: `rgb(${rgb})` }}>Nota</p>
      </div>
      <p className="text-[10px] text-slate-400 leading-relaxed" style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
        {text.slice(0, 120)}{text.length > 120 ? '…' : ''}
      </p>
    </div>
  )
}

// ─── nodeTypes map ─────────────────────────────────────────────────────────────

const nodeTypes: NodeTypes = {
  start:      StartNode      as NodeTypes[string],
  message:    MessageNode    as NodeTypes[string],
  composite:  CompositeNode  as NodeTypes[string],
  image:      ImageNode      as NodeTypes[string],
  video:      VideoNode      as NodeTypes[string],
  audio:      AudioNode      as NodeTypes[string],
  file:       FileNode       as NodeTypes[string],
  video_note: VideoNoteNode  as NodeTypes[string],
  typing:     TypingNode     as NodeTypes[string],
  buttons:    ButtonsNode    as NodeTypes[string],
  user_input: UserInputNode  as NodeTypes[string],
  location:   LocationNode   as NodeTypes[string],
  delay:      DelayNode      as NodeTypes[string],
  smart_delay: SmartDelayNode as NodeTypes[string],
  trigger:    TriggerNode    as NodeTypes[string],
  condition:  ConditionNode  as NodeTypes[string],
  randomizer: RandomizerNode as NodeTypes[string],
  goto:       GotoNode       as NodeTypes[string],
  payment:    PaymentNode    as NodeTypes[string],
  order_bump: OrderBumpNode  as NodeTypes[string],
  upsell:     UpsellNode     as NodeTypes[string],
  downsell:   DownsellNode   as NodeTypes[string],
  temp_group: TempGroupNode  as NodeTypes[string],
  deliver:    DeliverNode    as NodeTypes[string],
  note:       NoteNode       as NodeTypes[string],
  end:        EndNode        as NodeTypes[string],
}

// ─── Config panel ──────────────────────────────────────────────────────────────

function ConfigPanel({ node, plans, onChange, onDelete }: {
  node: Node<NodeData>; plans: Plan[]
  onChange: (id: string, data: NodeData) => void
  onDelete: (id: string) => void
}) {
  const d = node.data
  const set = (patch: Partial<NodeData>) => onChange(node.id, { ...d, ...patch })
  const c = C[node.type as FlowNodeType] ?? C.message
  const MEDIA_TYPES: FlowNodeType[] = ['image', 'video', 'audio', 'file', 'video_note']

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        <div className="flex items-center gap-2.5">
          <div className="h-2.5 w-2.5 rounded-full" style={{ background: `rgb(${c.rgb})`, boxShadow: `0 0 8px rgba(${c.rgb},0.7)` }} />
          <p className="text-sm font-bold" style={{ color: '#1e1b2e' }}>{c.label}</p>
        </div>
        <button onClick={() => onDelete(node.id)}
          className="rounded-lg p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Node ID badge */}
      <div className="mx-4 mt-2.5 rounded-lg px-2.5 py-1 text-[10px] font-mono" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.12)', color: '#374151' }}>
        id: <span className="text-slate-500">{node.id}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Tip */}
        <div className="rounded-xl p-3 flex gap-2" style={{ background: `rgba(${c.rgb},0.06)`, border: `1px solid rgba(${c.rgb},0.15)` }}>
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: `rgba(${c.rgb},0.7)` }} />
          <p className="text-[11px] leading-relaxed text-slate-400">{NODE_TIPS[node.type as FlowNodeType]}</p>
        </div>

        {/* message */}
        {node.type === 'message' && (
          <>
            <Field label="Texto da mensagem">
              <Textarea value={String(d.text ?? '')} onChange={e => set({ text: e.target.value })}
                placeholder="Olá {nome}! Bem-vindo..." className="min-h-[88px] text-xs resize-none" />
              <p className="text-[10px] text-slate-600 mt-1">Variáveis: <code className="text-slate-500">{'{nome}'}</code> — HTML: &lt;b&gt; &lt;i&gt; &lt;code&gt;</p>
            </Field>
            <Field label="Mídia (opcional)">
              <div className="flex flex-wrap gap-1.5">
                {(['', 'photo', 'video', 'audio'] as const).map(t => (
                  <Chip key={t} active={(d.media_type ?? '') === t} color={c.rgb}
                    onClick={() => set({ media_type: t || undefined, media_url: t ? d.media_url : undefined })}>
                    {t === '' ? 'Nenhuma' : t === 'photo' ? 'Imagem' : t === 'video' ? 'Vídeo' : 'Áudio'}
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

        {/* composite */}
        {node.type === 'composite' && (
          <>
            <Field label="Texto">
              <Textarea value={String(d.text ?? '')} onChange={e => set({ text: e.target.value })}
                placeholder="Texto da mensagem..." className="min-h-[72px] text-xs resize-none" />
            </Field>
            <Field label="URL de mídia (opcional)">
              <Input value={String(d.file_url ?? '')} onChange={e => set({ file_url: e.target.value })}
                placeholder="https://cdn.exemplo.com/imagem.jpg" className="text-xs h-8" />
            </Field>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Botões (opcional)</span>
                <button type="button" onClick={() => set({ buttons: [...(d.buttons ?? []), { label: `Botão ${(d.buttons?.length ?? 0) + 1}`, value: `b${Date.now()}` }] })}
                  className="flex items-center gap-1 text-[11px] font-semibold transition-colors" style={{ color: `rgb(${c.rgb})` }}>
                  <Plus className="h-3 w-3" /> Adicionar
                </button>
              </div>
              {(d.buttons ?? []).map((btn, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input value={btn.label} onChange={e => {
                    const nb = [...(d.buttons ?? [])]
                    nb[i] = { ...nb[i], label: e.target.value }
                    set({ buttons: nb })
                  }} placeholder={`Botão ${i + 1}`} className="flex-1 text-xs h-8" />
                  <button type="button" onClick={() => set({ buttons: (d.buttons ?? []).filter((_, j) => j !== i) })}
                    className="text-slate-700 hover:text-red-400 transition-colors"><X className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* image / video / audio / file / video_note */}
        {MEDIA_TYPES.includes(node.type as FlowNodeType) && (
          <>
            <Field label="URL do arquivo">
              <Input value={String(d.file_url ?? '')} onChange={e => set({ file_url: e.target.value })}
                placeholder="https://cdn.exemplo.com/arquivo.mp4" className="text-xs h-8" />
            </Field>
            {node.type !== 'audio' && node.type !== 'video_note' && (
              <Field label="Legenda (opcional)">
                <Textarea value={String(d.caption ?? '')} onChange={e => set({ caption: e.target.value })}
                  placeholder="Legenda da mídia..." className="min-h-[52px] text-xs resize-none" />
              </Field>
            )}
          </>
        )}

        {/* typing */}
        {node.type === 'typing' && (
          <Field label="Duração (segundos)">
            <div className="grid grid-cols-3 gap-1.5 mb-2">
              {[1, 2, 3, 5, 8, 10].map(s => (
                <Chip key={s} active={(d.delay_seconds ?? 2) === s} color={c.rgb} onClick={() => set({ delay_seconds: s })}>{s}s</Chip>
              ))}
            </div>
          </Field>
        )}

        {/* user_input */}
        {node.type === 'user_input' && (
          <>
            <Field label="Mensagem ao usuário">
              <Textarea value={String(d.prompt_text ?? '')} onChange={e => set({ prompt_text: e.target.value })}
                placeholder="Digite sua resposta:" className="min-h-[52px] text-xs resize-none" />
            </Field>
            <Field label="Salvar em variável">
              <Input value={String(d.variable_name ?? '')} onChange={e => set({ variable_name: e.target.value })}
                placeholder="nome_variavel" className="text-xs h-8" />
              <p className="text-[10px] text-slate-600 mt-1">Use <code className="text-slate-500">{'{nome_variavel}'}</code> em nós posteriores</p>
            </Field>
            <Field label="Tipo de validação">
              <div className="flex flex-wrap gap-1.5">
                {[{ v: 'text', l: 'Texto' }, { v: 'number', l: 'Número' }, { v: 'email', l: 'E-mail' }, { v: 'phone', l: 'Telefone' }].map(t => (
                  <Chip key={t.v} active={(d.variable_type ?? 'text') === t.v} color={c.rgb}
                    onClick={() => set({ variable_type: t.v as NodeData['variable_type'] })}>{t.l}</Chip>
                ))}
              </div>
            </Field>
          </>
        )}

        {/* location */}
        {node.type === 'location' && (
          <Field label="Mensagem ao solicitar">
            <Textarea value={String(d.prompt_text ?? '')} onChange={e => set({ prompt_text: e.target.value })}
              placeholder="Compartilhe sua localização para continuar..." className="min-h-[52px] text-xs resize-none" />
          </Field>
        )}

        {/* buttons */}
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
                <p className="text-[10px] text-slate-600 leading-relaxed">A seta lateral direita de cada botão é uma saída independente.</p>
              )}
            </div>
          </>
        )}

        {/* delay */}
        {node.type === 'delay' && (
          <Field label="Tempo de espera">
            <div className="grid grid-cols-3 gap-1.5 mb-2">
              {[{ l: '30s', s: 30 }, { l: '1 min', s: 60 }, { l: '5 min', s: 300 }, { l: '1h', s: 3600 }, { l: '6h', s: 21600 }, { l: '1 dia', s: 86400 }].map(({ l, s }) => (
                <Chip key={s} active={d.delay_seconds === s} color={c.rgb} onClick={() => set({ delay_seconds: s })}>{l}</Chip>
              ))}
            </div>
            <Input type="number" min={1} value={String(d.delay_seconds ?? 60)} onChange={e => set({ delay_seconds: Number(e.target.value) })}
              className="text-xs h-8" placeholder="Segundos personalizados" />
          </Field>
        )}

        {/* smart_delay */}
        {node.type === 'smart_delay' && (
          <>
            <Field label="Aguardar (horas)">
              <div className="grid grid-cols-4 gap-1.5">
                {[1, 2, 4, 8, 12, 24, 48, 72].map(h => (
                  <Chip key={h} active={(d.smart_delay_hours ?? 1) === h} color={c.rgb} onClick={() => set({ smart_delay_hours: h })}>{h}h</Chip>
                ))}
              </div>
            </Field>
            <Field label="Executar somente se">
              {[
                { v: 'no_response', l: 'Sem resposta',    desc: 'Usuário não respondeu após o delay' },
                { v: 'no_payment',  l: 'Sem pagamento',   desc: 'Nenhum pagamento aprovado ainda' },
                { v: 'always',      l: 'Sempre',          desc: 'Executa independente de ações' },
              ].map(opt => (
                <button key={opt.v} type="button" onClick={() => set({ smart_delay_condition: opt.v as NodeData['smart_delay_condition'] })}
                  className="w-full rounded-xl p-3 text-left transition-all mb-1.5"
                  style={(d.smart_delay_condition ?? 'no_response') === opt.v
                    ? { background: `rgba(${c.rgb},0.12)`, border: `1px solid rgba(${c.rgb},0.45)` }
                    : { background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(255,255,255,0.82)' }}>
                  <p className="text-[11px] font-semibold text-slate-700">{opt.l}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </Field>
          </>
        )}

        {/* trigger */}
        {node.type === 'trigger' && (
          <Field label="Evento">
            {[
              { v: 'message',         l: 'Mensagem recebida',  desc: 'Qualquer mensagem enviada pelo usuário' },
              { v: 'payment_success', l: 'Pagamento aprovado', desc: 'Webhook de confirmação do PIX' },
              { v: 'payment_failed',  l: 'Pagamento recusado', desc: 'Tentativa falhou ou expirou' },
            ].map(opt => (
              <button key={opt.v} type="button" onClick={() => set({ trigger_event: opt.v as NodeData['trigger_event'] })}
                className="w-full rounded-xl p-3 text-left transition-all mb-1.5"
                style={(d.trigger_event ?? 'message') === opt.v
                  ? { background: `rgba(${c.rgb},0.12)`, border: `1px solid rgba(${c.rgb},0.45)` }
                  : { background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(255,255,255,0.82)' }}>
                <p className="text-[11px] font-semibold text-slate-700">{opt.l}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </Field>
        )}

        {/* condition */}
        {node.type === 'condition' && (
          <Field label="Condição">
            <div className="space-y-1.5">
              {[
                { v: 'has_paid',    l: 'Já pagou?',          desc: 'Verdadeiro se há pagamento aprovado' },
                { v: 'has_plan',    l: 'Plano ativo?',        desc: 'Verdadeiro se a assinatura não expirou' },
                { v: 'custom_var',  l: 'Variável de sessão',  desc: 'Compara valor salvo no fluxo' },
              ].map(opt => (
                <button key={opt.v} type="button" onClick={() => set({ condition_type: opt.v as NodeData['condition_type'] })}
                  className="w-full rounded-xl p-3 text-left transition-all"
                  style={(d.condition_type ?? 'has_paid') === opt.v
                    ? { background: `rgba(${c.rgb},0.12)`, border: `1px solid rgba(${c.rgb},0.45)` }
                    : { background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(255,255,255,0.82)' }}>
                  <p className="text-[11px] font-semibold text-slate-700">{opt.l}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{opt.desc}</p>
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

        {/* randomizer */}
        {node.type === 'randomizer' && (
          <Field label="Número de caminhos">
            <div className="flex gap-1.5 mb-3">
              {[2, 3, 4, 5].map(n => (
                <Chip key={n} active={(d.paths ?? 2) === n} color={c.rgb} onClick={() => set({ paths: n })}>{n}</Chip>
              ))}
            </div>
            <div className="rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(255,255,255,0.82)' }}>
              <p className="text-[10px] text-slate-500">
                Cada saída recebe ~{Math.round(100 / (d.paths ?? 2))}% do tráfego aleatoriamente.
                Ideal para testes A/B de mensagens ou fluxos diferentes.
              </p>
            </div>
          </Field>
        )}

        {/* goto */}
        {node.type === 'goto' && (
          <Field label="ID do nó destino">
            <Input value={String(d.goto_node_id ?? '')} onChange={e => set({ goto_node_id: e.target.value })}
              placeholder="ex: message_1234, payment_5678" className="text-xs h-8" />
            <p className="text-[10px] text-slate-600 mt-1">Clique em qualquer nó para ver seu ID no topo deste painel.</p>
          </Field>
        )}

        {/* payment */}
        {node.type === 'payment' && (
          <Field label="Plano a cobrar">
            <div className="space-y-1.5">
              {plans.length === 0 ? (
                <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.72)', border: '1px dashed rgba(255,255,255,0.84)' }}>
                  <p className="text-[11px] text-slate-500">Nenhum plano cadastrado.</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">Crie planos na aba Planos primeiro.</p>
                </div>
              ) : plans.map(plan => (
                <button key={plan.id} type="button" onClick={() => set({ plan_id: plan.id, plan_name: plan.name })}
                  className="w-full rounded-xl px-3 py-2.5 flex items-center justify-between text-left transition-all"
                  style={d.plan_id === plan.id
                    ? { background: `rgba(${c.rgb},0.12)`, border: `1px solid rgba(${c.rgb},0.45)` }
                    : { background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(255,255,255,0.82)' }}>
                  <div className="flex items-center gap-2">
                    {d.plan_id === plan.id && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: `rgb(${c.rgb})` }} />}
                    <p className="text-[11px] font-semibold text-slate-700">{plan.name}</p>
                  </div>
                  <p className="text-[11px] font-bold" style={{ color: `rgb(${c.rgb})` }}>
                    R$ {Number(plan.price).toFixed(2).replace('.', ',')}
                  </p>
                </button>
              ))}
            </div>
          </Field>
        )}

        {/* order_bump */}
        {node.type === 'order_bump' && (
          <>
            <Field label="Nome da oferta">
              <Input value={String(d.order_bump_name ?? '')} onChange={e => set({ order_bump_name: e.target.value })}
                placeholder="Ex: Acesso Premium 90 dias" className="text-xs h-8" />
            </Field>
            <Field label="Preço (R$)">
              <Input type="number" min={0} step={0.01} value={String(d.order_bump_price ?? 0)}
                onChange={e => set({ order_bump_price: parseFloat(e.target.value) || 0 })}
                className="text-xs h-8" />
            </Field>
            <Field label="Descrição curta">
              <Textarea value={String(d.order_bump_desc ?? '')} onChange={e => set({ order_bump_desc: e.target.value })}
                placeholder="Uma linha de copy da oferta..." className="min-h-[52px] text-xs resize-none" />
            </Field>
          </>
        )}

        {/* upsell */}
        {node.type === 'upsell' && (
          <>
            <Field label="Plano de upgrade">
              <div className="space-y-1.5">
                {plans.length === 0
                  ? <p className="text-[11px] text-slate-500 italic">Crie planos na aba Planos primeiro.</p>
                  : plans.map(plan => (
                    <button key={plan.id} type="button" onClick={() => set({ upsell_plan_id: plan.id, upsell_plan_name: plan.name })}
                      className="w-full rounded-xl px-3 py-2 flex items-center justify-between text-left transition-all"
                      style={d.upsell_plan_id === plan.id
                        ? { background: `rgba(${c.rgb},0.12)`, border: `1px solid rgba(${c.rgb},0.45)` }
                        : { background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(255,255,255,0.82)' }}>
                      <p className="text-[11px] font-semibold text-slate-700">{plan.name}</p>
                      <p className="text-[11px] font-bold" style={{ color: `rgb(${c.rgb})` }}>R$ {Number(plan.price).toFixed(2).replace('.', ',')}</p>
                    </button>
                  ))}
              </div>
            </Field>
            <Field label="Mensagem do upsell">
              <Textarea value={String(d.upsell_message ?? '')} onChange={e => set({ upsell_message: e.target.value })}
                placeholder="Que tal aproveitar e fazer upgrade para..." className="min-h-[72px] text-xs resize-none" />
            </Field>
          </>
        )}

        {/* downsell */}
        {node.type === 'downsell' && (
          <>
            <Field label="Plano alternativo">
              <div className="space-y-1.5">
                {plans.length === 0
                  ? <p className="text-[11px] text-slate-500 italic">Crie planos primeiro.</p>
                  : plans.map(plan => (
                    <button key={plan.id} type="button" onClick={() => set({ downsell_plan_id: plan.id, downsell_plan_name: plan.name })}
                      className="w-full rounded-xl px-3 py-2 flex items-center justify-between text-left transition-all"
                      style={d.downsell_plan_id === plan.id
                        ? { background: `rgba(${c.rgb},0.12)`, border: `1px solid rgba(${c.rgb},0.45)` }
                        : { background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(255,255,255,0.82)' }}>
                      <p className="text-[11px] font-semibold text-slate-700">{plan.name}</p>
                      <p className="text-[11px] font-bold" style={{ color: `rgb(${c.rgb})` }}>R$ {Number(plan.price).toFixed(2).replace('.', ',')}</p>
                    </button>
                  ))}
              </div>
            </Field>
            <Field label="Mensagem do downsell">
              <Textarea value={String(d.downsell_message ?? '')} onChange={e => set({ downsell_message: e.target.value })}
                placeholder="Tudo bem! Que tal essa opção por um valor menor..." className="min-h-[72px] text-xs resize-none" />
            </Field>
          </>
        )}

        {/* temp_group */}
        {node.type === 'temp_group' && (
          <>
            <Field label="Link de convite do grupo/canal">
              <Input value={String(d.temp_group_link ?? '')} onChange={e => set({ temp_group_link: e.target.value })}
                placeholder="https://t.me/+xxxxxxxxxx" className="text-xs h-8" />
            </Field>
            <Field label="Dias de acesso">
              <div className="grid grid-cols-4 gap-1.5">
                {[7, 15, 30, 60, 90, 180, 365].map(days => (
                  <Chip key={days} active={(d.temp_group_days ?? 30) === days} color={c.rgb}
                    onClick={() => set({ temp_group_days: days })}>{days}d</Chip>
                ))}
              </div>
            </Field>
          </>
        )}

        {/* deliver */}
        {node.type === 'deliver' && (
          <Field label="Tipo de entrega">
            <div className="space-y-1.5">
              {[
                { v: 'channel_link', l: 'Link de canal/grupo', desc: 'Envia link único de acesso' },
                { v: 'account',      l: 'Conta do estoque',    desc: 'Entrega login/senha' },
              ].map(opt => (
                <button key={opt.v} type="button" onClick={() => set({ deliver_type: opt.v as NodeData['deliver_type'] })}
                  className="w-full rounded-xl p-3 text-left transition-all"
                  style={(d.deliver_type ?? 'channel_link') === opt.v
                    ? { background: `rgba(${c.rgb},0.12)`, border: `1px solid rgba(${c.rgb},0.45)` }
                    : { background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(255,255,255,0.82)' }}>
                  <p className="text-[11px] font-semibold text-slate-700">{opt.l}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </Field>
        )}

        {/* note */}
        {node.type === 'note' && (
          <Field label="Texto da anotação">
            <Textarea value={String(d.note_text ?? '')} onChange={e => set({ note_text: e.target.value })}
              placeholder="Observação para sua referência (não executa no bot)..." className="min-h-[120px] text-xs resize-none" />
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
        : { background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.84)', color: '#64748b' }}>
      {children}
    </button>
  )
}

// ─── Palette categories ────────────────────────────────────────────────────────

const PALETTE_CATEGORIES: { label: string; rgb: string; items: { type: FlowNodeType; desc: string }[] }[] = [
  {
    label: 'COMUNICAÇÃO',
    rgb: '96,165,250',
    items: [
      { type: 'composite',  desc: 'Texto + mídia + botões' },
      { type: 'message',    desc: 'Texto com HTML e variáveis' },
      { type: 'image',      desc: 'Envia imagem' },
      { type: 'video',      desc: 'Envia vídeo' },
      { type: 'audio',      desc: 'Envia áudio ou música' },
      { type: 'file',       desc: 'Envia arquivo/documento' },
      { type: 'video_note', desc: 'Vídeo circular' },
      { type: 'typing',     desc: 'Simula digitação' },
      { type: 'buttons',    desc: 'Botões inline com saídas' },
      { type: 'user_input', desc: 'Aguarda resposta → variável' },
      { type: 'location',   desc: 'Solicita localização' },
    ],
  },
  {
    label: 'LÓGICA & FLUXO',
    rgb: '251,191,36',
    items: [
      { type: 'delay',       desc: 'Pausa por tempo fixo' },
      { type: 'smart_delay', desc: 'Delay condicional' },
      { type: 'trigger',     desc: 'Reage a evento' },
      { type: 'condition',   desc: 'Bifurca por condição' },
      { type: 'randomizer',  desc: 'Divide em N caminhos' },
      { type: 'goto',        desc: 'Pula para outro nó' },
    ],
  },
  {
    label: 'PAGAMENTO',
    rgb: '34,197,94',
    items: [
      { type: 'payment',    desc: 'Gera PIX e aguarda' },
      { type: 'order_bump', desc: 'Oferta extra no checkout' },
    ],
  },
  {
    label: 'SEQUÊNCIAS',
    rgb: '52,211,153',
    items: [
      { type: 'upsell',   desc: 'Oferta de plano superior' },
      { type: 'downsell', desc: 'Oferta alternativa menor' },
    ],
  },
  {
    label: 'ENTREGA',
    rgb: '232,121,249',
    items: [
      { type: 'temp_group', desc: 'Acesso temporário a grupo' },
      { type: 'deliver',    desc: 'Entrega link ou conta' },
    ],
  },
  {
    label: 'OUTROS',
    rgb: '100,116,139',
    items: [
      { type: 'note', desc: 'Anotação (não executa)' },
      { type: 'end',  desc: 'Encerra o fluxo' },
    ],
  },
]

// ─── Default data per type ────────────────────────────────────────────────────

function getDefaultData(type: FlowNodeType): Partial<NodeData> {
  const ts = Date.now()
  const map: Partial<Record<FlowNodeType, Partial<NodeData>>> = {
    message:     { text: '' },
    composite:   { text: '', buttons: [] },
    image:       { file_url: '', caption: '' },
    video:       { file_url: '', caption: '' },
    audio:       { file_url: '' },
    file:        { file_url: '', caption: '' },
    video_note:  { file_url: '' },
    typing:      { delay_seconds: 2 },
    buttons:     { text: 'Escolha uma opção:', buttons: [{ label: 'Opção 1', value: `b${ts}` }] },
    user_input:  { variable_name: 'resposta', variable_type: 'text', prompt_text: 'Digite sua resposta:' },
    location:    { prompt_text: 'Compartilhe sua localização:' },
    delay:       { delay_seconds: 60 },
    smart_delay: { smart_delay_hours: 1, smart_delay_condition: 'no_response' },
    trigger:     { trigger_event: 'message' },
    condition:   { condition_type: 'has_paid' },
    randomizer:  { paths: 2 },
    goto:        { goto_node_id: '' },
    payment:     {},
    order_bump:  { order_bump_name: '', order_bump_price: 0, order_bump_desc: '' },
    upsell:      { upsell_message: '' },
    downsell:    { downsell_message: '' },
    temp_group:  { temp_group_days: 30, temp_group_link: '' },
    deliver:     { deliver_type: 'channel_link' },
    note:        { note_text: '' },
  }
  return map[type] ?? {}
}

// ─── Default flow ──────────────────────────────────────────────────────────────

const DEFAULT_FLOW = {
  nodes: [
    { id: 'start_1',   type: 'start',   position: { x: 200, y: 30 },  data: {} },
    { id: 'message_1', type: 'message', position: { x: 155, y: 160 }, data: { text: 'Olá! Bem-vindo ao nosso bot.' } },
    { id: 'end_1',     type: 'end',     position: { x: 185, y: 320 }, data: {} },
  ],
  edges: [
    { id: 'e1', source: 'start_1',   target: 'message_1' },
    { id: 'e2', source: 'message_1', target: 'end_1' },
  ],
}

// ─── Inner editor ──────────────────────────────────────────────────────────────

function EditorInner({ botId, initialFlowConfig, plans }: { botId: string; initialFlowConfig: unknown; plans: Plan[] }) {
  const cfg = (initialFlowConfig ?? DEFAULT_FLOW) as { nodes: Node<NodeData>[]; edges: Edge[] }
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodeData>>(cfg.nodes as Node<NodeData>[])
  const [edges, setEdges, onEdgesChange] = useEdgesState(cfg.edges.map(e => ({ ...e, type: 'deletable' })))
  const [selectedNode, setSelectedNode] = useState<Node<NodeData> | null>(null)
  const [saving, setSaving] = useState(false)
  const [savedOk, setSavedOk] = useState(false)
  const counter = useRef(Date.now())

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
    setNodes(ns => [...ns, { id, type, position: { x: 180 + Math.random() * 100, y: 200 + Math.random() * 80 }, data: getDefaultData(type) }])
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

      <div className="flex gap-3" style={{ height: 680 }}>
        {/* Palette sidebar */}
        <div className="w-52 shrink-0 flex flex-col overflow-hidden">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 px-1 pb-2 shrink-0">Blocos</p>
          <div className="flex-1 overflow-y-auto space-y-3 pr-0.5" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(139,92,246,0.2) transparent' }}>
            {PALETTE_CATEGORIES.map(cat => (
              <div key={cat.label}>
                <p className="text-[9px] font-bold uppercase tracking-widest px-0.5 pb-1.5" style={{ color: `rgba(${cat.rgb},0.65)` }}>{cat.label}</p>
                <div className="space-y-1">
                  {cat.items.map(item => {
                    const c = C[item.type]
                    return (
                      <button key={item.type} onClick={() => addNode(item.type)}
                        className="w-full flex items-center gap-2 rounded-xl p-2 text-left transition-all hover:scale-[1.01] active:scale-[0.98]"
                        style={{ background: `rgba(${c.rgb},0.06)`, border: `1px solid rgba(${c.rgb},0.15)` }}>
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg" style={{ background: `rgba(${c.rgb},0.15)` }}>
                          <span style={{ color: `rgb(${c.rgb})` }}>{c.icon}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-slate-700 truncate">{c.label}</p>
                          <p className="text-[9px] text-slate-600 leading-tight truncate">{item.desc}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-2 shrink-0 rounded-xl p-2.5 space-y-1" style={{ background: 'rgba(255,255,255,0.68)', border: '1px solid rgba(255,255,255,0.80)' }}>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
              <Keyboard className="h-2.5 w-2.5" /> Atalhos
            </p>
            <p className="text-[9px] text-slate-700">Clique na seta → Delete remove</p>
            <p className="text-[9px] text-slate-700">Clique no nó → abre configuração</p>
            <p className="text-[9px] text-slate-700">Scroll zoom · Drag para mover</p>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 rounded-2xl overflow-hidden" style={{ background: '#f8f6ff', border: '1px solid rgba(139,92,246,0.15)' }}>
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
            <Background color="rgba(139,92,246,0.06)" gap={24} size={1} />
            <Controls showInteractive={false}
              style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }} />
            <MiniMap nodeColor={n => `rgb(${C[n.type as FlowNodeType]?.rgb ?? '100,116,139'})`}
              maskColor="rgba(139,92,246,0.08)"
              style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10 }} />
          </ReactFlow>
        </div>

        {/* Config panel */}
        <div className="w-64 shrink-0">
          {selectedNode ? (
            <div className="h-full rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.88)', border: '1px solid rgba(0,0,0,0.08)' }}>
              <ConfigPanel node={selectedNode} plans={plans}
                onChange={(id, data) => setNodes(ns => ns.map(n => n.id === id ? { ...n, data } : n))}
                onDelete={deleteNode} />
            </div>
          ) : (
            <div className="h-full rounded-2xl flex flex-col items-center justify-center gap-4 p-5 text-center"
              style={{ background: 'rgba(139,92,246,0.02)', border: '1px dashed rgba(139,92,246,0.20)' }}>
              <div className="h-12 w-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.75)' }}>
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
