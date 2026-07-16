import { createHmac } from 'crypto'

export interface TelegramWebAppUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
}

// Validates the `initData` string a Telegram Mini App receives from
// window.Telegram.WebApp.initData, per Telegram's documented scheme:
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
//
// secret_key = HMAC_SHA256(<bot_token>, "WebAppData")
// expected_hash = HMAC_SHA256(secret_key, <data_check_string>)
export function validateInitData(botToken: string, initData: string, maxAgeSeconds = 86400): TelegramWebAppUser | null {
  if (!botToken || !initData) return null

  const params = new URLSearchParams(initData)
  const hash = params.get('hash')
  if (!hash) return null
  params.delete('hash')

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n')

  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest()
  const expectedHash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex')

  if (expectedHash !== hash) return null

  const authDate = Number(params.get('auth_date') ?? 0)
  if (!authDate || Date.now() / 1000 - authDate > maxAgeSeconds) return null

  const userRaw = params.get('user')
  if (!userRaw) return null

  try {
    const user = JSON.parse(userRaw) as TelegramWebAppUser
    if (!user.id) return null
    return user
  } catch {
    return null
  }
}
