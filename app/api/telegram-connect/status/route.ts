import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data } = await supabaseAdmin
    .from('telegram_sessions')
    .select('phone, status, account_name, account_username, updated_at')
    .eq('status', 'connected')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return NextResponse.json({ session: data ?? null })
}

export async function DELETE() {
  await supabaseAdmin
    .from('telegram_sessions')
    .update({ status: 'disconnected', session_string: '', updated_at: new Date().toISOString() })
    .eq('status', 'connected')

  return NextResponse.json({ ok: true })
}
