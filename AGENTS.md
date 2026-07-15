# Regras permanentes do projeto Hunter Pro SaaS

## Produto

Hunter Pro e uma plataforma SaaS multiempresa. Toda decisao tecnica deve preservar isolamento entre organizacoes.

## Multi-tenant

- Toda tabela operacional deve ter `organization_id`.
- Nenhuma consulta privada deve retornar dados de outra organizacao.
- RLS e obrigatorio no Supabase.
- O frontend melhora a experiencia, mas nao e barreira de seguranca.
- Nunca confiar em `organization_id` enviado livremente pelo frontend.
- A organizacao ativa deve ser validada no servidor pelo usuario autenticado e por `organization_members`.
- Um usuario pode futuramente participar de mais de uma organizacao.

## Permissoes

Papeis:

- `SUPER_ADMIN`
- `OWNER`
- `ADMIN`
- `MANAGER`
- `SALES`
- `ATTENDANT`
- `PROFESSIONAL`
- `FINANCIAL`

Permissoes devem ser verificadas por organizacao.

## Implementacao

- Usar Next.js App Router.
- Usar TypeScript.
- Usar Zod para validacao.
- Usar React Hook Form para formularios.
- Usar shadcn/ui para componentes base.
- Usar Tailwind CSS para estilo.
- Criar componentes pequenos e reutilizaveis.
- Evitar implementar modulos futuros antes da fase definida.
- Nao misturar mocks com dados reais; dados demonstrativos devem ficar em fixtures/camadas temporarias.
- Toda funcionalidade deve possuir estados de loading, erro e vazio.
- Toda pagina deve ser responsiva.

## Banco

- Criar migrations incrementais.
- Toda migration deve ser reversivel quando possivel.
- RLS deve ser criada junto das tabelas.
- Criar indices para `organization_id`, datas, status e chaves usadas em filtros.
- Criar audit logs para acoes administrativas importantes.
- Nao criar tabelas duplicadas.
- Nao alterar migrations antigas em producao.
- Novas mudancas de banco devem usar novas migrations.

## UI

- Visual premium e moderno.
- Paleta principal: preto `#0B0B0B`, chumbo `#18181B`, laranja `#F74E14`, branco `#FFFFFF`, cinza claro `#F4F4F5`.
- Sidebar lateral.
- Dashboard com cards objetivos.
- Estados vazios, loading, erro e sucesso.
- Responsivo para mobile.
- Tema claro e escuro preparado.

## Seguranca

- Nunca colocar chaves secretas no frontend.
- Nunca expor `service_role` no cliente.
- Nunca confiar apenas em filtros do frontend.
- Proteger rotas privadas.
- Preparar o projeto para LGPD.
- Validar entrada de formularios com Zod.
- Toda funcionalidade deve respeitar permissoes.
- Executar lint, typecheck e build antes de concluir entregas relevantes.

## Fases

Nao implementar tudo de uma vez. A primeira fase cobre somente base do projeto, auth, organizacoes, membros, permissoes, layout e dashboard inicial.
