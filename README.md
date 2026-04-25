# TelegramSales

Sistema MVP para automatizar vendas de conteúdo exclusivo via Telegram com pagamento Pix usando AmploPay.

## Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **TailwindCSS**
- **Supabase** (Postgres)
- **Vercel** (deploy + cron jobs)
- **Telegram Bot API**
- **AmploPay** (Pix)

---

## Como rodar localmente

```bash
# 1. Instale as dependências
npm install

# 2. Copie o arquivo de variáveis de ambiente
cp .env.example .env.local

# 3. Preencha as variáveis em .env.local

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse: http://localhost:3000

---

## Configurar Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Vá em **SQL Editor** e execute o arquivo `supabase/schema.sql`
3. Copie as credenciais em **Project Settings > API**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

---

## Criar Bot no Telegram

1. Abra o Telegram e fale com [@BotFather](https://t.me/BotFather)
2. Envie `/newbot`
3. Escolha um nome e username para o bot
4. Copie o **token** gerado
5. No painel, vá em **Bots > Novo Bot** e cole o token

O webhook é configurado automaticamente ao cadastrar o bot (requer `NEXT_PUBLIC_BASE_URL` configurado).

### Configurar webhook manualmente (se necessário)

```bash
curl -X POST "https://api.telegram.org/bot{SEU_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://seu-projeto.vercel.app/api/telegram/{BOT_ID}"}'
```

---

## Configurar Canal/Grupo Telegram

Para planos do tipo **Canal Telegram**:

1. Crie o canal/grupo no Telegram
2. Adicione o bot como **administrador** com permissão de **convidar usuários**
3. Descubra o ID do canal usando [@userinfobot](https://t.me/userinfobot)
4. O ID de canais privados começa com `-100` (ex: `-1001234567890`)
5. Use esse ID no campo **ID do Canal** ao criar o plano

---

## Configurar AmploPay

1. Crie uma conta em [amplopay.com.br](https://amplopay.com.br)
2. Gere uma **API Key** nas configurações
3. Configure um **token de webhook** para validação de segurança
4. Adicione as variáveis no `.env.local`:
   ```
   AMPLOPAY_API_KEY=sua_api_key
   AMPLOPAY_WEBHOOK_TOKEN=seu_token_secreto
   ```

### URL do Webhook AmploPay

Configure no painel da AmploPay:
```
https://seu-projeto.vercel.app/api/amplopay/webhook
```

Ou envie o token via query string:
```
https://seu-projeto.vercel.app/api/amplopay/webhook?token=seu_token_secreto
```

---

## Deploy na Vercel

```bash
# 1. Instale a CLI da Vercel
npm i -g vercel

# 2. Faça deploy
vercel

# 3. Configure as variáveis de ambiente no painel da Vercel
```

### Variáveis necessárias na Vercel

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key do Supabase |
| `AMPLOPAY_API_KEY` | API Key da AmploPay |
| `AMPLOPAY_WEBHOOK_TOKEN` | Token para validar webhooks |
| `NEXT_PUBLIC_BASE_URL` | URL do deploy (ex: `https://meu-projeto.vercel.app`) |
| `CRON_SECRET` | Token para proteger o cron job |

### Cron Job

O `vercel.json` configura o cron para rodar diariamente às 3h:
```json
{
  "crons": [{ "path": "/api/cron/check-expirations", "schedule": "0 3 * * *" }]
}
```

Requer **plano Pro** da Vercel para crons. No free tier, chame manualmente:
```bash
curl -H "Authorization: Bearer SEU_CRON_SECRET" \
  https://seu-projeto.vercel.app/api/cron/check-expirations
```

---

## Testar pagamento

1. Configure o bot no Telegram e inicie uma conversa com `/start`
2. Clique em um plano
3. Use o código Pix gerado para pagar
4. Após confirmação, o bot envia o acesso automaticamente

---

## Estrutura do projeto

```
/app
  /dashboard               # Painel principal (stats)
  /dashboard/bots          # Gerenciar bots
  /dashboard/plans         # Gerenciar planos
  /dashboard/payments      # Ver pagamentos
  /dashboard/subscriptions # Ver assinaturas

/app/api
  /telegram/[botId]        # Webhook do Telegram (por bot)
  /amplopay/webhook        # Webhook da AmploPay
  /cron/check-expirations  # Cron de expiração
  /bots                    # CRUD de bots
  /plans                   # CRUD de planos
  /payments                # Listagem de pagamentos
  /subscriptions           # Listagem de assinaturas

/lib
  supabase.ts              # Cliente Supabase
  telegram.ts              # Funções Telegram Bot API
  amplopay.ts              # Funções AmploPay
  utils.ts                 # Utilitários

/types
  index.ts                 # Tipos TypeScript

/supabase
  schema.sql               # Schema do banco de dados
```

---

## Fluxo completo

```
Usuário envia /start no Telegram
  → Bot salva usuário no DB
  → Envia mensagem + mídia de boas-vindas
  → Exibe botões com os planos

Usuário clica em um plano
  → Bot cria pagamento no DB (status: pending)
  → Chama AmploPay para gerar Pix
  → Salva QR code e código Pix
  → Envia código Pix para o usuário

Usuário paga
  → AmploPay chama /api/amplopay/webhook
  → Sistema valida o token de segurança
  → Atualiza pagamento (status: paid)
  → Cria assinatura com data de expiração
  → Gera invite link (se canal Telegram) ou envia URL
  → Envia mensagem de confirmação ao usuário

Diariamente às 3h
  → Cron expira assinaturas vencidas
  → Notifica usuários expirados com /start
```
