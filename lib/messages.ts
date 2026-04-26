import { supabaseAdmin } from './supabase'

export interface MessageMeta {
  label: string
  description: string
  vars: string[]
  default: string
}

export const MESSAGE_KEYS: Record<string, MessageMeta> = {
  payment_intro: {
    label: 'Introdução ao pagamento',
    description: 'Enviada quando o usuário clica em comprar um plano',
    vars: ['{nome}', '{plano}', '{valor}'],
    default:
      `💳 Pronto… seu acesso já tá quase liberado 😈\n\n` +
      `📦 Plano: <b>{plano}</b>\n` +
      `💰 Valor: <b>{valor}</b>\n\n` +
      `⏰ Corre porque expira rápido…\n` +
      `Assim que pagar, eu libero tudo pra você na hora. 💋`,
  },
  pix_instructions: {
    label: 'Instruções do Pix Copia e Cola',
    description: 'Enviada junto com o código Pix, explicando como pagar',
    vars: [],
    default:
      `<b>Ou pague com Pix Copia e Cola:</b>\n\n` +
      `1️⃣ Abra o app do seu banco\n` +
      `2️⃣ Vá em <b>Pix → Pagar</b>\n` +
      `3️⃣ Escolha <b>Copia e Cola</b>\n` +
      `4️⃣ Cole o código abaixo e confirme\n\n` +
      `👇 <i>Toque no código para copiar:</i>`,
  },
  payment_pending: {
    label: 'Pagamento pendente',
    description: 'Quando o usuário já tem um Pix gerado aguardando pagamento',
    vars: ['{nome}', '{plano}', '{codigo}'],
    default:
      `⏳ Você já tem um pagamento pendente para este plano.\n\n` +
      `<b>Código Pix (Copia e Cola):</b>\n<code>{codigo}</code>`,
  },
  payment_confirmed_channel: {
    label: 'Pagamento confirmado — Canal do Telegram',
    description: 'Para planos com acesso a canal/grupo do Telegram',
    vars: ['{nome}', '{plano}', '{link}', '{expira}'],
    default:
      `✅ <b>Pagamento confirmado!</b>\n\n` +
      `🎉 Seu acesso ao plano <b>{plano}</b> foi liberado!\n\n` +
      `📲 Clique no link para entrar:\n{link}\n\n` +
      `⏳ Acesso válido até: <b>{expira}</b>`,
  },
  payment_confirmed_link: {
    label: 'Pagamento confirmado — Link externo',
    description: 'Para planos com link externo de acesso (curso, drive, etc)',
    vars: ['{nome}', '{plano}', '{link}', '{expira}'],
    default:
      `✅ <b>Pagamento confirmado!</b>\n\n` +
      `🎉 Seu acesso ao plano <b>{plano}</b> foi liberado!\n\n` +
      `🔗 Acesse aqui: {link}\n\n` +
      `⏳ Acesso válido até: <b>{expira}</b>`,
  },
  payment_confirmed_account: {
    label: 'Pagamento confirmado — Conta do estoque',
    description: 'Para planos com entrega automática de login e senha',
    vars: ['{nome}', '{plano}', '{login}', '{senha}', '{extra}', '{garantia}'],
    default:
      `✅ <b>Pagamento confirmado!</b>\n\n` +
      `Seu acesso foi liberado:\n\n` +
      `📧 Login: <code>{login}</code>\n` +
      `🔑 Senha: <code>{senha}</code>\n` +
      `{extra}\n\n` +
      `⚠️ <b>Importante:</b>\n` +
      `- Não altere a senha\n` +
      `- Use apenas no seu dispositivo\n` +
      `- Não compartilhe o acesso\n` +
      `{garantia}\n\n` +
      `Qualquer problema, chame o suporte.`,
  },
  payment_confirmed_generic: {
    label: 'Pagamento confirmado — Genérico',
    description: 'Confirmação genérica quando não há link ou canal configurado',
    vars: ['{nome}', '{plano}'],
    default: `✅ <b>Pagamento confirmado!</b>\n\nSeu acesso ao plano <b>{plano}</b> foi liberado!`,
  },
  stock_empty: {
    label: 'Estoque esgotado',
    description: 'Quando o pagamento é aprovado mas não há contas disponíveis',
    vars: ['{nome}', '{plano}'],
    default:
      `✅ <b>Pagamento confirmado!</b>\n\n` +
      `Seu acesso foi aprovado, mas estamos preparando sua conta.\n` +
      `O suporte vai te enviar os dados em breve. 🙏`,
  },
  payment_failed: {
    label: 'Pagamento falhou',
    description: 'Quando o pagamento é recusado ou expirado',
    vars: ['{nome}'],
    default: `❌ Seu pagamento falhou. Para tentar novamente, envie /start.`,
  },
  subscription_expired: {
    label: 'Assinatura expirada',
    description: 'Enviada automaticamente quando a assinatura vence',
    vars: ['{nome}', '{plano}'],
    default:
      `⏰ Seu acesso ao plano <b>{plano}</b> expirou!\n\n` +
      `Para renovar e continuar tendo acesso, envie /start e escolha seu plano. 🔄`,
  },
}

export function replaceVars(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    template
  )
}

// Fetch message from DB, fallback to default
export async function getBotMessage(
  botId: string,
  key: string,
  vars?: Record<string, string>
): Promise<string> {
  const { data } = await supabaseAdmin
    .from('bot_messages')
    .select('content')
    .eq('bot_id', botId)
    .eq('message_key', key)
    .single()

  const template = data?.content ?? MESSAGE_KEYS[key]?.default ?? ''
  return vars ? replaceVars(template, vars) : template
}
