import { createHmac, timingSafeEqual } from 'crypto'

function secret() {
  return process.env.CLOAKER_SECRET ?? process.env.CRON_SECRET ?? 'dev-secret-change-me'
}

// ─── session cookie ───────────────────────────────────────────────────────────
// Signs the slug so we can verify the browser actually visited /c/[slug]
// before calling /api/cloakers/verify

export function signSession(slug: string): string {
  const ts = Math.floor(Date.now() / 1000)
  const payload = `${slug}:${ts}`
  const sig = createHmac('sha256', secret()).update(payload).digest('hex').slice(0, 24)
  return Buffer.from(`${payload}:${sig}`).toString('base64url')
}

export function verifySession(cookie: string, slug: string): boolean {
  try {
    const decoded = Buffer.from(cookie, 'base64url').toString()
    const parts = decoded.split(':')
    if (parts.length !== 3) return false
    const [s, ts, sig] = parts
    if (s !== slug) return false
    // max 10 minutes old
    if (Math.floor(Date.now() / 1000) - Number(ts) > 600) return false
    const expected = createHmac('sha256', secret()).update(`${s}:${ts}`).digest('hex').slice(0, 24)
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  } catch {
    return false
  }
}

// ─── redirect token ───────────────────────────────────────────────────────────
// Short-lived token (30s) carrying verdict + cloaker_id. Never exposes URLs.

export function signToken(cloakerId: string, verdict: 'h' | 's'): string {
  const exp = Math.floor(Date.now() / 1000) + 30
  const payload = Buffer.from(JSON.stringify({ c: cloakerId, v: verdict, e: exp })).toString('base64url')
  const sig = createHmac('sha256', secret()).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

export function verifyToken(token: string): { cloakerId: string; verdict: 'h' | 's' } | null {
  try {
    const dot = token.lastIndexOf('.')
    if (dot === -1) return null
    const payload = token.slice(0, dot)
    const sig = token.slice(dot + 1)
    const expected = createHmac('sha256', secret()).update(payload).digest('base64url')
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (!data.e || Math.floor(Date.now() / 1000) > data.e) return null // expired
    return { cloakerId: data.c, verdict: data.v }
  } catch {
    return null
  }
}
