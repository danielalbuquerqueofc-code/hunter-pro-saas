# Relatorio - Funcionalidades essenciais Hunter Pro

## Diagnostico inicial

- A vitrine publica ja existia, mas o editor salvava apenas parte das configuracoes.
- A cor principal era limpa por um campo escondido, entao a pagina publica podia nao refletir o tema escolhido.
- O Google Calendar tinha tabela e leitura de disponibilidade preparada, mas nao havia OAuth real nem resolucao segura de token.
- O cron de lembretes existia, mas o envio de WhatsApp estava acoplado a um endpoint generico.
- Nao havia tela operacional para dados bancarios e Pix por empresa.
- Asaas ja possuia criacao de cliente, assinatura e webhook, mas faltava um adapter mais completo para futuras acoes do painel master.
- Havia referencias antigas ao dominio `prospectoads.com`; o dominio correto confirmado e `prospectorads.com`.

## Correcoes realizadas

### Vitrine publica e salvamento

- O editor da vitrine passou a salvar campos adicionais: nome comercial, slogan, foto de perfil, favicon, area de atendimento, horarios, formas de pagamento, textos dos botoes, cores, bordas, sombra e arredondamento.
- O editor agora salva tambem quais secoes aparecem e a ordem das secoes, por organizacao.
- O preview agora usa o mesmo resolvedor de tema da pagina publica e considera as cores escolhidas.
- O botao principal de salvar foi movido para o fim do fluxo de personalizacao.
- A acao de descartar alteracoes agora pede confirmacao.
- A pagina publica passou a respeitar nome comercial, slogan, textos de CTA, campos opcionais de contato/horario/pagamento e a ordem/visibilidade das secoes.
- Secoes ainda sem dados proprios no produto, como avaliacoes e promocoes, ficam preparadas na configuracao mas nao renderizam conteudo falso.
- O dominio de fallback da vitrine foi corrigido para `https://prospectorads.com`.

### Temas e contraste

- Foram adicionados temas reais: moderno, elegante, minimalista, escuro, claro, automotivo e profissional.
- O resolvedor de tema calcula contraste para textos e botoes.
- Foram adicionados tokens seguros para fundo, cards, borda, texto, botao, destaque, raio e sombra.

### Google Calendar

- Criado fluxo OAuth real:
  - `/api/integrations/google-calendar/connect`
  - `/api/integrations/google-calendar/callback`
- Tokens sao criptografados no servidor.
- A disponibilidade publica consulta o endpoint oficial `freeBusy` quando o calendario esta conectado.
- Ao confirmar um agendamento publico, o sistema tenta criar ou atualizar o evento no Google Calendar.
- Falhas do Google nao impedem o agendamento; o erro fica registrado no agendamento/conexao.

### WhatsApp e lembretes

- Criado adapter de WhatsApp por provider.
- Suporte a Meta Cloud API quando existirem `META_WHATSAPP_PHONE_NUMBER_ID` e `META_WHATSAPP_ACCESS_TOKEN`.
- Mantido suporte a provider HTTP com `WHATSAPP_PROVIDER_URL` e `WHATSAPP_PROVIDER_TOKEN`.
- O cron de lembretes passou a usar o adapter, mantendo idempotencia, consentimento, janela de silencio e registros de entrega.
- Sem credenciais, o sistema marca como pendente/skipped, sem simular envio.

### Pagamentos e Pix da empresa

- Criada migration para `organization_payment_settings`.
- Criada tela `/pagamentos-pix`.
- Permite salvar titular, documento, banco, agencia, conta, tipo de conta, Pix, tipo de chave, favorecido, instrucoes, sinal, prazo e regra de envio.
- Dados sensiveis sao mascarados no resumo.
- Permissao restrita a `OWNER`, `ADMIN`, `FINANCIAL` e super admin via RLS.

### Asaas

- Adapter `BillingProvider` criado sobre Asaas.
- Adicionados metodos para atualizar cliente, atualizar assinatura, cancelar, reativar, consultar assinatura, listar pagamentos, consultar pagamento e criar link de pagamento.
- O fluxo continua correto: criacao de assinatura nao significa pagamento confirmado; webhook segue como fonte de verdade.

## Migration criada

- `supabase/migrations/0018_essential_integrations_showcase_payments.sql`

## Migration aplicada no Supabase

- Aplicada no projeto `stjmgporrsnhaudzmwvf` com o nome `essential_integrations_showcase_payments_v2`.
- Validacao executada diretamente no banco confirmou as colunas principais em:
  - `showcases`
  - `organization_payment_settings`
  - `google_calendar_connections`
  - `appointments`
  - `integrations`
- A tabela `integrations` e os tipos `integration_provider` / `integration_status` foram criados de forma defensiva porque a migration antiga que os criava nao estava aplicada no banco online.

## Variaveis externas necessarias

- `NEXT_PUBLIC_APP_URL=https://prospectorads.com`
- `INTEGRATION_ENCRYPTION_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALENDAR_REDIRECT_URI=https://prospectorads.com/api/integrations/google-calendar/callback`
- `META_WHATSAPP_PHONE_NUMBER_ID`
- `META_WHATSAPP_ACCESS_TOKEN`
- `META_WHATSAPP_WEBHOOK_VERIFY_TOKEN`
- `WHATSAPP_PROVIDER_URL`
- `WHATSAPP_PROVIDER_TOKEN`
- `ASAAS_ENVIRONMENT=sandbox`
- `ASAAS_API_KEY`
- `ASAAS_WEBHOOK_TOKEN`
- `ASAAS_BASE_URL` opcional

## Credenciais pendentes

- Google Calendar so fica conectado apos configurar credenciais no Google Cloud e autorizar por OAuth.
- WhatsApp so envia automaticamente apos configurar Meta Cloud API ou provider autorizado.
- Asaas so deve ser validado em sandbox com chave real antes de cobranca comercial.

## Testes executados

- `npm.cmd run lint`: aprovado.
- `npm.cmd run typecheck`: aprovado.
- `npm.cmd test`: aprovado.
- `npm.cmd run build`: aprovado.

Observacao: os testes de Google Calendar, WhatsApp e Asaas executados nesta etapa sao verificacoes locais/mockadas de prontidao e integracao estrutural. A validacao real com APIs externas permanece pendente ate configurar credenciais validas e ambiente sandbox.

## Resultado final

- A vitrine e o salvamento foram corrigidos.
- As bases reais de Google Calendar, WhatsApp, Pix e Asaas foram implementadas sem simular conexao.
- O sistema esta pronto para receber as credenciais externas e validar os fluxos reais em sandbox/producao controlada.
