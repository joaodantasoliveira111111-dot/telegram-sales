import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { FUNNEL_TEMPLATES } from '@/lib/funnel-templates'

export async function GET() {
  return NextResponse.json(FUNNEL_TEMPLATES)
}

// Apply a template to a bot — creates messages + plans
export async function POST(request: NextRequest) {
  const { bot_id, template_id } = await request.json()
  if (!bot_id || !template_id) return NextResponse.json({ error: 'bot_id e template_id obrigatórios' }, { status: 400 })

  const template = FUNNEL_TEMPLATES.find(t => t.id === template_id)
  if (!template) return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 })

  // Upsert messages
  const messageUpserts = Object.entries(template.messages).map(([key, content]) => ({
    bot_id,
    message_key: key,
    content,
    updated_at: new Date().toISOString(),
  }))

  const { error: msgError } = await supabaseAdmin
    .from('bot_messages')
    .upsert(messageUpserts, { onConflict: 'bot_id,message_key' })

  if (msgError) return NextResponse.json({ error: msgError.message }, { status: 500 })

  // Create plans
  const planInserts = template.plans.map(p => ({
    bot_id,
    name: p.name,
    price: p.price,
    duration_days: p.duration_days,
    button_text: p.button_text,
    plan_role: p.plan_role,
    content_type: 'link',
    kick_on_expire: p.kick_on_expire ?? false,
    renewal_discount_pct: p.renewal_discount_pct ?? 0,
  }))

  const { data: plans, error: planError } = await supabaseAdmin
    .from('plans')
    .insert(planInserts)
    .select()

  if (planError) return NextResponse.json({ error: planError.message }, { status: 500 })

  // Update bot with template settings
  await supabaseAdmin.from('bots').update({
    bot_type: template.bot_type,
    flow_type: template.flow_type,
    protect_content: template.protect_content,
  }).eq('id', bot_id)

  return NextResponse.json({ ok: true, plans_created: plans?.length ?? 0, messages_updated: messageUpserts.length })
}
