export interface FunnelTemplate {
  id: string
  name: string
  niche: string
  description: string
  emoji: string
  bot_type: 'channel_link' | 'account_stock'
  flow_type: 'direct' | 'presentation' | 'consultive'
  protect_content: boolean
  messages: Record<string, string>
  plans: Array<{
    name: string
    price: number
    duration_days: number
    button_text: string
    plan_role: string
    kick_on_expire?: boolean
    renewal_discount_pct?: number
  }>
  tips: string[]
}

export const FUNNEL_TEMPLATES: FunnelTemplate[] = [
  {
    id: 'nicho_hot',
    name: 'Nicho Hot',
    niche: 'Conteúdo Adulto',
    emoji: '🔥',
    bot_type: 'channel_link',
    flow_type: 'presentation',
    protect_content: true,
    description: 'Funil para venda de acesso a conteúdo exclusivo adulto. Alta conversão com copy direto e planos escalonados.',
    tips: [
      'Ative "Anti-fraude" para bloquear encaminhamento do conteúdo',
      'Use o fluxo Apresentação para gerar curiosidade antes do preço',
      'O plano mensal converte melhor que o semanal neste nicho',
    ],
    messages: {
      welcome: '🔥 Oi, tudo bem?\n\nVocê chegou no lugar certo. Aqui você tem acesso ao conteúdo mais exclusivo que você vai encontrar no Telegram.\n\n🔒 Conteúdo 100% privado — nada vaza daqui\n📲 Acesso imediato após o pagamento\n🎁 Novidades toda semana\n\nVeja os planos abaixo 👇',
      how_it_works: '👀 Como funciona?\n\nApós o pagamento você recebe um link exclusivo para entrar no canal privado.\n\n✅ Acesso imediato\n✅ Conteúdo novo toda semana\n✅ Suporte direto\n✅ 100% seguro e privado\n\nPronto para entrar? 🔥',
      payment_intro: '💳 Ótimo! Gere seu PIX abaixo e entre agora:\n\n⚡ Aprovação em segundos!',
      payment_confirmed_channel: '🎉 Pagamento confirmado!\n\nBem-vindo(a) ao canal exclusivo!\n\n🔗 Seu link de acesso:\n{link}\n\n⚠️ Link único — não compartilhe\n📅 Acesso válido até: {expira}\n\n🔥 Aproveite!',
      subscription_expired: '😔 Seu acesso expirou.\n\nSentei sua falta! Renove agora com desconto especial e volte para o conteúdo exclusivo 🔥',
      payment_failed: '❌ Pagamento não confirmado.\n\nTente novamente ou entre em contato conosco.',
    },
    plans: [
      { name: 'Acesso Semanal', price: 24.90, duration_days: 7, button_text: '🔥 7 dias — R$ 24,90', plan_role: 'main', kick_on_expire: true, renewal_discount_pct: 10 },
      { name: 'Acesso Mensal', price: 59.90, duration_days: 30, button_text: '💎 30 dias — R$ 59,90', plan_role: 'main', kick_on_expire: true, renewal_discount_pct: 15 },
      { name: 'Acesso Trimestral', price: 139.90, duration_days: 90, button_text: '👑 90 dias — R$ 139,90', plan_role: 'main', kick_on_expire: true, renewal_discount_pct: 20 },
    ],
  },
  {
    id: 'vip_group',
    name: 'Grupo VIP',
    niche: 'Conteúdo Exclusivo',
    emoji: '👑',
    bot_type: 'channel_link',
    flow_type: 'presentation',
    protect_content: true,
    description: 'Funil para venda de acesso a grupo ou canal VIP com conteúdo exclusivo de qualquer nicho.',
    tips: [
      'Funciona para qualquer nicho: finanças, games, culinária, lifestyle',
      'Ative kick automático para forçar renovação',
      'Ofereça desconto de renovação para reduzir churn',
    ],
    messages: {
      welcome: '👑 Olá! Bem-vindo(a) ao canal exclusivo!\n\nAqui você tem acesso a conteúdo premium que não está disponível em nenhum outro lugar.\n\n✅ Conteúdo diário\n✅ Acesso imediato\n✅ Suporte exclusivo\n\nVeja os planos 👇',
      how_it_works: '📱 Como funciona?\n\nApós o pagamento você recebe um link único para entrar no canal VIP.\n\n✅ Entrada imediata\n✅ Conteúdo novo toda semana\n✅ Grupo fechado e privado',
      payment_intro: '💳 Quase lá! Gere seu PIX:',
      payment_confirmed_channel: '🎉 Bem-vindo(a) ao VIP!\n\nSeu link exclusivo:\n{link}\n\n⚠️ Não compartilhe este link\n📅 Acesso até: {expira}',
      subscription_expired: '⏰ Seu acesso expirou.\n\nRenove agora para continuar!',
      payment_failed: '❌ Pagamento não confirmado. Tente novamente.',
    },
    plans: [
      { name: 'Acesso Semanal', price: 29.90, duration_days: 7, button_text: '📅 7 dias — R$ 29,90', plan_role: 'main', kick_on_expire: true },
      { name: 'Acesso Mensal', price: 79.90, duration_days: 30, button_text: '🔥 30 dias — R$ 79,90', plan_role: 'main', kick_on_expire: true, renewal_discount_pct: 15 },
      { name: 'Acesso Trimestral', price: 179.90, duration_days: 90, button_text: '💎 90 dias — R$ 179,90', plan_role: 'main', kick_on_expire: true, renewal_discount_pct: 20 },
    ],
  },
  {
    id: 'account_streaming',
    name: 'Contas Streaming',
    niche: 'Venda de Contas',
    emoji: '📺',
    bot_type: 'account_stock',
    flow_type: 'direct',
    protect_content: false,
    description: 'Venda de contas de streaming (Netflix, Disney+, Spotify, etc.) com entrega automática do estoque.',
    tips: [
      'Importe as contas em lote pelo painel de Estoque',
      'Configure garantia de funcionamento por dias',
      'O fluxo Direto converte melhor para contas — sem enrolação',
    ],
    messages: {
      welcome: '📺 Olá! Bem-vindo(a)!\n\nContas premium com entrega automática e garantia de funcionamento.\n\n✅ Entrega imediata\n✅ Garantia inclusa\n✅ Suporte pós-venda\n\nEscolha sua conta 👇',
      payment_intro: '💳 Perfeito! Gere seu PIX e receba os dados na hora:',
      payment_confirmed_account: '✅ Pagamento confirmado!\n\n📋 Seus dados de acesso:\n\n🔑 Login: <code>{login}</code>\n🔐 Senha: <code>{senha}</code>\n{extra}\n\n{garantia}\n\n⚠️ Não compartilhe estes dados!',
      stock_empty: '😔 Ops! Sem estoque disponível no momento.\n\nEntraremos em contato assim que disponível.',
      payment_failed: '❌ Pagamento não confirmado. Tente novamente.',
      subscription_expired: '🔄 Seu plano expirou. Renove para continuar.',
    },
    plans: [
      { name: 'Netflix 30 dias', price: 19.90, duration_days: 30, button_text: '📺 Netflix — R$ 19,90', plan_role: 'main' },
      { name: 'Spotify 30 dias', price: 14.90, duration_days: 30, button_text: '🎵 Spotify — R$ 14,90', plan_role: 'main' },
      { name: 'Disney+ 30 dias', price: 17.90, duration_days: 30, button_text: '🎬 Disney+ — R$ 17,90', plan_role: 'main' },
    ],
  },
  {
    id: 'account_software',
    name: 'Contas de Software/App',
    niche: 'Venda de Contas',
    emoji: '💻',
    bot_type: 'account_stock',
    flow_type: 'presentation',
    protect_content: false,
    description: 'Venda de acessos premium a softwares, ferramentas ou apps com entrega automática.',
    tips: [
      'Use o fluxo Apresentação para explicar os benefícios antes do preço',
      'Configure múltiplos planos com períodos diferentes',
      'Importe contas em lote pelo painel de Estoque',
    ],
    messages: {
      welcome: '💻 Olá! Aqui você compra acesso premium ao software com entrega automática.\n\n✅ Ativação imediata\n✅ Suporte incluso\n✅ Garantia de funcionamento\n\nConheça os planos 👇',
      how_it_works: '🔧 Como funciona?\n\nApós o pagamento você recebe as credenciais de acesso automaticamente.\n\n✅ Login e senha entregues na hora\n✅ Suporte para ativação\n✅ Garantia de 30 dias',
      payment_intro: '💳 Ótimo! Gere seu PIX:',
      payment_confirmed_account: '✅ Acesso liberado!\n\n🔑 Login: <code>{login}</code>\n🔐 Senha: <code>{senha}</code>\n{extra}\n\n{garantia}',
      stock_empty: '😔 Sem estoque disponível. Avise-me quando chegar!',
      payment_failed: '❌ Pagamento não confirmado. Tente novamente.',
      subscription_expired: '🔄 Seu acesso expirou. Renove agora!',
    },
    plans: [
      { name: 'Plano Mensal', price: 29.90, duration_days: 30, button_text: '💻 Mensal — R$ 29,90', plan_role: 'main' },
      { name: 'Plano Trimestral', price: 69.90, duration_days: 90, button_text: '🔥 Trimestral — R$ 69,90', plan_role: 'main' },
    ],
  },
  {
    id: 'online_course',
    name: 'Curso Online',
    niche: 'Infoproduto',
    emoji: '🎓',
    bot_type: 'channel_link',
    flow_type: 'consultive',
    protect_content: false,
    description: 'Funil consultivo para venda de cursos — entende o perfil do aluno antes de apresentar o produto.',
    tips: [
      'O fluxo Consultivo aumenta a conversão ao personalizar a abordagem',
      'Use links de acesso à plataforma do curso como content_url',
      'Ofereça upsell para turma ao vivo ou mentoria individual',
    ],
    messages: {
      welcome: '🎓 Olá! Você está a um passo de transformar sua carreira!\n\nMe conta: qual é seu maior objetivo hoje?\n\n👇 Clique abaixo para começar:',
      how_it_works: '📚 Como funciona o curso?\n\n✅ Acesso imediato após o pagamento\n✅ Aulas gravadas no seu ritmo\n✅ Suporte da comunidade\n✅ Certificado de conclusão\n✅ Acesso vitalício ao conteúdo',
      payment_intro: '🚀 Decisão excelente! Conclua via PIX:',
      payment_confirmed_link: '🎉 Parabéns! Acesso liberado!\n\n🔗 Entre na plataforma:\n{link}\n\n📅 Acesso válido até: {expira}\n\nBons estudos! 🌟',
      subscription_expired: '📚 Seu acesso expirou. Renove e continue aprendendo!',
      payment_failed: '❌ Pagamento não confirmado. Tente novamente.',
    },
    plans: [
      { name: 'Acesso Mensal', price: 47.00, duration_days: 30, button_text: '📚 Mensal — R$ 47,00', plan_role: 'main' },
      { name: 'Acesso Anual', price: 297.00, duration_days: 365, button_text: '🔥 Anual — R$ 297,00', plan_role: 'main' },
      { name: 'Acesso Vitalício', price: 497.00, duration_days: 36500, button_text: '💎 Vitalício — R$ 497,00', plan_role: 'main' },
    ],
  },
  {
    id: 'subscription_community',
    name: 'Comunidade de Assinatura',
    niche: 'Comunidade',
    emoji: '🏆',
    bot_type: 'channel_link',
    flow_type: 'presentation',
    protect_content: false,
    description: 'Funil para comunidade recorrente com kick automático e renovação.',
    tips: [
      'Ative kick automático e aviso de renovação para reduzir churn',
      'O aviso 3 dias antes converte bem com desconto de 10-20%',
      'Inclua depoimentos na mensagem de boas-vindas',
    ],
    messages: {
      welcome: '🏆 Bem-vindo(a) à comunidade!\n\n✅ Conteúdo exclusivo diário\n✅ Suporte especializado\n✅ Networking com membros\n✅ Lives e eventos ao vivo\n\nEscolha seu plano 👇',
      how_it_works: '🤝 O que você vai receber?\n\nAcesso completo ao grupo VIP com:\n\n📚 Conteúdo novo toda semana\n🎯 Estratégias exclusivas\n💬 Chat direto com especialistas\n🎁 Materiais e recursos bônus',
      payment_intro: '🎯 Quase lá! Finalize via PIX:',
      payment_confirmed_channel: '🎉 Bem-vindo(a) à família!\n\nSeu link de acesso:\n{link}\n\n📅 Renovação em: {expira}\n\nFico feliz em ter você aqui! 🙌',
      subscription_expired: '😢 Sua assinatura expirou.\n\nRenove agora com desconto especial e volte para a comunidade!',
      payment_failed: '❌ Pagamento não confirmado. Tente novamente.',
    },
    plans: [
      { name: 'Mensal', price: 59.90, duration_days: 30, button_text: '📅 Mensal — R$ 59,90', plan_role: 'main', kick_on_expire: true, renewal_discount_pct: 10 },
      { name: 'Trimestral', price: 149.90, duration_days: 90, button_text: '💰 Trimestral — R$ 149,90', plan_role: 'main', kick_on_expire: true, renewal_discount_pct: 15 },
      { name: 'Anual', price: 497.00, duration_days: 365, button_text: '👑 Anual — R$ 497,00', plan_role: 'main', kick_on_expire: true, renewal_discount_pct: 20 },
    ],
  },
  {
    id: 'recurring_service',
    name: 'Mentoria / Serviço',
    niche: 'Serviços',
    emoji: '⚡',
    bot_type: 'channel_link',
    flow_type: 'consultive',
    protect_content: false,
    description: 'Funil consultivo para mentorias, consultorias e serviços recorrentes.',
    tips: [
      'O fluxo Consultivo qualifica o lead antes de apresentar o preço',
      'Configure downsell com plano mais barato para quem não fechar',
      'Use a mensagem de boas-vindas para confirmar o próximo passo',
    ],
    messages: {
      welcome: '⚡ Olá! Que bom ter você aqui.\n\nPara te ajudar da melhor forma, me conta uma coisa: qual é seu maior desafio agora?\n\n👇 Clique abaixo:',
      how_it_works: '🎯 Como funciona a mentoria?\n\n✅ Sessões ao vivo individuais\n✅ Acompanhamento semanal\n✅ Grupo exclusivo de alunos\n✅ Material de apoio incluso\n✅ Suporte por WhatsApp/Telegram',
      payment_intro: '✅ Perfeito! Conclua seu pagamento:',
      payment_confirmed_generic: '🎊 Parabéns! Sua vaga está garantida!\n\nEntraremos em contato em até 2h para agendar sua primeira sessão.\n\n📱 Fique atento ao Telegram!',
      subscription_expired: '🔄 Sua mentoria foi encerrada.\n\nDeseja continuar? Renove agora!',
      payment_failed: '❌ Pagamento não confirmado. Tente novamente.',
    },
    plans: [
      { name: 'Mentoria Mensal', price: 297.00, duration_days: 30, button_text: '🚀 Mensal — R$ 297,00', plan_role: 'main' },
      { name: 'Mentoria Trimestral', price: 797.00, duration_days: 90, button_text: '💎 Trimestral — R$ 797,00', plan_role: 'main' },
    ],
  },
]
