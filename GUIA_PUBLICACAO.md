# Guia de publicacao do Hunter Pro

Este projeto e uma aplicacao Next.js com login, Supabase e paginas dinamicas. Por isso, ele nao deve ser publicado como arquivos HTML soltos na Hostinger. A Hostinger pode continuar sendo usada para o dominio, mas o app precisa rodar em uma hospedagem com suporte a Next.js, como Vercel, Render, Railway ou uma VPS Node.js.

## 1. Rodar a migration 0007 no Supabase

1. Abra o Supabase.
2. Entre no projeto Hunter-Pro.
3. Va em SQL Editor.
4. Abra o arquivo:

```txt
supabase/migrations/0007_panel_onboarding_settings.sql
```

5. Copie todo o conteudo.
6. Cole no SQL Editor.
7. Clique em Run.

Resultado esperado:

```txt
Success. No rows returned
```

Essa migration prepara onboarding, configuracoes da empresa, campos extras da empresa e permissoes RLS.

## 2. Conferir variaveis de ambiente

Na hospedagem online, cadastre estas variaveis:

```env
NEXT_PUBLIC_SUPABASE_URL=https://stjmgporrsnhaudzmwvf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-publicavel
SUPABASE_SERVICE_ROLE_KEY=sua-chave-secreta
NEXT_PUBLIC_APP_URL=https://seudominio.com.br
```

Importante:

- `NEXT_PUBLIC_SUPABASE_ANON_KEY` pode ser a chave publicavel.
- `SUPABASE_SERVICE_ROLE_KEY` nunca deve aparecer no navegador, GitHub publico ou print.
- `NEXT_PUBLIC_APP_URL` deve ser o dominio final do sistema online.

## 3. Publicar na Vercel

Recomendacao para esta fase: Vercel, porque ela roda Next.js com menos configuracao.

Passos:

1. Crie uma conta em https://vercel.com.
2. Clique em Add New Project.
3. Importe o projeto do GitHub.
4. Em Environment Variables, adicione as variaveis do passo 2.
5. Clique em Deploy.

Depois do deploy, a Vercel vai gerar um link parecido com:

```txt
https://hunter-pro.vercel.app
```

Teste:

1. Abra `/login`.
2. Entre com o usuario administrador.
3. Abra `/dashboard`.
4. Abra `/p/slug-da-empresa`.

## 4. Apontar dominio da Hostinger

Depois que a Vercel estiver funcionando:

1. Na Vercel, va em Project Settings.
2. Clique em Domains.
3. Adicione seu dominio, por exemplo:

```txt
danielalbuquerque.com.br
```

4. A Vercel vai mostrar registros DNS.
5. Na Hostinger, va em DNS Zone Editor.
6. Adicione ou ajuste os registros conforme a Vercel pedir.

Normalmente a Vercel pede:

```txt
A     @      76.76.21.21
CNAME www    cname.vercel-dns.com
```

Use exatamente o que aparecer na tela da Vercel, porque pode variar.

## 5. Atualizar URLs no Supabase Auth

No Supabase:

1. Va em Authentication.
2. Va em URL Configuration.
3. Em Site URL, coloque:

```txt
https://danielalbuquerque.com.br
```

4. Em Redirect URLs, adicione:

```txt
https://danielalbuquerque.com.br/**
https://www.danielalbuquerque.com.br/**
```

Se tambem for testar local:

```txt
http://localhost:3000/**
http://localhost:3001/**
```

## 6. Verificacao final

Antes de considerar publicado, teste:

- Cadastro de usuario.
- Login.
- Criacao de empresa.
- Dashboard.
- Vitrine publica `/p/[slug]`.
- Agendamento publico `/agendar/[slug]`.
- Acesso negado para usuario sem permissao.
- Checklist/onboarding salvando progresso.

## 7. Comandos locais de seguranca

Antes de enviar uma nova versao:

```bash
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

Todos precisam terminar sem erro.
