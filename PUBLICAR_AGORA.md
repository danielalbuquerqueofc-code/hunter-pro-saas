# Publicar o Hunter Pro agora

Este projeto e um app Next.js com Supabase. Ele deve ser publicado na Vercel, e o dominio da Hostinger deve apontar para a Vercel.

## 1. Antes de publicar

Confirme que a migration `0007_panel_onboarding_settings.sql` ja rodou no Supabase.

No Supabase, em `Authentication > URL Configuration`, deixe:

```txt
Site URL:
https://prospectorads.com

Redirect URLs:
https://prospectorads.com/**
https://www.prospectorads.com/**
http://localhost:3000/**
http://localhost:3001/**
```

## 2. Variaveis que vao na Vercel

Na Vercel, em `Project Settings > Environment Variables`, cadastre:

```env
NEXT_PUBLIC_SUPABASE_URL=https://stjmgporrsnhaudzmwvf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_publicavel
SUPABASE_SERVICE_ROLE_KEY=sua_chave_secreta
NEXT_PUBLIC_APP_URL=https://prospectorads.com
```

Nunca coloque `SUPABASE_SERVICE_ROLE_KEY` em prints, GitHub publico, HTML ou codigo de navegador.

## 3. Como publicar na Vercel

1. Crie uma conta em `https://vercel.com`.
2. Crie ou conecte uma conta do GitHub.
3. Crie um repositorio privado chamado `hunter-pro-saas`.
4. Envie os arquivos deste projeto para o repositorio.
5. Na Vercel, clique em `Add New > Project`.
6. Importe o repositorio `hunter-pro-saas`.
7. Em `Environment Variables`, cole as variaveis do passo 2.
8. Clique em `Deploy`.

Arquivos que nao devem ser enviados:

```txt
.env.local
.env
node_modules
.next
```

Eles ja estao protegidos no `.gitignore`.

## 4. Domínio Hostinger

Depois que a Vercel gerar um link funcionando:

1. Na Vercel, abra o projeto.
2. Va em `Settings > Domains`.
3. Adicione:

```txt
prospectorads.com
www.prospectorads.com
```

4. A Vercel vai mostrar os registros DNS.
5. Na Hostinger, abra a zona DNS do dominio.
6. Aplique exatamente os registros que a Vercel mostrar.

Normalmente fica parecido com:

```txt
A      @      76.76.21.21
CNAME  www    cname.vercel-dns.com
```

Mas use o que aparecer na sua tela da Vercel.

## 5. Teste final

Depois de publicar, teste nesta ordem:

1. `https://prospectorads.com/login`
2. Cadastro de usuario.
3. Login.
4. Criar empresa.
5. Dashboard.
6. CRM.
7. Agenda.
8. Vitrine publica em `/p/slug-da-empresa`.
9. Agendamento publico em `/agendar/slug-da-empresa`.
10. Logout e tentativa de acessar rota privada.

Se tudo funcionar, o MVP SaaS esta online.
