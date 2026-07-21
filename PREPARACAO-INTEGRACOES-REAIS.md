# Preparacao das integracoes reais - Hunter Pro

## O que foi preparado

Esta etapa preparou o Hunter Pro para conectar cobranca real via Asaas e organizou os pontos de entrada das proximas integracoes oficiais: WhatsApp e Google Calendar.

Nada foi simulado. Se uma credencial nao estiver configurada, o sistema bloqueia a acao e informa que a integracao ainda nao esta pronta.

## Asaas

### Variaveis necessarias

Configure no Vercel:

```env
BILLING_PROVIDER=asaas
ASAAS_ENVIRONMENT=sandbox
ASAAS_API_KEY=
ASAAS_WEBHOOK_TOKEN=
NEXT_PUBLIC_APP_URL=https://prospectoads.com
```

Quando for para producao:

```env
ASAAS_ENVIRONMENT=production
ASAAS_API_KEY=
```

Use chave sandbox com ambiente sandbox e chave producao com ambiente producao.

### Webhook

No painel do Asaas, configure:

```text
https://prospectoads.com/api/webhooks/asaas
```

O token configurado no Asaas precisa ser exatamente o mesmo valor de:

```env
ASAAS_WEBHOOK_TOKEN=
```

O endpoint valida o header:

```text
asaas-access-token
```

### Eventos recomendados

Ative eventos de pagamentos e assinaturas, principalmente:

- `PAYMENT_CREATED`
- `PAYMENT_CONFIRMED`
- `PAYMENT_RECEIVED`
- `PAYMENT_OVERDUE`
- `PAYMENT_DELETED`
- `PAYMENT_REFUNDED`
- `SUBSCRIPTION_CREATED`
- `SUBSCRIPTION_UPDATED`
- `SUBSCRIPTION_DELETED`
- `SUBSCRIPTION_INACTIVATED`

## WhatsApp oficial

O sistema ja possui fila de lembretes e registro de entregas. Para ativar o envio real, ainda precisamos escolher o provedor final.

Opcoes:

- Meta WhatsApp Cloud API;
- provedor oficial parceiro;
- outro provedor autorizado.

Variaveis reservadas:

```env
META_WHATSAPP_ACCESS_TOKEN=
META_WHATSAPP_PHONE_NUMBER_ID=
META_WHATSAPP_WEBHOOK_VERIFY_TOKEN=
```

Enquanto isso nao estiver configurado, o sistema nao deve prometer envio automatico ao cliente.

## Google Calendar

O sistema ja possui tabela de conexoes e estrutura para agenda por profissional, mas a sincronizacao real exige OAuth.

Variaveis reservadas:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALENDAR_REDIRECT_URI=https://prospectoads.com/api/integrations/google-calendar/callback
```

Cada empresa ou profissional precisa autorizar o Google Calendar. E-mail cadastrado nao e autorizacao.

## Banco de dados

Migration criada:

```text
supabase/migrations/0013_asaas_billing_readiness.sql
```

Ela adiciona:

- provedor de cobranca por empresa;
- identificador de cliente Asaas;
- configuracoes Asaas por plano;
- identificadores Asaas em assinaturas;
- tabela `billing_events` para idempotencia e auditoria de webhooks.

## Como testar o Asaas em sandbox

1. Criar conta em `https://sandbox.asaas.com`.
2. Gerar uma API Key sandbox.
3. Colocar a chave no Vercel como `ASAAS_API_KEY`.
4. Definir `ASAAS_ENVIRONMENT=sandbox`.
5. Criar um token forte para `ASAAS_WEBHOOK_TOKEN`.
6. Configurar o webhook no Asaas apontando para `https://prospectoads.com/api/webhooks/asaas`.
7. No Hunter Pro, acessar `Plano e assinatura`.
8. Clicar em `Assinar` em um plano ativo.
9. Validar se a cobranca abre no Asaas.
10. Simular pagamento no sandbox.
11. Conferir se o status da empresa/assinatura muda pelo webhook.

## Pendencias antes de vender como pronto

- Configurar credenciais reais no Vercel.
- Ajustar planos no Supabase com `billing_provider='ASAAS'`, valor, ciclo e tipo de cobranca.
- Criar tela superadmin completa para editar planos sem SQL.
- Escolher e conectar WhatsApp oficial.
- Criar OAuth do Google Calendar.
- Testar fluxo completo em sandbox antes de producao.
