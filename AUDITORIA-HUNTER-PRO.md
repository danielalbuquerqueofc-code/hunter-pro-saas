# Auditoria Hunter Pro

Data da auditoria: 20/07/2026

## Resumo executivo

O Hunter Pro ja possui uma base SaaS funcional em Next.js, Supabase e Vercel: login, cadastro, organizacoes, membros, dashboard, vitrine, agenda, CRM, financeiro simples, atendimento, automacoes estruturais, IA estrutural e rotas publicas. A auditoria confirmou que a separacao por empresa esta presente no banco por `organization_id` e que as rotas privadas principais usam guard server-side por perfil.

O principal ponto que ainda faltava para operar como SaaS vendavel era o controle comercial de acesso: teste gratis de 5 dias, expiracao, bloqueio, reativacao, cancelamento, tela de bloqueio e painel de superadministrador. Essa camada foi implementada sem apagar dados e sem alterar migrations antigas.

## Arquitetura atual

- Frontend e backend de aplicacao: Next.js App Router.
- Autenticacao: Supabase Auth.
- Banco: Supabase PostgreSQL.
- Storage: Supabase Storage para assets da vitrine.
- Hospedagem: Vercel.
- Rotas publicas: landing, login, cadastro, precos, vitrine publica, agendamento publico, orcamento publico e avaliacao publica.
- Rotas privadas: dashboard, agenda, clientes, CRM, vitrine, servicos, financeiro, relatorios, tarefas, automacoes, atendimento, IA e usuarios.
- Painel global: `/admin`, protegido por `profiles.is_super_admin`.

## Status das fases

Concluido ou estruturalmente pronto:

- Base SaaS, auth, empresas, usuarios, permissoes e dashboard.
- Vitrine publica `/p/[slug]`.
- Servicos, profissionais e agenda estrutural.
- CRM, leads e pipeline estrutural.
- Financeiro simples e relatorios estruturais.
- WhatsApp e automacoes em estrutura, sem envio real.
- IA SDR em estrutura, sem chamada real a modelo/provedor.
- Layout mobile-first/premium e vitrine personalizavel com upload de imagens.

Ainda pendente para producao comercial completa:

- Pagamento real e webhooks de assinatura.
- Cron ou job agendado para rodar expiracao automatica diariamente.
- Integracao oficial com Meta/Facebook/Instagram/WhatsApp.
- IA real com provedor, custo, limites e logs de prompt/resposta.
- Testes automatizados de fluxo real com navegador e banco de homologacao.
- Politica de privacidade, termos de uso e telas LGPD finais.

## Problemas encontrados

1. O login estava protegido, mas a empresa nao tinha uma trava comercial central.
2. Empresas novas nao tinham garantia tecnica de teste gratis de exatamente 5 dias.
3. O painel `/admin` existia apenas como placeholder.
4. Nao havia tela clara para usuario bloqueado, expirado ou cancelado.
5. A documentacao nao descrevia os estados de acesso comercial.
6. Os testes locais nao verificavam se trial/bloqueio estavam conectados ao layout privado.

## Correcoes implementadas

Arquivos principais criados:

- `features/organizations/access-control.ts`
- `features/admin/actions.ts`
- `features/admin/queries.ts`
- `app/(public)/acesso-bloqueado/page.tsx`
- `supabase/migrations/0009_access_trial_admin_controls.sql`
- `scripts/access-control-tests.mjs`
- `AUDITORIA-HUNTER-PRO.md`

Arquivos principais alterados:

- `app/(app)/layout.tsx`
- `app/admin/page.tsx`
- `features/organizations/current.ts`
- `features/organizations/guards.ts`
- `features/dashboard/queries.ts`
- `scripts/security-audit.mjs`
- `package.json`
- `README.md`
- `AGENTS.md`

## Regra de acesso implementada

Estados:

- `trial`: empresa pode usar durante o teste gratis.
- `active`: empresa liberada.
- `trial_expired`: empresa bloqueada porque o teste terminou.
- `blocked`: bloqueio administrativo.
- `suspended`: suspensao administrativa.
- `cancelled`: conta cancelada.

Fluxo:

1. O usuario faz cadastro.
2. Ao criar a empresa, o banco define `trial_started_at = now()` e `trial_ends_at = now() + 5 days`.
3. O painel privado chama a regra central de acesso no servidor.
4. Se a empresa estiver ativa ou em teste dentro do prazo, o painel abre.
5. Se o teste venceu ou a empresa foi bloqueada/cancelada/suspensa, o usuario vai para `/acesso-bloqueado`.
6. O superadmin entra em `/admin` e pode ativar, bloquear, liberar, estender teste por 5 dias, encerrar teste ou cancelar.
7. Cada acao administrativa grava `audit_logs` e cria notificacao interna.

## Matriz de permissoes

- `SUPER_ADMIN`: acessa `/admin` e gerencia empresas globalmente.
- `OWNER`: administra a empresa e recursos principais.
- `ADMIN`: administra a empresa, exceto poderes globais.
- `MANAGER`: opera agenda, CRM, relatorios e vitrine conforme rotas permitidas.
- `SALES`: opera CRM, pipeline, leads, clientes e vendas.
- `ATTENDANT`: opera atendimento, clientes, leads e agenda.
- `PROFESSIONAL`: opera agenda e tarefas ligadas ao atendimento.
- `FINANCIAL`: opera financeiro, vendas e relatorios financeiros.

Observacao: a permissao visual do menu existe, mas decisoes sensiveis continuam sendo validadas no servidor.

## Banco de dados

Migration nova:

- `0009_access_trial_admin_controls.sql`

Ela adiciona em `organizations`:

- `access_status`
- `trial_started_at`
- `trial_ends_at`
- `activated_at`
- `blocked_at`
- `blocked_by`
- `blocked_reason`
- `admin_notes`

Ela tambem atualiza a funcao `create_organization_for_current_user` para criar empresas novas em `TRIALING` com 5 dias gratis.

## LGPD e seguranca

Pontos positivos:

- Dados privados usam `organization_id`.
- Acoes administrativas passam a ser auditadas.
- Rotas privadas possuem middleware de login.
- Guard server-side por perfil foi mantido.
- Chaves secretas nao foram movidas para o frontend.
- Upload da vitrine usa Storage com politicas no Supabase.

Riscos restantes:

- Ainda falta uma politica formal de retencao de logs.
- Ainda falta tela de consentimento/termos final para clientes finais.
- Integracoes Meta/WhatsApp devem ser feitas com OAuth e tokens seguros no servidor.
- Pagamentos precisam de webhook idempotente para bloquear/liberar sem acao manual.

## Verificacoes executadas

- `npm.cmd run lint`: passou.
- `npm.cmd run typecheck`: passou.
- `npm.cmd test`: passou.
- `npm.cmd run build`: passou.
- `npm.cmd audit --audit-level=moderate`: passou, sem vulnerabilidades encontradas.

Migration `0009_access_trial_admin_controls.sql` aplicada no Supabase de producao com sucesso.

## Proximos passos recomendados

1. Publicar a nova versao na Vercel.
2. Testar cadastro de empresa nova e confirmar que o teste aparece com 5 dias.
3. Testar `/admin` com superadmin.
4. Testar bloqueio e liberacao em uma empresa de teste.
5. Implementar pagamento real para trocar manualidade por automacao.
6. Criar integracao Meta/Instagram/WhatsApp via OAuth e webhooks.
7. Agendar a funcao `expire_organization_trials` por cron/job seguro.
