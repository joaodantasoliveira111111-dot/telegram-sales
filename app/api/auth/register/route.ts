import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase'

function hashPassword(password: string, salt: string): string {
  return createHash('sha256').update(salt + password).digest('hex')
}

export async function POST(request: NextRequest) {
  let body: { name?: string; email?: string; phone?: string; cpf_cnpj?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const { name, email, phone, cpf_cnpj, password } = body

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Nome, e-mail e senha são obrigatórios' }, { status: 400 })
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'Senha deve ter pelo menos 6 caracteres' }, { status: 400 })
  }

  // Check if email already exists
  const { data: existing } = await supabaseAdmin
    .from('saas_users')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .single()

  if (existing) {
    return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 409 })
  }

  const salt = randomBytes(16).toString('hex')
  const passwordHash = hashPassword(password, salt)
  const sessionToken = randomBytes(32).toString('hex')

  const { data: user, error } = await supabaseAdmin
    .from('saas_users')
    .insert({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() ?? null,
      cpf_cnpj: cpf_cnpj?.trim() ?? null,
      password_hash: passwordHash,
      password_salt: salt,
      session_token: sessionToken,
      plan_type: 'pay_per_use',
    })
    .select('id, name, email, plan_type')
    .single()

  if (error || !user) {
    return NextResponse.json({ error: 'Erro ao criar conta' }, { status: 500 })
  }

  const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email } })
  res.cookies.set('ubsession', `${user.id}:${sessionToken}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
  return res
}
