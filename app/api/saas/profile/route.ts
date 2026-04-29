import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'
import { getSessionFromRequest } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

function hashPassword(password: string, salt: string): string {
  return createHash('sha256').update(salt + password).digest('hex')
}

export async function PUT(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  if (!session || session.type !== 'user') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { name?: string; current_password?: string; new_password?: string }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const { name, current_password, new_password } = body
  const updates: Record<string, string> = {}

  if (name !== undefined) {
    if (!name.trim()) return NextResponse.json({ error: 'Nome não pode ser vazio' }, { status: 400 })
    updates.name = name.trim()
  }

  if (new_password !== undefined) {
    if (!current_password) return NextResponse.json({ error: 'Informe a senha atual' }, { status: 400 })
    if (new_password.length < 6) return NextResponse.json({ error: 'Nova senha deve ter ao menos 6 caracteres' }, { status: 400 })

    const { data: user } = await supabaseAdmin
      .from('saas_users')
      .select('password_hash, password_salt')
      .eq('id', session.userId!)
      .single()

    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    const currentHash = hashPassword(current_password, user.password_salt)
    if (currentHash !== user.password_hash) {
      return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 })
    }

    const salt = randomBytes(16).toString('hex')
    updates.password_salt = salt
    updates.password_hash = hashPassword(new_password, salt)
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nenhuma alteração enviada' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('saas_users')
    .update(updates)
    .eq('id', session.userId!)

  if (error) return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
