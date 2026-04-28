import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase'

function hashPassword(password: string, salt: string): string {
  return createHash('sha256').update(salt + password).digest('hex')
}

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const { email, password } = body
  if (!email || !password) {
    return NextResponse.json({ error: 'E-mail e senha são obrigatórios' }, { status: 400 })
  }

  const { data: user } = await supabaseAdmin
    .from('saas_users')
    .select('id, name, email, password_hash, password_salt, is_active, plan_type')
    .eq('email', email.toLowerCase().trim())
    .single()

  if (!user) {
    return NextResponse.json({ error: 'E-mail ou senha incorretos' }, { status: 401 })
  }

  if (!user.is_active) {
    return NextResponse.json({ error: 'Conta desativada. Entre em contato com o suporte.' }, { status: 403 })
  }

  const hash = hashPassword(password, user.password_salt)
  if (hash !== user.password_hash) {
    return NextResponse.json({ error: 'E-mail ou senha incorretos' }, { status: 401 })
  }

  const sessionToken = randomBytes(32).toString('hex')
  await supabaseAdmin
    .from('saas_users')
    .update({ session_token: sessionToken })
    .eq('id', user.id)

  const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, plan_type: user.plan_type } })
  res.cookies.set('ubsession', `${user.id}:${sessionToken}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
  return res
}
