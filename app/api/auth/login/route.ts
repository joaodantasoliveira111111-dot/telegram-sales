import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  let username: string, password: string
  try {
    const body = await request.json()
    username = body.username
    password = body.password
  } catch {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const validUsername = process.env.AUTH_USERNAME ?? 'eufilipisantos'
  const validPassword = process.env.AUTH_PASSWORD ?? 'Melf1209@'
  const secret = process.env.SESSION_SECRET ?? 'tgsales-session-secret'

  if (username !== validUsername || password !== validPassword) {
    return NextResponse.json({ error: 'Usuário ou senha incorretos' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set('tgsession', secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
  return res
}
