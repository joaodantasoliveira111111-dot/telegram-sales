export interface FunnelTemplate {
  id: string
  name: string
  niche: string
  description: string
  emoji: string
  messages: Record<string, string>
  plans: Array<{
    name: string
    price: number
    duration_days: number
    button_text: string
    plan_role: string
  }>
}

export const FUNNEL_TEMPLATES: FunnelTemplate[] = [
  {
    id: 'vip_group',
    name: 'Grupo VIP de Conteúdo',
    niche: 'Conteúdo Exclusivo',
    emoji: '👑',
    description: 'Funil para venda de acesso a grupo ou canal VIP com conteúdo exclusivo.',
    messages: {
      welcome: '👑 Olá! Bem-vindo(a) ao canal de conteúdo exclusivo!\n\nAqui você terá acesso a conteúdo premium que não está disponível em nenhum outro lugar.\n\nVeja os planos disponíveis:',
      payment_intro: '💳 Ótima escolha! Gere seu PIX abaixo e acesse em segundos.',
      payment_confirmed_channel: '🎉 Pagamento confirmado! Bem-vindo(a) ao grupo VIP!\n\nSeu link de acesso exclusivo:\n{link}\n\n⚠️ Este link é único — não compartilhe!\n📅 Acesso válido até: {expira}',
      subscription_expired: '⏰ Seu acesso ao grupo VIP expirou.\n\nRenove agora para continuar tendo acesso ao conteúdo exclusivo!',
    },
    plans: [
      { name: 'Acesso Semanal', price: 29.90, duration_days: 7, button_text: '📅 7 dias — R$ 29,90', plan_role: 'main' },
      { name: 'Acesso Mensal', price: 79.90, duration_days: 30, button_text: '🔥 30 dias — R$ 79,90', plan_role: 'main' },
      { name: 'Acesso Trimestral', price: 179.90, duration_days: 90, button_text: '💎 90 dias — R$ 179,90', plan_role: 'main' },
    ],
  },
  {
    id: 'online_course',
    name: 'Curso Online',
    niche: 'Infoproduto',
    emoji: '🎓',
    description: 'Funil para venda de curso online com entrega de link ou acesso à plataforma.',
    messages: {
      welcome: '🎓 Olá! Você está a um passo de transformar sua vida!\n\nNosso curso vai te ensinar do zero ao avançado com suporte completo.\n\nEscolha seu plano:',
      payment_intro: '🚀 Excelente decisão! Conclua seu pagamento via PIX:',
      payment_confirmed_link: '🎉 Parabéns! Seu acesso foi liberado!\n\n🔗 Acesse seu curso aqui:\n{link}\n\n📅 Acesso válido até: {expira}\n\nBons estudos! 🌟',
      subscription_expired: '📚 Seu acesso ao curso expirou.\n\nRenove agora para continuar aprendendo!',
    },
    plans: [
      { name: 'Acesso Mensal', price: 47.00, duration_days: 30, button_text: '📚 Mensal — R$ 47,00', plan_role: 'main' },
      { name: 'Acesso Vitalício', price: 197.00, duration_days: 36500, button_text: '💎 Vitalício — R$ 197,00', plan_role: 'main' },
    ],
  },
  {
    id: 'physical_product',
    name: 'Produto Físico',
    niche: 'E-commerce',
    emoji: '📦',
    description: 'Funil para venda de produto físico com confirmação e dados de entrega.',
    messages: {
      welcome: '📦 Olá! Conheça nossos produtos exclusivos!\n\nEntrega rápida para todo o Brasil. Confira as opções:',
      payment_intro: '💳 Ótimo! Finalize seu pedido via PIX:',
      payment_confirmed_generic: '✅ Pedido confirmado!\n\nSeu pedido foi registrado e será processado em até 24h.\n\nEm breve entraremos em contato com os dados de envio. 📮',
      subscription_expired: '🔔 Seu acesso expirou. Faça um novo pedido quando quiser!',
    },
    plans: [
      { name: 'Kit Básico', price: 97.00, duration_days: 365, button_text: '📦 Kit Básico — R$ 97,00', plan_role: 'main' },
      { name: 'Kit Premium', price: 197.00, duration_days: 365, button_text: '🔥 Kit Premium — R$ 197,00', plan_role: 'main' },
    ],
  },
  {
    id: 'subscription_community',
    name: 'Comunidade de Assinatura',
    niche: 'Comunidade',
    emoji: '🏆',
    description: 'Funil para comunidade com acesso recorrente, kick automático e renovação.',
    messages: {
      welcome: '🏆 Bem-vindo(a) à nossa comunidade exclusiva!\n\nAqui você tem acesso a:\n✅ Conteúdo diário\n✅ Suporte especializado\n✅ Networking com membros\n\nEscolha seu plano de acesso:',
      payment_intro: '🎯 Quase lá! Finalize via PIX:',
      payment_confirmed_channel: '🎉 Bem-vindo(a) à comunidade!\n\nSeu link exclusivo de acesso:\n{link}\n\n📅 Renovação em: {expira}\n\nFico feliz em ter você aqui! 🙌',
      subscription_expired: '😢 Sua assinatura expirou.\n\nSentimos sua falta! Renove agora com desconto especial e volte para a comunidade.',
    },
    plans: [
      { name: 'Mensal', price: 59.90, duration_days: 30, button_text: '📅 Mensal — R$ 59,90', plan_role: 'main' },
      { name: 'Trimestral', price: 149.90, duration_days: 90, button_text: '💰 Trimestral — R$ 149,90', plan_role: 'main' },
      { name: 'Anual', price: 497.00, duration_days: 365, button_text: '👑 Anual — R$ 497,00', plan_role: 'main' },
    ],
  },
  {
    id: 'recurring_service',
    name: 'Serviço Recorrente',
    niche: 'Serviços',
    emoji: '⚡',
    description: 'Funil para serviços mensais como consultoria, mentoria ou suporte.',
    messages: {
      welcome: '⚡ Olá! Transforme seus resultados com nosso serviço especializado!\n\nEm {plano} você terá:\n✅ Atendimento personalizado\n✅ Acompanhamento constante\n✅ Resultados garantidos\n\nInicie agora:',
      payment_intro: '✅ Excelente! Conclua o pagamento via PIX:',
      payment_confirmed_generic: '🎊 Contrato ativado!\n\nEntraremos em contato nas próximas horas para iniciar seu atendimento personalizado.\n\n📱 Aguarde nosso contato!',
      subscription_expired: '🔄 Seu serviço foi encerrado.\n\nDeseja continuar? Renove seu plano e retomamos de onde paramos!',
    },
    plans: [
      { name: 'Mentoria Mensal', price: 297.00, duration_days: 30, button_text: '🚀 Mensal — R$ 297,00', plan_role: 'main' },
      { name: 'Mentoria Trimestral', price: 797.00, duration_days: 90, button_text: '💎 Trimestral — R$ 797,00', plan_role: 'main' },
    ],
  },
]
