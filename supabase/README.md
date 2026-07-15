# Supabase - Fase 1

Execute a migration `0001_phase_1_core.sql` no SQL Editor do Supabase.

Ela cria:

- usuarios complementares em `profiles`
- empresas em `organizations`
- membros e permissoes em `organization_members`
- planos e assinaturas iniciais
- logs de auditoria
- funcoes auxiliares para RLS
- politicas de isolamento multiempresa

Depois de aplicar, preencha `.env.local` com:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Use somente a chave publica anon/publishable no frontend. A chave `service_role` fica apenas no servidor.
