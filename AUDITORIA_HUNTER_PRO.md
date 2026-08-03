# Auditoria Hunter Pro

Data da auditoria: 2026-08-03
Projeto: Hunter Pro SaaS
Workspace auditado: `C:\Users\Usuario\Documents\Codex\2026-06-08\files-mentioned-by-the-user-texto\work\hunter-pro-saas`
Dominio testado: `https://prospectorads.com`
Link publico testado: `https://prospectorads.com/p/md2company`

## 1. Resumo executivo

O Hunter Pro possui uma base tecnica consistente para um SaaS multiempresa em Next.js, Supabase e Vercel. A aplicacao compila, passa no lint, passa na checagem de tipos e passa na suite local de testes estruturais.

Mesmo assim, o sistema ainda nao deve ser considerado plenamente pronto para comercializacao sem corrigir pontos criticos de seguranca operacional, cobranca, disponibilidade, integracoes e consistencia funcional.

Conclusao objetiva:

- Status tecnico local: aprovado com ressalvas.
- Status para uso comercial amplo: nao aprovado ainda.
- Motivo: existem riscos altos em cobranca/bloqueio de acesso, auditoria de dependencias com vulnerabilidades altas, modulos ainda placeholder, integracoes parcialmente preparadas e testes de isolamento ainda mais estruturais do que reais.

## 2. Escopo executado

Esta etapa seguiu a instrucao de auditoria primeiro. Nao foram implementadas novas funcionalidades e nenhum arquivo de codigo foi removido.

Foi analisado:

- arquitetura geral;
- rotas publicas e privadas;
- middleware/proxy;
- autenticacao;
- guardas server-side;
- permissoes;
- modulos ativos e desativados;
- Supabase e migrations;
- fluxo publico de vitrine e agendamento;
- disponibilidade;
- reservas temporarias;
- webhooks Stripe e Asaas;
- lembretes;
- usuarios e convites;
- dependencias;
- scripts de teste;
- dominio publicado.

## 3. Inventario tecnico

Framework principal:

- Next.js 16.2.10 com App Router e Turbopack.
- React 19.2.7.
- Supabase SSR/JS.
- TypeScript.
- Tailwind CSS.

Contagem atual:

- Total de arquivos rastreados por `rg --files`: 209.
- Arquivos de rota/layout/loading/error em `app`: 50.
- API routes: 6.
- Componentes em `components`: 43.
- Arquivos em `features`: 38.
- Migrations SQL: 14.
- Scripts locais de auditoria/testes: 8.
- Dependencias de producao: 12.
- Dependencias de desenvolvimento: 11.

Rotas dinamicas e publicas relevantes:

- `/p/[slug]`
- `/p/[slug]/company`
- `/agendar/[slug]`
- `/orcamento/[slug]`
- `/avaliar/[token]`
- `/api/public/availability`
- `/api/public/holds`
- `/api/cron/reminders`
- `/api/webhooks/asaas`
- `/api/webhooks/stripe`

Rotas privadas principais:

- `/dashboard`
- `/agenda`
- `/crm`
- `/atendimento`
- `/tarefas`
- `/servicos`
- `/financeiro`
- `/relatorios`
- `/vitrine`
- `/automacoes`
- `/ia`
- `/configuracoes`
- `/usuarios`
- `/admin`

## 4. Evidencias de validacao executadas

### Lint

Comando executado:

`npm.cmd run lint`

Resultado:

- Aprovado.
- `eslint .` terminou com codigo 0.

### Typecheck

Comando executado:

`npm.cmd run typecheck`

Resultado:

- Aprovado.
- `tsc --noEmit` terminou com codigo 0.

### Testes locais

Comando executado:

`npm.cmd test`

Resultado:

- Aprovado.
- Scripts executados:
  - `security-audit.mjs`
  - `access-control-tests.mjs`
  - `public-showcase-tests.mjs`
  - `scheduling-tests.mjs`
  - `integration-readiness-tests.mjs`
  - `commercial-plan-tests.mjs`
  - `critical-fixes-tests.mjs`
  - `cleanup-audit-tests.mjs`

Observacao importante:

- Esses testes sao principalmente estruturais. Eles verificam presenca de guardas, arquivos e trechos esperados, mas nao substituem testes reais de duas empresas no banco, concorrencia simultanea, webhooks reais, OAuth Google real ou envio WhatsApp real.

### Build

Comando executado:

`npm.cmd run build`

Resultado:

- Aprovado.
- Compilou em 42s.
- TypeScript no build terminou em 29.3s.
- Gerou 43 paginas estaticas.
- Rotas dinamicas renderizadas sob demanda.

### Auditoria de dependencias

Comando executado:

`npm.cmd audit --audit-level=moderate`

Resultado:

- Reprovado.
- Foram encontradas 3 vulnerabilidades altas:
  - `brace-expansion`: DoS por expansao sem limite.
  - `next`: multiplos avisos de seguranca, incluindo bypass de Middleware/Proxy em App Router com Turbopack e outras CVEs.
  - `sharp`: vulnerabilidades herdadas em libvips.

Recomendacao:

- Rodar correcao controlada com `npm audit fix`, revisar alteracoes no lockfile e repetir lint/typecheck/test/build.
- Como ha avisos envolvendo Next.js/Proxy, esse item deve ser tratado como bloqueador antes de escalar comercialmente.

## 5. Teste do dominio publicado

URLs testadas:

- `https://prospectorads.com/p/md2company`
  - Status: 200.
  - Tempo medido via requisicao simples: 5536 ms.
  - Tamanho aproximado: 39 KB HTML.

- `https://prospectorads.com/login`
  - Status: 200.
  - Tempo medido via requisicao simples: 398 ms.

- `https://prospectorads.com/dashboard`
  - Status sem seguir redirecionamento: 307.
  - Resultado esperado: rota privada protegida antes de entregar conteudo.

Dominio alternativo testado:

- `https://prospectoads.com/p/md2company`
  - Falhou DNS: nome remoto nao resolvido.

Observacao:

- Nos prompts anteriores apareceram variacoes entre `prospectorads.com` e `prospectoads.com`. O dominio funcional nesta auditoria foi `prospectorads.com`.

## 6. Matriz de conformidade

| Area | Status | Evidencia | Risco |
| --- | --- | --- | --- |
| Build local | Conforme | `npm.cmd run build` aprovado | Baixo |
| Lint | Conforme | `npm.cmd run lint` aprovado | Baixo |
| Typecheck | Conforme | `npm.cmd run typecheck` aprovado | Baixo |
| Testes locais | Parcial | Suite passa, mas e estrutural | Medio |
| Middleware/proxy | Parcial | Protege rotas privadas, mas falha aberto sem env Supabase | Alto |
| Auth | Parcial | Login/cadastro existem; login ignora `next` | Medio |
| Superadmin | Parcial | `requireSuperAdmin()` em `/admin` | Medio |
| Multiempresa | Parcial | Guardas por organizacao existem; teste real de isolamento nao foi executado | Alto |
| Permissoes | Parcial | `lib/permissions.ts` e minimalista; modulos filtram por role | Medio |
| Planos/cobranca | Parcial | Asaas consistente; Stripe possui status `overdue` inconsistente | Critico |
| Vitrine publica | Parcial/boa | Rota publica responde e componentes atuais existem | Medio |
| Servicos | Parcial | Cadastro funciona; imagem de servico ainda usa URL manual | Medio |
| Agenda/disponibilidade | Parcial | Algoritmo existe; timezone e Google busy incompletos no fluxo real | Alto |
| Reservas temporarias | Parcial | RPC e API existem; precisa teste real concorrente | Alto |
| WhatsApp | Parcial | Camada/env e cron existem; depende credenciais reais | Alto |
| Google Calendar | Parcial | Preparacao existe; OAuth/consulta busy nao plenamente conectados | Alto |
| Lembretes | Parcial | Cron existe; sem janela de silencio completa e sem access_status | Alto |
| PWA | Parcial | Manifest e assets existem; nao foi feito teste Lighthouse/PWA completo | Medio |
| Dependencias | Nao conforme | `npm audit` encontrou 3 high | Alto |

## 7. Achados criticos e altos

### [CRITICO] Stripe pode gravar `access_status = "overdue"`, mas esse status nao existe no modelo de acesso

Arquivos:

- `app/api/webhooks/stripe/route.ts`, linha 91.
- `features/organizations/access-control.ts`, linhas 3-12, 38-44, 61-69.
- `supabase/migrations/0009_access_trial_admin_controls.sql`, linhas 22-23.

Evidencia:

- O webhook Stripe converte `PAST_DUE` para `access_status: "overdue"`.
- A constraint do banco aceita apenas `trial`, `active`, `suspended`, `trial_expired`, `blocked`, `cancelled`.
- O access-control tambem nao reconhece `overdue`.

Impacto possivel:

- O webhook pode falhar ao atualizar a organizacao por violar constraint.
- Ou, se o valor entrar em algum ambiente sem constraint, `normalizeStatus` nao reconhece e pode tratar como `active`.
- Cliente inadimplente pode continuar com acesso, ou o processo de cobranca pode quebrar silenciosamente.

Prioridade:

- Corrigir antes de comercializacao.

### [ALTO] Proxy falha aberto quando variaveis Supabase nao existem

Arquivo:

- `proxy.ts`, linhas 44-47.

Evidencia:

- Se `NEXT_PUBLIC_SUPABASE_URL` ou `NEXT_PUBLIC_SUPABASE_ANON_KEY` estiver ausente, o proxy retorna `response` sem aplicar protecao.

Impacto:

- Em producao com env incorreto, a primeira barreira de rotas privadas deixa de operar.
- As paginas ainda podem ter guardas server-side, mas o comportamento seguro deveria ser negar/redirecionar em rotas privadas.

Prioridade:

- Corrigir antes de comercializacao.

### [ALTO] Disponibilidade usa timezone no dado, mas calculo central nao aplica timezone real

Arquivos:

- `features/scheduling/availability.ts`, linhas 6, 136-148, 187.
- `app/api/public/availability/route.ts`, linha 62.

Evidencia:

- `timezone` aparece no tipo e e retornado pela API.
- O calculo cria datas com `new Date(...)` e compara periodos sem conversao robusta por fuso da empresa.

Impacto:

- Risco de horarios errados em empresas fora do fuso padrao, horario de verao futuro, ou usuarios/clientes em fusos diferentes.

Prioridade:

- Corrigir antes de vender para empresas fora de `America/Sao_Paulo`.

### [ALTO] Eventos ocupados do Google Calendar nao entram no fluxo publico real

Arquivos:

- `features/scheduling/availability.ts`, `googleBusy` suportado.
- `app/api/public/availability/route.ts`, nao carrega eventos busy externos.

Evidencia:

- O algoritmo suporta `googleBusy`.
- A rota publica nao consulta Google Calendar conectado nem injeta busy blocks externos.

Impacto:

- Se a empresa/profissional tiver compromisso externo no Google, a vitrine pode oferecer horario ocupado.

Prioridade:

- Alto para qualquer operacao que prometa sincronizacao real com Google Calendar.

### [ALTO] Convite cria membro ACTIVE antes do aceite do usuario

Arquivo:

- `features/users/actions.ts`, linhas 111 e 145.

Evidencia:

- A action usa `inviteUserByEmail`.
- Depois faz upsert em `organization_members` com `status: "ACTIVE"`.

Impacto:

- Usuario convidado pode aparecer como membro ativo antes de aceitar.
- Pode afetar limite de plano, auditoria e regras internas.

Prioridade:

- Alto em ambiente comercial multiempresa.

### [ALTO] Cron de lembretes nao valida `access_status` e nao aplica janela de silencio completa

Arquivo:

- `app/api/cron/reminders/route.ts`, linhas 21, 102 e logica de envio.

Evidencia:

- O cron consulta `organization.status`, mas nao consulta `access_status`, `subscription_status`, `quiet_hours_start`, `quiet_hours_end` ou politica de silencio.

Impacto:

- Empresa bloqueada por trial/cobranca pode continuar tendo mensagens processadas se `organization.status` estiver ACTIVE.
- Mensagens podem sair fora de horario permitido.

Prioridade:

- Alto antes de ativar WhatsApp oficial em producao.

## 8. Bugs e pendencias medias

### [MEDIO] Login ignora rota original protegida

Arquivo:

- `features/auth/actions.ts`.

Evidencia:

- O proxy redireciona para `/login?next=...`, mas o login apos sucesso redireciona para `/dashboard`.

Impacto:

- Experiencia pior: usuario tenta abrir uma rota especifica e perde o destino apos login.

### [MEDIO] Documentacao recomenda React Hook Form, mas dependencia foi removida

Arquivos:

- `README.md`.
- `AGENTS.md`.
- `package.json`.

Evidencia:

- README/AGENTS ainda citam React Hook Form como padrao.
- `react-hook-form` e `@hookform/resolvers` nao estao mais instalados.
- O script `cleanup-audit-tests.mjs` valida que essa dependencia deve permanecer removida ate ser usada.

Impacto:

- Futuras implementacoes podem seguir uma orientacao errada.

### [MEDIO] Modulos placeholder ainda existem

Arquivos:

- `app/(app)/leads/page.tsx`
- `app/(app)/leads/[id]/page.tsx`
- `app/(app)/pipeline/page.tsx`
- `app/(app)/conversas/page.tsx`
- `app/(app)/orcamentos/page.tsx`
- `app/(app)/orcamentos/[id]/page.tsx`
- `app/(app)/vendas/page.tsx`
- `app/(app)/avaliacoes/page.tsx`
- `app/(app)/ia-sdr/page.tsx`
- `app/(app)/clientes/[id]/page.tsx`

Evidencia:

- Usam `ModulePlaceholder`.
- Em `lib/modules.ts`, varios aparecem com `status: "disabled"`.

Impacto:

- Nao e bug se estiver planejado, mas nao pode ser vendido como funcionalidade pronta.

### [MEDIO] Imagem de servico ainda depende de URL manual

Arquivo:

- `app/(app)/servicos/page.tsx`, linhas 97-100.

Evidencia:

- Campo `imageUrl` usa placeholder `https://exemplo.com/foto-do-servico.jpg`.
- Existe componente de upload em `components/forms/storage-image-upload.tsx`, mas o formulario de servicos ainda nao usa upload direto.

Impacto:

- Para usuario leigo, cadastrar imagem por URL e dificil.

### [MEDIO] Testes de RLS e isolamento ainda nao sao reais de banco

Evidencia:

- Scripts locais verificam textos e estrutura.
- Nao foi encontrado teste automatizado criando duas organizacoes e provando que uma nao acessa dados da outra via Supabase.

Impacto:

- O maior risco declarado do projeto, vazamento entre empresas, ainda precisa de teste automatizado real.

### [MEDIO] Supabase Data API exige revisao de grants em tabelas novas

Contexto externo verificado:

- Supabase publicou mudanca indicando que tabelas novas no schema public nao sao automaticamente expostas para Data API/GraphQL e precisam de grants explicitos.
- Fonte: https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically

Impacto:

- Migrations antigas podem estar ok, mas novas tabelas precisam ser revisadas para garantir grants/revokes corretos por funcao.

## 9. Modulos e telas por status

### Funcionais ou parcialmente funcionais

- Dashboard.
- Agenda.
- CRM.
- Atendimento.
- Tarefas.
- Servicos.
- Financeiro simples.
- Relatorios basicos.
- Vitrine digital.
- Automacoes estruturais.
- IA estrutural.
- Configuracoes.
- Minha conta.
- Plano e assinatura.
- Usuarios e equipe.
- Admin.

### Desativados ou placeholder

- Leads.
- Pipeline.
- Conversas.
- Orcamentos.
- Vendas.
- Avaliacoes.
- IA SDR.
- Detalhe de cliente.
- Detalhe de lead.
- Detalhe de orcamento.

## 10. Integracoes

### Supabase

Status:

- Integracao central existente.
- Migrations extensas.
- Auth, banco, storage e RPCs presentes.

Riscos:

- Necessario teste real de RLS multiempresa.
- Necessario revisar grants em tabelas novas, principalmente por mudancas atuais do Supabase.

### Asaas

Status:

- Webhook existe.
- Token de webhook validado.
- Idempotencia por evento registrada.
- `PAYMENT_OVERDUE` converte para `trial_expired`, coerente com access-control.

Risco:

- Ainda depende credenciais reais, configuracao externa e teste real de sandbox/producao.

### Stripe

Status:

- Webhook existe e valida assinatura.

Risco critico:

- `PAST_DUE` gera `access_status = "overdue"`, status nao suportado.

### WhatsApp

Status:

- Env e estrutura de envio existem.
- Cron de lembretes pode chamar provider quando configurado.

Riscos:

- Sem credenciais oficiais nao ha envio real.
- Cron nao respeita totalmente status de acesso e janela de silencio.
- Nao considerar redirecionamento para WhatsApp como automacao real.

### Google Calendar

Status:

- Variaveis e preparacao existem.
- Estrutura de agenda reconhece `googleBusy`.

Riscos:

- Rota publica de disponibilidade nao injeta busy blocks do Google.
- OAuth real e calendario conectado ainda precisam de validacao completa.

## 11. Seguranca

Pontos positivos:

- Rotas privadas principais estao no `proxy.ts`.
- `/dashboard` publicado retorna 307 sem seguir redirecionamento.
- Layout privado chama `requireUser`.
- Admin chama `requireSuperAdmin`.
- API cron exige `CRON_SECRET`.
- Webhook Stripe valida assinatura.
- Webhook Asaas valida token.
- Service role aparece centralizado em server/admin client, nao no frontend.

Riscos:

- Proxy falha aberto quando env Supabase falta.
- Teste real de RLS multiempresa nao foi executado.
- Convite cria membro ativo antes de aceite.
- Algumas regras de permissao sao distribuidas por pagina/action e nao centralizadas em matriz completa.
- Auditoria de dependencia reprovou com vulnerabilidades altas.

## 12. Performance

Medicoes simples executadas via requisicao HTTP:

- `/p/md2company`: 5536 ms, 39 KB HTML.
- `/login`: 398 ms, 19 KB HTML.
- `/dashboard`: 307 em 527 ms.

Build:

- Compilacao: 42s.
- TypeScript durante build: 29.3s.
- Static pages: 43.

Observacoes:

- A vitrine publica teve tempo maior na primeira requisicao medida. Pode ser cold start, consulta Supabase, cache ausente ou render dinamico.
- Nao foi executado Lighthouse nesta etapa.
- Nao foi feita analise visual automatizada nem Core Web Vitals.

Recomendacoes:

- Medir com Lighthouse e Vercel Speed Insights.
- Verificar cache/revalidate da vitrine publica.
- Revisar queries da vitrine para evitar consultas em cascata.
- Otimizar imagens remotas de capa/servicos.

## 13. Arquivos desnecessarios, duplicados ou temporarios

Resultado desta etapa:

- Nenhum arquivo de codigo foi removido.
- Nao foram encontrados arquivos `.old`, `.bak`, `.backup`, `.tmp`, `copy`, `copia`, `duplicate` ou `legacy` dentro das pastas de codigo auditadas.
- A primeira varredura ampla encontrou arquivos gerados em `.next` e `node_modules`, mas eles nao foram classificados como codigo de projeto.

Observacao:

- Existem muitos relatorios antigos no root. Eles devem ser mantidos por enquanto porque fazem parte do historico do projeto e podem servir de evidencia.

## 14. Bugs encontrados

Quantidade de bugs/riscos encontrados nesta auditoria:

- Criticos: 1.
- Altos: 5.
- Medios: 6.
- Baixos/documentais: 2+.

Lista resumida:

1. Stripe usa `overdue` incompatível com access-control e constraint.
2. Proxy falha aberto sem env Supabase.
3. Timezone nao e aplicado de forma robusta no calculo de disponibilidade.
4. Google Calendar busy nao entra no fluxo publico real.
5. Convite ativa membro antes do aceite.
6. Cron de lembretes nao respeita `access_status` e janela de silencio completa.
7. Login ignora `next`.
8. Documentacao cita React Hook Form sem dependencia instalada.
9. Modulos placeholder ainda existem.
10. Servico usa URL manual para imagem.
11. Testes de RLS sao estruturais, nao reais.
12. `npm audit` reprovou com 3 vulnerabilidades altas.

## 15. Elementos visuais sem logica ou incompletos

Itens identificados:

- Modulos desativados ainda possuem rotas placeholder. Isso e aceitavel em desenvolvimento, mas nao deve aparecer como funcionalidade vendida.
- `Clientes` possui CTA voltando para `/crm`, mostrando que o modulo ainda depende do CRM antigo.
- Campo de imagem do servico pede URL manual, pouco adequado ao publico leigo.
- Admin exibe status "Parcial", "Consulta" e "Pendente" para recursos administrativos. Isso e aceitavel para superadmin, mas reforca que o produto ainda tem partes incompletas.

Nao foi alterado o layout da Vitrine Digital nesta auditoria, conforme solicitado.

## 16. Plano de correcao recomendado

### Etapa 1 - Bloqueadores comerciais

1. Corrigir `access_status` do Stripe para usar status suportado (`trial_expired`, `blocked`, `suspended` ou regra equivalente).
2. Fazer proxy falhar fechado em rotas privadas quando env Supabase estiver ausente.
3. Resolver `npm audit` com atualizacao controlada.
4. Criar teste real de RLS com duas empresas.
5. Corrigir cron para respeitar `access_status`, subscription e janela de silencio.

### Etapa 2 - Agenda e integracoes

1. Aplicar timezone real em disponibilidade.
2. Integrar eventos busy do Google Calendar no calculo publico.
3. Testar reserva temporaria com concorrencia real.
4. Validar WhatsApp oficial com credenciais reais e logs de retry.

### Etapa 3 - Experiencia comercial

1. Upload direto de imagem para servicos.
2. Login respeitar `next`.
3. Convite de usuario ficar pendente ate aceite.
4. Revisar modulos placeholder e esconder tudo que nao sera vendido.

### Etapa 4 - Performance

1. Lighthouse mobile e desktop.
2. Revisar cache da vitrine.
3. Otimizar imagens remotas.
4. Medir bundle por rota.

## 17. Respostas obrigatorias da auditoria

1. Quantos arquivos foram analisados?
   - 209 arquivos foram inventariados. Arquivos criticos de app, features, lib, scripts e migrations foram auditados em detalhe.

2. Quantos arquivos foram removidos?
   - 0. Esta etapa era de auditoria, nao limpeza destrutiva.

3. Quantos componentes sem uso foram encontrados?
   - Nenhum componente foi classificado como seguro para remocao nesta etapa. Existem componentes/rotas placeholder intencionais.

4. Quantas dependencias foram removidas?
   - 0.

5. Quantos bugs/riscos foram encontrados?
   - 12 principais.

6. Quantos bugs foram corrigidos?
   - 0 nesta etapa, por instrucao de auditar primeiro.

7. Quais bugs ainda estao pendentes?
   - Todos os listados na secao 14.

8. Quais paginas estavam mais lentas?
   - Entre as URLs testadas, `/p/md2company` foi a mais lenta: 5536 ms na medicao simples.

9. Qual foi a melhoria de performance?
   - Nenhuma melhoria foi aplicada nesta etapa. Nao afirmar melhoria sem correcao e nova medicao.

10. Quais elementos visuais estavam sem nexo?
   - Placeholders de modulos incompletos, CTA de clientes para CRM, campo de imagem por URL, status administrativos de funcionalidades parciais no admin.

11. O build foi aprovado ou reprovado?
   - Aprovado.

12. O sistema esta apto para comercializacao?
   - Nao para comercializacao ampla ainda. Esta apto para ambiente controlado/piloto, com ressalvas, se os riscos forem conhecidos.

13. Quais itens ainda sao bloqueadores?
   - `npm audit` com vulnerabilidades altas.
   - Bug de `access_status` Stripe/overdue.
   - Proxy falhar aberto sem env.
   - Falta de teste real de isolamento multiempresa/RLS.
   - Disponibilidade sem timezone robusto e sem Google busy real.

## 18. Fase de correcoes criticas e altas - 2026-08-03

Branch criada:

- `fix/audit-critical-high`

Observacao de estado inicial:

- O `git status` nao estava limpo antes da branch porque este proprio arquivo `AUDITORIA_HUNTER_PRO.md` havia sido criado na etapa anterior e ainda estava sem versionamento.
- O arquivo foi preservado porque e a base documental desta fase.

### Correcoes aplicadas

1. Stripe / cobranca
   - Criada fonte central de status em `lib/billing-status.ts`.
   - `PAST_DUE` agora mapeia `access_status` para `suspended`, valor aceito pelo sistema.
   - `subscription_status` continua registrando `PAST_DUE`.
   - `access-control` tambem bloqueia organizacao com `subscription_status === "PAST_DUE"`.
   - O valor invalido `overdue` foi removido do webhook Stripe.

2. Proxy seguro
   - `proxy.ts` agora falha fechado em rotas privadas quando `NEXT_PUBLIC_SUPABASE_URL` ou `NEXT_PUBLIC_SUPABASE_ANON_KEY` estao ausentes.
   - Rotas publicas continuam acessiveis.
   - A resposta para rota privada mal configurada e `503` com mensagem generica, sem segredo.
   - O erro real fica no log do servidor.

3. Dependencias vulneraveis
   - Next foi atualizado para `16.2.12`.
   - `eslint-config-next` foi atualizado para `16.2.12`.
   - `sharp@0.35.3` foi adicionado como dependencia direta.
   - `brace-expansion` foi tratado por `npm audit fix` e override.
   - Permanece pendencia do `sharp` interno empacotado no `next`; o npm so oferece resolver com `npm audit fix --force`, que faria downgrade para Next 14.2.35. Esse downgrade foi recusado por risco de quebra.

4. Convites de usuarios
   - `organization_members` passa a usar `PENDING` para convite ainda nao aceito.
   - Membro pendente nao passa pelos filtros que exigem `ACTIVE`.
   - O callback do Supabase valida convite, e-mail, expiracao e ativa o membro somente apos sessao autenticada.
   - Convite expirado ou de outro e-mail redireciona para `/convite-expirado`.
   - Foram criadas migrations novas:
     - `0015_audit_critical_high_fixes.sql`
     - `0016_audit_member_status_backfill.sql`

5. Cron de lembretes
   - O cron agora verifica:
     - `organization.status`;
     - `access_status`;
     - `subscription_status`;
     - status do agendamento;
     - consentimento de WhatsApp;
     - telefone minimo valido;
     - janela de silencio;
     - timezone da organizacao.
   - Lembretes invalidos sao marcados como `SKIPPED` com motivo.

6. Timezone de agenda
   - O calculo de disponibilidade agora converte horarios locais da organizacao para UTC explicitamente.
   - Fallback alterado para `America/Fortaleza`.
   - O calculo deixa de depender implicitamente do timezone do servidor.

7. Google Calendar Busy
   - A rota publica de disponibilidade agora chama `getGoogleCalendarBusyTimes`.
   - A camada identifica conexoes Google ativas e nao trava a vitrine se credenciais/token resolver nao estiverem disponiveis.
   - Nao foram simulados eventos busy falsos.
   - A integracao real de OAuth/token resolver segue pendente de credenciais e armazenamento seguro do token.

8. Login com `next`
   - Criado utilitario `lib/safe-redirect.ts`.
   - O login agora preserva `/login?next=rota-original`.
   - Redirecionamentos externos, `//`, quebras de linha e valores invalidos caem no fallback `/dashboard`.

9. Modulos placeholder
   - Criado `requireEnabledOrganizationModuleAccess`.
   - Rotas de modulos desativados agora redirecionam contas comuns para dashboard em vez de exibir uma tela que pareca funcionalidade pronta.
   - Codigo nao foi apagado.

10. Documentacao
    - README e AGENTS foram atualizados para remover a recomendacao antiga de React Hook Form.
    - O padrao documentado passa a ser Server Actions com Zod.
    - README recebeu status de membros e regra `PAST_DUE`.

### Arquivos principais alterados

- `proxy.ts`
- `app/api/webhooks/stripe/route.ts`
- `app/api/cron/reminders/route.ts`
- `app/api/public/availability/route.ts`
- `app/(public)/auth/callback/route.ts`
- `app/(public)/login/page.tsx`
- `features/organizations/access-control.ts`
- `features/organizations/guards.ts`
- `features/users/actions.ts`
- `features/auth/actions.ts`
- `features/billing/plan-limits.ts`
- `features/scheduling/availability.ts`
- `features/scheduling/google-busy.ts`
- `lib/billing-status.ts`
- `lib/safe-redirect.ts`
- `README.md`
- `AGENTS.md`
- scripts locais de teste.

### Validacao final desta fase

- `npm.cmd run lint`: aprovado.
- `npm.cmd run typecheck`: aprovado.
- `npm.cmd test`: aprovado.
- `npm.cmd run build`: aprovado.
- `npm.cmd audit --audit-level=moderate`: reprovado por 2 vulnerabilidades altas relacionadas ao `sharp` interno do Next.

Resultado do build final:

- Next.js `16.2.12`.
- Compilacao concluida com sucesso.
- Build compilou em 40s.
- TypeScript no build concluiu em 32.3s.
- 43 paginas estaticas geradas.

### Pendencias ainda reais

1. `npm audit` ainda acusa `next -> sharp@0.34.5`.
   - A correcao automatica exigiria `--force` e downgrade para Next 14.2.35.
   - Recomendacao: aguardar release do Next que atualize o `sharp` interno ou validar manualmente um override suportado oficialmente.

2. Teste real de RLS multiempresa ainda nao foi executado contra um Supabase de teste.
   - Os testes locais continuam estruturais.
   - E necessario ambiente Supabase isolado com usuarios reais de teste para evidenciar vazamento zero.

3. Google Calendar busy esta conectado ao fluxo, mas nao finalizado ponta a ponta.
   - Falta resolvedor seguro de token OAuth e credenciais reais.
   - O sistema nao simula eventos falsos.

4. Vitrine publica nao foi re-medida em producao apos deploy.
   - As mudancas locais ainda precisam ser publicadas para medir antes/depois real no dominio.

### Recomendacao final desta fase

Status: aprovado com ressalvas.

Os principais bloqueadores de logica foram corrigidos localmente e validados por lint, typecheck, testes e build. O sistema ainda nao deve ser declarado aprovado para producao comercial ampla enquanto `npm audit` permanecer com vulnerabilidade alta e enquanto o teste real de RLS multiempresa nao for executado em ambiente Supabase de teste.
