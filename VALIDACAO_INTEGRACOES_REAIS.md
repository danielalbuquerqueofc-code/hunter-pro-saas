# Validacao real das funcionalidades essenciais

Data: 2026-08-10
Branch: `fix/audit-critical-high`
Dominio oficial: `https://prospectorads.com`
Projeto Supabase: `stjmgporrsnhaudzmwvf`

## Classificacao atual

APROVADO para deploy tecnico.

As funcionalidades estruturais foram implementadas, a migration foi aplicada no Supabase real e as validacoes locais passaram. As integracoes externas ainda dependem de credenciais reais e testes com provedores oficiais.

## Banco de dados

- Migration aplicada no Supabase com o nome `essential_integrations_showcase_payments_v2`.
- Validacao direta confirmou campos principais em:
  - `showcases`
  - `organization_payment_settings`
  - `google_calendar_connections`
  - `appointments`
  - `integrations`
- A tabela `integrations` foi criada defensivamente porque a migration antiga local que a criava nao estava aplicada no banco online.

## Vercel

Variaveis preparadas/solicitadas para o ambiente online:

- `NEXT_PUBLIC_APP_URL=https://prospectorads.com`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `INTEGRATION_ENCRYPTION_KEY`
- `GOOGLE_CALENDAR_REDIRECT_URI=https://prospectorads.com/api/integrations/google-calendar/callback`
- `ASAAS_ENVIRONMENT=sandbox`

Pendentes por dependerem de credenciais externas reais:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `META_WHATSAPP_PHONE_NUMBER_ID`
- `META_WHATSAPP_ACCESS_TOKEN`
- `META_WHATSAPP_WEBHOOK_VERIFY_TOKEN`
- `WHATSAPP_PROVIDER_URL`
- `WHATSAPP_PROVIDER_TOKEN`
- `ASAAS_API_KEY`
- `ASAAS_WEBHOOK_TOKEN`
- `ASAAS_BASE_URL`, se o ambiente escolhido exigir URL customizada.

## Vitrine

- O editor salva configuracoes ampliadas por empresa.
- A vitrine publica usa nome comercial, slogan, cores, CTAs, visibilidade e campos opcionais.
- O dominio de fallback foi corrigido para `https://prospectorads.com`.

## Google Calendar

- OAuth real implementado.
- Tokens sao criptografados no servidor.
- A disponibilidade consulta `freeBusy` quando a conexao Google esta ativa.
- A criacao/atualizacao de evento ocorre apos confirmacao do agendamento.

Pendente: configurar credenciais reais no Google Cloud e autorizar uma conta.

## WhatsApp

- Adapter real criado para Meta Cloud API ou provider HTTP autorizado.
- Cron de lembretes usa o adapter com idempotencia, consentimento e janela de silencio.
- Sem credenciais, o sistema nao simula envio.

Pendente: configurar Meta Cloud API ou provider oficial.

## Pix e dados bancarios

- Tela `/pagamentos-pix` criada.
- Salvamento restrito a `OWNER`, `ADMIN`, `FINANCIAL` e super admin.
- Documento, conta e Pix sao armazenados criptografados em novos salvamentos.
- RLS criada na tabela `organization_payment_settings`.

## Asaas

- Adapter ampliado para cliente, assinatura, cancelamento, reativacao, consulta, pagamentos e link de pagamento.
- Webhook continua como fonte de verdade para status financeiro.

Pendente: configurar chave sandbox/producao e webhook real.

## Validacoes executadas

- `npm.cmd run lint`: aprovado.
- `npm.cmd run typecheck`: aprovado.
- `npm.cmd test`: aprovado.
- `npm.cmd run build`: aprovado.
- `npm.cmd audit --audit-level=moderate`: aprovado, 0 vulnerabilidades.

## Atualizacao de dependencias

- `npm audit fix` aplicado em 2026-08-10.
- Next.js atualizado para `16.3.0`.
- Dependencias transitivas vulneraveis corrigidas:
  - `postcss`
  - `nanoid`
  - `js-yaml`
  - `sharp`

## Pendencias antes de piloto comercial

1. Configurar credenciais reais de Google Cloud OAuth.
2. Configurar provedor real de WhatsApp.
3. Configurar Asaas sandbox e depois producao.
4. Executar testes reais de OAuth, envio WhatsApp e webhook Asaas.
5. Criar ambiente Supabase exclusivo de teste para validar RLS real sem risco ao banco principal.
