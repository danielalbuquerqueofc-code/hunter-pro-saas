# Relatorio - Administracao Hunter Pro

## Diagnostico inicial

O Hunter Pro ja possuia uma base SaaS importante: autenticacao via Supabase, organizacoes, membros, papeis, planos, assinaturas, periodo de teste, status de acesso, bloqueio centralizado, RLS, auditoria, vitrine publica, agenda, servicos, disponibilidade, reservas e estruturas para WhatsApp e Google Calendar.

Os principais pontos ausentes ou incompletos estavam na operacao administrativa: painel de superadmin muito resumido, menu mobile sem todas as areas, pagina de usuarios ainda em placeholder, ausencia de uma pagina clara de conta do usuario, configuracoes da empresa limitadas e falta de acesso visivel ao ambiente global de administracao.

## Recursos encontrados

- Autenticacao: Supabase Auth com perfil em `profiles`.
- Multiempresa: `organizations` e `organization_members`.
- Perfis: roles definidos em `lib/constants/roles.ts`.
- Bloqueios: `access_status`, `blocked_reason`, `blocked_message`, `trial_ends_at`.
- Teste gratuito: campos e funcoes criados nas migrations existentes.
- Auditoria: tabela `audit_logs` ja existente.
- Planos e assinaturas: tabelas `plans` e `subscriptions`.
- Protecao de rotas privadas: `app/(app)/layout.tsx` e guards de organizacao.
- Vitrine publica: rotas `/p/[slug]` e `/p/[slug]/company`.
- Disponibilidade e agendamento: API publica e migration propria ja existentes.

## Recursos ausentes ou incompletos

- Painel global do superadmin estava concentrado em uma tela simples.
- Modulos administrativos nao estavam organizados como ambiente separado.
- Menu mobile nao exibia todas as areas importantes.
- `Usuarios e equipe` estava desabilitado.
- Nao havia pagina `Minha conta`.
- Nao havia pagina dedicada a `Plano e assinatura`.
- Nao havia pagina simples de `Ajuda e suporte`.
- Dados da empresa nao tinham uma tela completa de edicao.
- Alguns recursos solicitados exigem novas migrations futuras, como documento, razao social, ultimo acesso real, upload com recorte, sessoes ativas e 2FA.

## Telas criadas

- `/minha-conta`: edicao de nome, telefone, avatar por URL e senha.
- `/plano-assinatura`: consulta de plano atual, teste, assinatura e planos disponiveis.
- `/ajuda`: atalhos operacionais para configuracoes, atendimento e usuarios.

## Telas alteradas

- `/admin`: painel ampliado do superadministrador.
- `/usuarios`: saiu de placeholder e passou a listar membros da empresa com edicao de perfil/status.
- `/configuracoes`: passou a editar dados comerciais da empresa.
- Shell do app: menu mobile completo, atalho de superadmin, topbar e menu do usuario.

## Rotas criadas

- `/minha-conta`
- `/plano-assinatura`
- `/ajuda`

## Tabelas alteradas

Nenhuma tabela foi alterada nesta etapa. A entrega reaproveitou a estrutura existente para evitar risco no banco de producao.

## Migrations

Nenhuma migration nova foi criada nesta etapa. O pedido tinha alto risco de misturar recursos ja existentes com campos ainda nao modelados. Os campos que nao existem no banco foram documentados como pendencias, sem forcar alteracao em producao.

## Permissoes

- Superadmin: acesso ao painel `/admin` por `requireSuperAdmin`.
- Administrador da empresa: acesso a configuracoes, usuarios e plano da propria empresa.
- Usuario comum: acesso a propria conta e modulos permitidos.
- Gestao de membros: validada no servidor por `requireOrganizationAccess(["OWNER", "ADMIN"])`.
- Edicao da empresa: validada no servidor por `requireOrganizationAccess(["OWNER", "ADMIN"])`.

## Regras de bloqueio

A camada existente de bloqueio foi preservada:

- `app/(app)/layout.tsx` valida acesso da organizacao antes de renderizar rotas privadas.
- `features/organizations/access-control.ts` calcula estados de teste, bloqueio, cancelamento, atraso e acesso ativo.
- Rotas privadas direcionam para `/acesso-bloqueado` quando a empresa nao pode usar o sistema.

## Fluxo de teste gratuito

O fluxo ja existia via migrations anteriores:

- teste padrao de 5 dias;
- status `trial`, `trial_expired`, `active`, `overdue`, `suspended`, `blocked`, `cancelled`;
- mensagens padronizadas;
- funcao de expiracao de trials.

Nesta etapa, o painel admin passou a exibir metricas de empresas em teste, testes proximos do fim e testes expirados.

## Menu mobile implementado

O menu mobile agora possui atalhos inferiores e um menu completo em bottom sheet.

Grupos:

- Principal: Inicio, Agenda, Clientes, Atendimento, Tarefas.
- Gestao: CRM, Servicos, Financeiro, Relatorios.
- Crescimento: Vitrine digital, Automacoes, IA.
- Sistema: Configuracoes, Minha conta, Usuarios e equipe, Plano e assinatura, Ajuda e suporte, Sair.
- Plataforma: Administracao da plataforma, apenas para superadmin.

## Recursos de edicao do usuario

Implementado:

- nome;
- telefone;
- avatar por URL;
- e-mail visivel como conta de acesso;
- troca de senha;
- validacao no servidor.

Pendentes para etapa futura:

- upload com recorte;
- sessoes ativas;
- encerrar outras sessoes;
- 2FA;
- preferencias de idioma, fuso horario e notificacoes.

## Problemas corrigidos

- Menu mobile incompleto.
- Modulo de usuarios sem tela operacional.
- Falta de acesso facil a Minha conta.
- Falta de tela de plano/assinatura.
- Superadmin sem destaque no topo e no mobile.
- Configuracoes da empresa muito limitadas.
- Auditoria de alteracao de empresa agora registra o usuario responsavel.
- Validacao local passou a exigir os novos arquivos protegidos.

## Testes executados

- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd test`
- `npm.cmd run build`

## Resultado das verificacoes

- Lint: aprovado.
- Typecheck: aprovado.
- Testes: aprovado.
- Build: aprovado.

## Pendencias

- Criar telas internas separadas para cada submodulo do superadmin, caso a operacao cresca.
- Implementar suporte comercial real sem contato ficticio.
- Cadastrar chaves reais do Stripe e `stripe_price_id` dos planos para ativar checkout.
- Adicionar revogacao de sessoes e 2FA.
- Capturar IP/origem nos logs quando a infraestrutura disponibilizar esses dados.

## Riscos ainda existentes

- Alguns dados solicitados pelo prompt nao existem no schema atual e nao devem ser inventados.
- A gestao de usuarios ainda altera membros existentes; convite/criacao completa depende de fluxo adicional com Auth.
- Upload de arquivos exige Storage, politicas e limite de tamanho.
- Receita recorrente exibida e estimada a partir do plano vinculado; faturamento real depende de gateway de pagamento.

## Tabela de entrega

| Recurso | Status anterior | Status atual | Arquivo responsavel | Rota | Perfil autorizado | Teste realizado |
|---|---|---|---|---|---|---|
| Painel superadmin | Simples | Expandido com metricas, filtros, modulos e auditoria | `app/admin/page.tsx` | `/admin` | Superadmin | lint, typecheck, test, build |
| Consulta de empresas | Parcial | Lista com busca, filtro e indicadores | `features/admin/queries.ts` | `/admin` | Superadmin | lint, typecheck, test, build |
| Acoes de acesso | Existia | Preservada no painel ampliado | `app/admin/page.tsx`, `features/admin/actions.ts` | `/admin` | Superadmin | lint, typecheck, test, build |
| Menu mobile | Incompleto | Bottom sheet com areas agrupadas | `components/shell/mobile-navigation.tsx` | app privado | Usuario autenticado | lint, typecheck, test, build |
| Atalho superadmin mobile | Ausente | Visivel apenas para superadmin | `components/shell/mobile-navigation.tsx` | `/admin` | Superadmin | lint, typecheck, test, build |
| Minha conta | Ausente | Criada | `app/(app)/minha-conta/page.tsx` | `/minha-conta` | Usuario autenticado | lint, typecheck, test, build |
| Troca de senha | Ausente na interface | Criada por server action | `features/account/actions.ts` | `/minha-conta` | Usuario autenticado | lint, typecheck, test, build |
| Dados da empresa | Limitado | Edicao ampliada | `app/(app)/configuracoes/page.tsx` | `/configuracoes` | Owner/Admin | lint, typecheck, test, build |
| Auditoria da empresa | Parcial | Edicao registra ator | `features/settings/actions.ts` | `/configuracoes` | Owner/Admin | lint, typecheck, test, build |
| Usuarios e equipe | Placeholder | Lista e edicao de membros | `app/(app)/usuarios/page.tsx` | `/usuarios` | Owner/Admin | lint, typecheck, test, build |
| Plano e assinatura | Ausente | Criada | `app/(app)/plano-assinatura/page.tsx` | `/plano-assinatura` | Owner/Admin/Financeiro | lint, typecheck, test, build |
| Ajuda e suporte | Ausente | Criada com atalhos internos | `app/(app)/ajuda/page.tsx` | `/ajuda` | Usuario autenticado | lint, typecheck, test, build |
| Validacao local | Incompleta | Atualizada para novas rotas e menu | `scripts/security-audit.mjs` | scripts | Desenvolvimento | npm test |

## Atualizacao - Contas, Storage, convites e billing

Foi criada e aplicada no Supabase a migration `0012_accounts_storage_invites_billing.sql`.

### O que foi criado

- Bucket publico controlado por RLS: `hunter-assets`.
- Politicas de Storage para permitir upload somente por membros autorizados da empresa.
- Campos extras em `profiles`: WhatsApp, cargo, bio, idioma, fuso, formato de data, preferencias e ultimo acesso.
- Campos extras em `organizations`: razao social, documento, inscricoes, dados de cobranca, suporte e cliente Stripe.
- Campos Stripe em `plans` e `subscriptions`.
- Tabela `organization_invitations` com RLS para convites de equipe.
- Endpoint seguro `/api/webhooks/stripe`.
- Acao server-side para criar Checkout Session Stripe.
- Acao server-side para convidar usuarios por e-mail via Supabase Auth Admin.
- Upload real de avatar, logo e capa usando Supabase Storage.

### O que foi alterado na interface

- `/minha-conta`: upload de foto, WhatsApp, cargo, bio, idioma, fuso e formato de data.
- `/configuracoes`: upload de logo/capa, razao social, documento, inscricoes e dados de cobranca.
- `/usuarios`: convite por e-mail e historico de convites.
- `/plano-assinatura`: botoes de assinatura com Stripe, bloqueados quando nao houver configuracao real.

### Segurança

- A chave secreta do Supabase continua somente no servidor.
- O upload passa por RLS usando o primeiro segmento da pasta como `organization_id`.
- Convite de usuario exige OWNER ou ADMIN.
- Webhook Stripe exige assinatura `STRIPE_WEBHOOK_SECRET`.
- Checkout so cria sessao se existir `STRIPE_SECRET_KEY` e `stripe_price_id`.

### Validacoes da atualizacao

- `npm.cmd run lint`: aprovado.
- `npm.cmd run typecheck`: aprovado.
- `npm.cmd test`: aprovado.
- `npm.cmd run build`: aprovado.

### Ainda depende de configuracao externa

- `STRIPE_SECRET_KEY`.
- `STRIPE_WEBHOOK_SECRET`.
- `stripe_price_id` em cada plano no Supabase.
- Configuracao de MFA no Supabase Auth para ativar 2FA de ponta a ponta.
