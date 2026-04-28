import { supabaseAdmin } from './supabase'
import { sendMessage, sendPhoto, sendVideo, sendAudio, sendButtons } from './telegram'

interface FlowNode {
  id: string
  type: string
  data: Record<string, unknown>
}

interface FlowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
}

interface FlowConfig {
  nodes: FlowNode[]
  edges: FlowEdge[]
}

interface FlowSession {
  id: string
  bot_id: string
  telegram_id: string
  current_node_id: string
  state: Record<string, unknown>
}

function findNode(flow: FlowConfig, id: string): FlowNode | undefined {
  return flow.nodes.find(n => n.id === id)
}

function nextNodeId(flow: FlowConfig, fromId: string, sourceHandle?: string): string | null {
  const edge = flow.edges.find(e => e.source === fromId && (sourceHandle ? e.sourceHandle === sourceHandle : true))
  return edge?.target ?? null
}

async function evaluateCondition(node: FlowNode, botId: string, telegramId: string, state: Record<string, unknown>): Promise<boolean> {
  const ct = node.data.condition_type as string
  if (ct === 'has_paid') {
    const { data } = await supabaseAdmin
      .from('payments')
      .select('id')
      .eq('bot_id', botId)
      .eq('telegram_id', telegramId)
      .eq('status', 'approved')
      .limit(1)
    return (data?.length ?? 0) > 0
  }
  if (ct === 'has_plan') {
    const now = new Date().toISOString()
    const { data } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('bot_id', botId)
      .eq('telegram_id', telegramId)
      .gte('expires_at', now)
      .limit(1)
    return (data?.length ?? 0) > 0
  }
  if (ct === 'custom_var') {
    return String(state[node.data.condition_var as string] ?? '') === String(node.data.condition_value ?? '')
  }
  return false
}

export async function executeFlowStep(
  botId: string,
  telegramId: string,
  token: string,
  chatId: string | number,
  protectContent: boolean,
  callbackData?: string,
): Promise<void> {
  const { data: bot } = await supabaseAdmin
    .from('bots')
    .select('flow_config')
    .eq('id', botId)
    .single()

  if (!bot?.flow_config) return

  const flow = bot.flow_config as FlowConfig

  // Get or create session
  let session: FlowSession | null = null
  const { data: existing } = await supabaseAdmin
    .from('flow_sessions')
    .select('*')
    .eq('bot_id', botId)
    .eq('telegram_id', telegramId)
    .single()

  if (existing) {
    session = existing as FlowSession
  } else {
    // Start from start node
    const startNode = flow.nodes.find(n => n.type === 'start')
    if (!startNode) return
    const nextId = nextNodeId(flow, startNode.id)
    if (!nextId) return
    const { data: created } = await supabaseAdmin
      .from('flow_sessions')
      .insert({ bot_id: botId, telegram_id: telegramId, current_node_id: nextId, state: {} })
      .select()
      .single()
    session = created as FlowSession
  }

  if (!session) return

  // If callback, find which button was clicked and advance to corresponding edge
  if (callbackData && session.current_node_id) {
    const currentNode = findNode(flow, session.current_node_id)
    if (currentNode?.type === 'buttons') {
      const buttons = (currentNode.data.buttons ?? []) as { label: string; value: string }[]
      const btnIndex = buttons.findIndex(b => b.value === callbackData)
      if (btnIndex >= 0) {
        const nextId = nextNodeId(flow, currentNode.id, `btn_${btnIndex}`)
        if (nextId) {
          await supabaseAdmin
            .from('flow_sessions')
            .update({ current_node_id: nextId, updated_at: new Date().toISOString() })
            .eq('id', session.id)
          session.current_node_id = nextId
        }
      }
    }
  }

  // Execute nodes until we hit a blocking node (buttons, payment, end) or run out
  let safety = 0
  while (safety++ < 20) {
    const node = findNode(flow, session.current_node_id)
    if (!node) break

    if (node.type === 'end') {
      await supabaseAdmin.from('flow_sessions').delete().eq('id', session.id)
      break
    }

    if (node.type === 'message') {
      const text = String(node.data.text ?? '')
      const mediaUrl = node.data.media_url as string | undefined
      const mediaType = node.data.media_type as 'photo' | 'video' | 'audio' | undefined
      const opts = { protect_content: protectContent }

      if (mediaUrl && mediaType === 'photo') await sendPhoto(token, chatId, mediaUrl, text, opts)
      else if (mediaUrl && mediaType === 'video') await sendVideo(token, chatId, mediaUrl, text, opts)
      else if (mediaUrl && mediaType === 'audio') await sendAudio(token, chatId, mediaUrl, text, opts)
      else await sendMessage(token, chatId, text, opts)

      const nextId = nextNodeId(flow, node.id)
      if (!nextId) break
      session.current_node_id = nextId
      await supabaseAdmin.from('flow_sessions').update({ current_node_id: nextId, updated_at: new Date().toISOString() }).eq('id', session.id)
      continue
    }

    if (node.type === 'delay') {
      const delayMs = Number(node.data.delay_seconds ?? 0) * 1000
      if (delayMs > 0) {
        // Store delay completion time in state and pause execution
        const resumeAt = new Date(Date.now() + delayMs).toISOString()
        await supabaseAdmin.from('flow_sessions').update({
          state: { ...session.state, delay_resume_at: resumeAt, delay_next_node: nextNodeId(flow, node.id) },
          updated_at: new Date().toISOString(),
        }).eq('id', session.id)
      } else {
        const nextId = nextNodeId(flow, node.id)
        if (nextId) {
          session.current_node_id = nextId
          await supabaseAdmin.from('flow_sessions').update({ current_node_id: nextId, updated_at: new Date().toISOString() }).eq('id', session.id)
        }
      }
      break
    }

    if (node.type === 'condition') {
      const result = await evaluateCondition(node, botId, telegramId, session.state)
      const nextId = nextNodeId(flow, node.id, result ? 'yes' : 'no')
      if (!nextId) break
      session.current_node_id = nextId
      await supabaseAdmin.from('flow_sessions').update({ current_node_id: nextId, updated_at: new Date().toISOString() }).eq('id', session.id)
      continue
    }

    if (node.type === 'buttons') {
      const text = String(node.data.text ?? 'Escolha uma opção:')
      const buttons = (node.data.buttons ?? []) as { label: string; value: string }[]
      const kb = [buttons.map(b => ({ text: b.label, callback_data: b.value }))]
      await sendButtons(token, chatId, text, kb)
      // Stay on this node waiting for callback
      break
    }

    if (node.type === 'payment') {
      // Payment is handled by the main webhook — just stop execution here
      break
    }

    if (node.type === 'deliver') {
      // Delivery is handled by the payment webhook — just stop execution here
      break
    }

    break
  }
}

// Called after successful payment to resume flow from a payment or deliver node
export async function resumeFlowAfterPayment(
  botId: string,
  telegramId: string,
  token: string,
  chatId: string | number,
  protectContent: boolean,
): Promise<void> {
  const { data: session } = await supabaseAdmin
    .from('flow_sessions')
    .select('*')
    .eq('bot_id', botId)
    .eq('telegram_id', telegramId)
    .single()

  if (!session) return

  const { data: bot } = await supabaseAdmin.from('bots').select('flow_config').eq('id', botId).single()
  if (!bot?.flow_config) return
  const flow = bot.flow_config as FlowConfig

  const currentNode = findNode(flow, session.current_node_id)
  if (!currentNode || (currentNode.type !== 'payment' && currentNode.type !== 'deliver')) return

  const nextId = nextNodeId(flow, currentNode.id)
  if (!nextId) return

  await supabaseAdmin
    .from('flow_sessions')
    .update({ current_node_id: nextId, updated_at: new Date().toISOString() })
    .eq('id', session.id)

  await executeFlowStep(botId, telegramId, token, chatId, protectContent)
}
