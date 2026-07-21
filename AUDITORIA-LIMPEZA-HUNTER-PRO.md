# Auditoria e Limpeza Hunter Pro

Data: 21/07/2026

## Mapa resumido

- Framework: Next.js App Router com React.
- Frontend: `app`, `components`, `features`.
- Backend: Server Actions em `features/*/actions.ts` e Route Handlers em `app/api`.
- Banco: Supabase Postgres, migrations em `supabase/migrations`.
- Auth: Supabase Auth com SSR via `@supabase/ssr` e protecao de rotas em `proxy.ts`.
- APIs: disponibilidade publica, reservas temporarias, cron de lembretes, webhooks Asaas e Stripe.
- PWA: `app/manifest.ts`, `public/sw.js`, `components/pwa/pwa-register.tsx`, icones em `public/icons`.
- Integracoes preparadas: Supabase, Asaas, Stripe, WhatsApp provider, Google Calendar OAuth, PWA.
- Arquivos analisados na varredura inicial: 207.
- Paginas App Router: 42.
- APIs: 5.
- Componentes TS/TSX em `components`: 44 antes da limpeza.
- Arquivos em `features`: 39 antes da limpeza.
- Migrations: 14.

## Arquivos removidos

| Arquivo | Status | Motivo | Uso encontrado | Acao tomada | Risco | Teste |
|---|---|---|---|---|---|---|
| `components/layout/app-sidebar.tsx` | Seguro remover | Sidebar antigo duplicado; o shell atual usa `components/shell/app-sidebar.tsx` | Nenhum import encontrado por busca global | Removido | Baixo | Lint, typecheck, test, build |
| `features/showcase/showcase-forms.tsx` | Seguro remover | Formulario antigo substituido por `components/showcase/showcase-studio.tsx` | Nenhum import encontrado; exports isolados | Removido | Baixo | Lint, typecheck, test, build |

## Dependencias removidas

| Dependencia | Status | Motivo | Evidencia | Acao | Teste |
|---|---|---|---|---|---|
| `react-hook-form` | Seguro remover | Sem import no app | Aparecia apenas em manifestos de dependencia | Removida | Lint, typecheck, test, build |
| `@hookform/resolvers` | Seguro remover | Sem import no app | Aparecia apenas em manifestos de dependencia | Removida | Lint, typecheck, test, build |

## Itens mantidos

| Item | Status | Motivo |
|---|---|---|
| `supabase/migrations/*.sql` | Manter | Historico e reconstrucao do banco; nao remover sem backup e diff do banco real. |
| `components/states/error-state.tsx` | Manter | Componente generico reutilizavel. |
| `components/states/loading-skeleton.tsx` | Manter | Componente generico reutilizavel. |
| `components/dashboard/ai-alerts.tsx` | Revisar depois | Sem uso direto atual, mas pertence ao roadmap de IA. |
| `components/forms/storage-image-upload.tsx` | Manter | Usado em configuracoes e minha conta. |
| `public/icons/*` | Manter | Necessario para PWA. |
| `public/sw.js` | Manter | Necessario para PWA. |

## Rotas e modulos incompletos mantidos

As rotas abaixo existem como placeholders ou modulos desativados em `lib/modules.ts`. Nao foram removidas porque fazem parte do roadmap comercial:

- `/leads`
- `/pipeline`
- `/conversas`
- `/orcamentos`
- `/orcamentos/[id]`
- `/vendas`
- `/avaliacoes`
- `/ia-sdr`
- `/clientes/[id]`

Status: revisar antes de vender como funcionalidade completa.

## Arquivos antigos e temporarios

- Nao foram encontrados `.old`, `.bak`, `.tmp` ou logs versionados relevantes fora de `.next` e `node_modules`.
- `.next` e `node_modules` sao gerados localmente e nao devem ser versionados.
- `.env.local` esta ignorado por `.gitignore`.

## Observacoes

- `npm ls --depth=0` ainda lista `@emnapi/wasi-threads` como extraneous no `node_modules`, mesmo apos `npm prune`. Como nao esta no `package.json` nem no codigo versionado, foi tratado como artefato local do ambiente.
- Nao houve remocao de migrations, assets de PWA, rotas planejadas ou componentes genericos sem confirmar impacto.

## Resultado

- Arquivos analisados: 207.
- Arquivos removidos: 2.
- Dependencias removidas: 2.
- Imports quebrados apos validacao: 0.
- Build: aprovado.
