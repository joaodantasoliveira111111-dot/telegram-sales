import { NextRequest } from 'next/server'
import { supabaseAdmin } from './supabase'

export type SessionType = 'admin' | 'user'

export interface SessionInfo {
  type: SessionType
  userId?: string
}

// ── For API routes (reads from request cookies) ───────────────────────────────
export function getSessionFromRequest(request: NextRequest): Promise<SessionInfo | null> {
  const adminSession = request.cookies.get('tgsession')?.value
  const adminSecret = process.env.SESSION_SECRET ?? 'tgsales-session-secret'
  if (adminSession === adminSecret) return Promise.resolve({ type: 'admin' })

  const userSession = request.cookies.get('ubsession')?.value
  return resolveUserSession(userSession)
}

// ── For Server Components (reads from next/headers cookie store) ──────────────
export async function getSessionFromCookies(
  cookieStore: { get: (name: string) => { value: string } | undefined }
): Promise<SessionInfo | null> {
  const adminSession = cookieStore.get('tgsession')?.value
  const adminSecret = process.env.SESSION_SECRET ?? 'tgsales-session-secret'
  if (adminSession === adminSecret) return { type: 'admin' }

  const userSession = cookieStore.get('ubsession')?.value
  return resolveUserSession(userSession)
}

async function resolveUserSession(cookie: string | undefined): Promise<SessionInfo | null> {
  if (!cookie || !cookie.includes(':')) return null
  const [userId, token] = cookie.split(':')
  if (!/^[0-9a-f-]{36}$/.test(userId)) return null

  const { data } = await supabaseAdmin
    .from('saas_users')
    .select('id, is_active')
    .eq('id', userId)
    .eq('session_token', token)
    .eq('is_active', true)
    .maybeSingle()

  if (!data) return null
  return { type: 'user', userId: data.id }
}

// ── Helper: get all bot IDs for a user ────────────────────────────────────────
export async function getUserBotIds(userId: string): Promise<string[]> {
  const { data } = await supabaseAdmin
    .from('bots')
    .select('id')
    .eq('saas_user_id', userId)
  return (data ?? []).map((b: { id: string }) => b.id)
}

// ── Apply bot-linked filter to a query ────────────────────────────────────────
// Returns { query, empty } — if empty=true, caller should return [] immediately
export async function applyBotFilter<T>(
  query: T,
  session: SessionInfo,
  applyFn: (q: T, botIds: string[]) => T
): Promise<{ query: T; empty: boolean }> {
  if (session.type === 'admin') return { query, empty: false }
  const botIds = await getUserBotIds(session.userId!)
  if (botIds.length === 0) return { query, empty: true }
  return { query: applyFn(query, botIds), empty: false }
}
