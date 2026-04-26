export type MediaType = 'image' | 'video' | null
export type ContentType = 'link' | 'telegram_channel'
export type PaymentStatus = 'pending' | 'paid' | 'canceled' | 'refunded' | 'chargeback'
export type SubscriptionStatus = 'active' | 'expired' | 'canceled'
export type PlanRole = 'main' | 'upsell' | 'downsell'

export interface Bot {
  id: string
  name: string
  telegram_token: string
  welcome_message: string
  welcome_media_url: string | null
  welcome_media_type: MediaType
  is_active: boolean
  created_at: string
}

export interface Plan {
  id: string
  bot_id: string
  name: string
  price: number
  duration_days: number
  button_text: string
  content_type: ContentType
  content_url: string | null
  telegram_chat_id: string | null
  plan_role: PlanRole
  created_at: string
}

export interface TelegramUser {
  id: string
  bot_id: string
  telegram_id: string
  username: string | null
  first_name: string | null
  created_at: string
}

export interface Payment {
  id: string
  bot_id: string
  plan_id: string
  telegram_id: string
  transaction_id: string | null
  status: PaymentStatus
  pix_code: string | null
  qr_code: string | null
  created_at: string
  plan?: Plan
  bot?: Bot
}

export interface Subscription {
  id: string
  bot_id: string
  plan_id: string
  telegram_id: string
  expires_at: string
  status: SubscriptionStatus
  created_at: string
  plan?: Plan
  bot?: Bot
}

export interface WebhookLog {
  id: string
  payload: Record<string, unknown>
  created_at: string
}

// Telegram API types
export interface TelegramUpdate {
  update_id: number
  message?: TelegramMessage
  callback_query?: TelegramCallbackQuery
}

export interface TelegramMessage {
  message_id: number
  from: TelegramFrom
  chat: TelegramChat
  text?: string
  date: number
}

export interface TelegramFrom {
  id: number
  is_bot: boolean
  first_name: string
  username?: string
  language_code?: string
}

export interface TelegramChat {
  id: number
  type: string
  first_name?: string
  username?: string
}

export interface TelegramCallbackQuery {
  id: string
  from: TelegramFrom
  message?: TelegramMessage
  data?: string
}

export interface TelegramInlineKeyboardButton {
  text: string
  callback_data?: string
  url?: string
}

// AmploPay types
export interface AmplopayCreatePixRequest {
  external_id: string
  amount: number
  description: string
  customer: {
    name: string
    email?: string
    document?: string
  }
  webhook_url?: string
}

export interface AmplopayCreatePixResponse {
  id: string
  status: string
  pix_code: string
  qr_code: string
  amount: number
  expires_at: string
}

export interface AmplopayWebhookPayload {
  event: 'TRANSACTION_PAID' | 'TRANSACTION_CANCELED' | 'TRANSACTION_REFUNDED' | 'TRANSACTION_CHARGED_BACK'
  transaction: {
    id: string
    external_id: string
    status: string
    amount: number
    paid_at?: string
  }
}

// Dashboard form types
export interface CreateBotForm {
  name: string
  telegram_token: string
  welcome_message: string
  welcome_media_url?: string
  welcome_media_type?: MediaType
}

export interface CreatePlanForm {
  bot_id: string
  name: string
  price: number
  duration_days: number
  button_text: string
  content_type: ContentType
  content_url?: string
  telegram_chat_id?: string
  plan_role: PlanRole
}
