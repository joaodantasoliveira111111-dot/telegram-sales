import { TelegramInlineKeyboardButton } from '@/types'

const BASE = (token: string) => `https://api.telegram.org/bot${token}`

async function telegramFetch(token: string, method: string, body: Record<string, unknown>) {
  const res = await fetch(`${BASE(token)}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!data.ok) {
    console.error(`[Telegram] ${method} failed:`, data.description)
  }
  return data
}

export async function sendMessage(token: string, chatId: string | number, text: string) {
  return telegramFetch(token, 'sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
  })
}

export async function sendPhoto(
  token: string,
  chatId: string | number,
  photoUrl: string,
  caption?: string
) {
  return telegramFetch(token, 'sendPhoto', {
    chat_id: chatId,
    photo: photoUrl,
    caption,
    parse_mode: 'HTML',
  })
}

// Send photo from base64 string (e.g. QR code from payment gateways)
export async function sendPhotoBase64(
  token: string,
  chatId: string | number,
  base64: string,
  caption?: string
) {
  const clean = base64.replace(/^data:image\/\w+;base64,/, '')
  const buffer = Buffer.from(clean, 'base64')
  const form = new FormData()
  form.append('chat_id', String(chatId))
  form.append('photo', new Blob([buffer], { type: 'image/png' }), 'qrcode.png')
  if (caption) { form.append('caption', caption); form.append('parse_mode', 'HTML') }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
    method: 'POST',
    body: form,
  })
  const data = await res.json()
  if (!data.ok) console.error('[Telegram] sendPhotoBase64 failed:', data.description)
  return data
}

export async function sendVideo(
  token: string,
  chatId: string | number,
  videoUrl: string,
  caption?: string
) {
  return telegramFetch(token, 'sendVideo', {
    chat_id: chatId,
    video: videoUrl,
    caption,
    parse_mode: 'HTML',
  })
}

export async function sendButtons(
  token: string,
  chatId: string | number,
  text: string,
  buttons: TelegramInlineKeyboardButton[][]
) {
  return telegramFetch(token, 'sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: buttons,
    },
  })
}

export async function answerCallbackQuery(token: string, callbackQueryId: string, text?: string) {
  return telegramFetch(token, 'answerCallbackQuery', {
    callback_query_id: callbackQueryId,
    text,
  })
}

export async function createInviteLink(
  token: string,
  chatId: string | number,
  memberLimit: number = 1
) {
  const data = await telegramFetch(token, 'createChatInviteLink', {
    chat_id: chatId,
    member_limit: memberLimit,
    creates_join_request: false,
  })
  return data.result?.invite_link as string | undefined
}

export async function setWebhook(token: string, webhookUrl: string) {
  return telegramFetch(token, 'setWebhook', {
    url: webhookUrl,
    allowed_updates: ['message', 'callback_query'],
  })
}

export async function deleteWebhook(token: string) {
  return telegramFetch(token, 'deleteWebhook', {})
}

export async function getMe(token: string) {
  const res = await fetch(`${BASE(token)}/getMe`)
  return res.json()
}
