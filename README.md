# Hunter Pro SaaS

Plataforma SaaS multiempresa para gestao, atendimento, agendamento, CRM, financeiro e vitrine digital para pequenos prestadores de servicos.

## Objetivo

O Hunter Pro deve permitir que cada empresa tenha uma conta isolada, usuarios proprios, dados protegidos por organizacao e uma vitrine publica acessivel por slug, como `/p/boxpremium`.

## Stack

- Next.js com App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage
- Row Level Security
- Zod
- React Hook Form
- Vercel
- Estrutura preparada para PWA

## Arquitetura

O sistema sera multi-tenant. Todas as tabelas operacionais terao `organization_id`. O frontend nunca deve ser a unica barreira de seguranca: o isolamento por empresa precisa existir no banco com RLS.

Camadas principais:

- `app/(public)`: landing page, precos, login, cadastro e vitrines publicas.
- `app/(app)`: painel interno da empresa.
- `app/admin`: area do superadministrador.
- `components`: componentes reutilizaveis.
- `features`: modulos de negocio por dominio.
- `lib`: Supabase, permissoes, validacoes e utilitarios.
- `supabase/migrations`: estrutura do banco e politicas RLS.

## Fase 1

Implementar somente:

1. Configuracao do projeto.
2. Estrutura de pastas.
3. Configuracao do Supabase.
4. Autenticacao.
5. Cadastro de empresa.
6. Estrutura multi-tenant.
7. Perfis e permissoes.
8. Layout do painel.
9. Dashboard inicial.
10. Banco de dados e politicas RLS da fase.

## Fase 2

Implementado:

1. Vitrine publica por slug.
2. Configuracao da vitrine no painel.
3. Links rapidos da vitrine.
4. Cadastro de categorias de servicos.
5. Cadastro de servicos.
6. Cadastro de profissionais.
7. Regras basicas de disponibilidade.
8. Solicitacao publica de agendamento.
9. Listagem interna de agendamentos recebidos.
10. Banco de dados e politicas RLS da fase.

## Fase 3

Implementado:

1. CRM privado por empresa.
2. Cadastro de leads e contatos.
3. Registro de consentimento LGPD do lead.
4. Tags de contato no banco.
5. Pipeline comercial.
6. Etapas do pipeline.
7. Oportunidades comerciais.
8. Atividades comerciais.
9. Tela interna de CRM.
10. Banco de dados e politicas RLS da fase.

## Fase 4

Implementado:

1. Categorias financeiras.
2. Lancamentos de receitas e despesas.
3. Status financeiro.
4. Metodos de pagamento.
5. Tela interna de financeiro.
6. Relatorios financeiros calculados no servidor.
7. Banco de dados e politicas RLS da fase.

## Fase 5

Implementado:

1. Atendimento por conversa.
2. Mensagens em rascunho para canais como WhatsApp, e-mail e Instagram.
3. Tarefas operacionais.
4. Automacoes estruturadas.
5. Integracoes preparadas com `secret_ref`, sem segredo em texto aberto.
6. Notificacoes internas.
7. Banco de dados e politicas RLS da fase.

## Fase 6

Implementado:

1. Agentes de IA SDR.
2. Objetivos e guardrails dos agentes.
3. Historico estrutural de execucoes.
4. Eventos de integracao.
5. Tela interna de IA.
6. Banco de dados e politicas RLS da fase.

Observacao: chamadas reais para WhatsApp, pagamentos e IA dependem de provedores externos, credenciais, custos e configuracao segura no servidor.

## Fase 7 - Painel operacional

Implementado nesta etapa:

1. Shell principal do painel com topbar, busca global, seletor de empresa, notificacoes, ajuda, vitrine e menu mobile.
2. Navegacao preparada por perfil visual.
3. Dashboard operacional modular com metricas, acoes rapidas, calendario, agenda de hoje, vendas, financeiro, funil, atividades, tarefas e checklist.
4. Onboarding inicial visual com etapas e persistencia temporaria no navegador.
5. Rotas privadas estruturais para leads, pipeline, clientes, conversas, orcamentos, vendas, avaliacoes, IA SDR e usuarios, ocultas do menu enquanto nao tiverem fluxo completo.
6. Rotas publicas estruturais para agendamento, orcamento e avaliacao.
7. Dashboard de producao conectado a dados reais do Supabase; dados demonstrativos nao aparecem como numeros reais.
8. Migration `0007_panel_onboarding_settings.sql` para onboarding, configuracoes da organizacao e campos adicionais.

Ainda nao implementado nesta fase:

- Envio real de WhatsApp.
- IA SDR real.
- Pagamentos recorrentes.
- Financeiro avancado.
- Agenda completa.
- Automacoes reais.
- Integracoes externas.

## Controle de acesso comercial

Implementado:

1. Empresas novas entram com teste gratis de 5 dias.
2. Empresas existentes foram preservadas como ativas para nao bloquear clientes atuais.
3. O painel privado verifica no servidor se a empresa pode usar o sistema.
4. Quando o teste expira, a empresa e enviada para `/acesso-bloqueado`.
5. O superadministrador possui painel em `/admin` para ativar, bloquear, liberar, estender teste por mais 5 dias, encerrar teste ou cancelar empresa.
6. Acoes administrativas geram registros em `audit_logs` e notificacoes internas.

Regras atuais:

- `trial`: usa o sistema ate `trial_ends_at`.
- `active`: usa normalmente.
- `trial_expired`: nao acessa o painel.
- `blocked`: nao acessa o painel.
- `suspended`: nao acessa o painel.
- `cancelled`: nao acessa o painel.

Migration relacionada:

- `0009_access_trial_admin_controls.sql`

## Modelo inicial do banco

Tabelas da fase 1:

- `organizations`
- `profiles`
- `organization_members`
- `plans`
- `subscriptions`
- `audit_logs`

Tabelas previstas nas fases seguintes:

- Provedores reais de pagamento.
- Webhooks reais de WhatsApp.
- Execucao real de IA no servidor.
- Exportacoes e dashboards avancados.

Tabelas e complementos da fase 7:

- `onboarding_progress`
- `organization_settings`
- campos publicos adicionais em `organizations`
- campos auxiliares em `notifications` e `audit_logs`

Complementos de acesso comercial:

- `organizations.access_status`
- `organizations.trial_started_at`
- `organizations.trial_ends_at`
- `organizations.activated_at`
- `organizations.blocked_at`
- `organizations.blocked_by`
- `organizations.blocked_reason`
- `organizations.admin_notes`

## Variaveis de ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
```

Chaves secretas nunca devem ser expostas no frontend.

## Comandos esperados

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm test
```

No Windows, use:

```powershell
npm.cmd run dev
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

## Deploy

O deploy final sera feito na Vercel. O banco, autenticacao e storage ficarao no Supabase.
