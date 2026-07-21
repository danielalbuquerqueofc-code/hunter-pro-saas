# Correcoes criticas Hunter Pro

Data: 21/07/2026

## Diagnostico

Foram encontrados sete pontos criticos:

- O nome exibido no dashboard vinha do `user_metadata` do Supabase Auth, enquanto a tela Minha conta salvava em `profiles.full_name`.
- Convites e recuperacao de senha podiam redirecionar para URL antiga ou rota inexistente.
- A vitrine podia continuar usando uma cor primaria antiga salva em `primary_color`, mesmo apos trocar o tema visual.
- Os tokens de cor da vitrine nao expunham aliases consistentes para botao, texto, fundo e foco.
- Login e cadastro ainda estavam com visual antigo.
- O app nao possuia manifesto, service worker e icones para instalacao no celular.
- Guias e fallbacks ainda citavam dominios antigos.

## Correcoes aplicadas

### Nome do usuario

- Dashboard agora busca `profiles.full_name`.
- Minha conta tambem sincroniza o nome com `auth.updateUser`.
- Layout do painel passa o nome atualizado para o menu de usuario.
- Rotas afetadas sao revalidadas apos salvar a conta.

### Convites e recuperacao de senha

- Convites agora usam:
  `https://prospectoads.com/auth/callback?next=/definir-senha`
- Recuperacao de senha usa o mesmo callback.
- Criada rota `/auth/callback` para trocar o codigo do Supabase por sessao.
- Criada pagina `/definir-senha`.
- Criada pagina `/recuperar-senha`.
- Criada pagina `/convite-expirado` para links invalidos ou expirados.

### Dominio correto

- Fallbacks e guias foram atualizados para `https://prospectoads.com`.
- Removidas referencias ao dominio pessoal antigo nos guias principais.
- Removida referencia ao dominio antigo escrito como `prospectorads.com` nos pontos criticos de publicacao e vitrine.

### Temas e botoes da vitrine

- O preview da vitrine agora aplica o tema selecionado sem ser travado por `primary_color` legado.
- Ao salvar a vitrine pelo editor atual, o `primary_color` legado e limpo para deixar o tema assumir.
- Foram adicionados tokens seguros como:
  - `--store-primary`
  - `--store-primary-hover`
  - `--store-primary-foreground`
  - `--store-background`
  - `--store-surface`
  - `--store-focus`
- O texto dos botoes e calculado com contraste seguro.

### Login, cadastro e senha

- Login reformulado para a identidade atual do Hunter Pro.
- Cadastro reformulado para a mesma identidade.
- Campo de senha agora possui mostrar/ocultar.
- Erros continuam amigaveis e sem mensagem tecnica para o usuario final.

### PWA e instalacao no celular

- Criado `app/manifest.ts`.
- Criado `public/sw.js`.
- Criados icones:
  - `public/icons/icon-192.png`
  - `public/icons/icon-512.png`
  - `public/icons/maskable-512.png`
  - `public/icons/apple-touch-icon.png`
- Criado componente de instalacao `PwaRegister`.
- Metadados do app foram atualizados com manifest, icones e Apple Web App.

### Cache e estado antigo

- Alteracoes de conta revalidam dashboard e layout.
- Service worker usa versao propria de cache e remove caches antigos.
- Build novo gera nova versao dos assets.

## Arquivos principais alterados

- `app/layout.tsx`
- `app/manifest.ts`
- `app/(app)/dashboard/page.tsx`
- `app/(app)/layout.tsx`
- `app/(app)/vitrine/page.tsx`
- `app/(public)/login/page.tsx`
- `app/(public)/cadastro/page.tsx`
- `app/(public)/auth/callback/route.ts`
- `app/(public)/definir-senha/page.tsx`
- `app/(public)/recuperar-senha/page.tsx`
- `app/(public)/convite-expirado/page.tsx`
- `app/(public)/p/[slug]/page.tsx`
- `components/auth/auth-card.tsx`
- `components/auth/password-field.tsx`
- `components/pwa/pwa-register.tsx`
- `components/shell/app-shell.tsx`
- `components/shell/topbar.tsx`
- `components/shell/user-menu.tsx`
- `components/showcase/showcase-studio.tsx`
- `features/account/actions.ts`
- `features/auth/actions.ts`
- `features/showcase/actions.ts`
- `features/showcase/theme.ts`
- `features/users/actions.ts`
- `lib/env.ts`
- `lib/validations/showcase.ts`
- `public/sw.js`
- `scripts/critical-fixes-tests.mjs`
- `package.json`

## Testes executados

- `npm.cmd run lint`: aprovado.
- `npm.cmd run typecheck`: aprovado.
- `npm.cmd test`: aprovado.
- `npm.cmd run build`: aprovado.
- Deploy Vercel producao: aprovado.
- Build Vercel producao: aprovado.
- URL direta Vercel: respondeu `200 OK`.
- Dominio `https://prospectoads.com`: adicionado na Vercel, mas ainda nao resolve por falta de DNS na Hostinger.

## Configuracao manual obrigatoria no Supabase

No Supabase, ajuste Auth > URL Configuration:

- Site URL: `https://prospectoads.com`
- Redirect URLs:
  - `https://prospectoads.com/**`
  - `http://localhost:3000/**`
  - `http://localhost:3001/**`

Nos templates de e-mail de convite e recuperacao, o botao precisa usar a URL enviada pelo Supabase, normalmente `{{ .ConfirmationURL }}`. Se o template tiver uma URL fixa antiga, o codigo novo nao consegue corrigir isso sozinho.

## Pendencias externas

- Confirmar que `prospectoads.com` esta adicionado ao projeto correto na Vercel.
- Confirmar DNS do dominio apontando para a Vercel.
- Confirmar variavel `NEXT_PUBLIC_APP_URL=https://prospectoads.com` em Production na Vercel.
- Confirmar as Redirect URLs no Supabase.

## Publicacao

- Projeto Vercel: `hunter-pro-saas`.
- URL temporaria direta: `https://hunter-pro-saas-hrafr1i4s-danielalbuquerqueofc-codes-projects.vercel.app`.
- Dominio final configurado na Vercel: `https://prospectoads.com`.
- Apontamento pendente na Hostinger:
  - Tipo: `A`
  - Nome: `@`
  - Valor: `76.76.21.21`

Depois que o DNS propagar, `https://prospectoads.com` passa a abrir o deploy publicado.

## Resultado

As correcoes tecnicas foram aplicadas no codigo e validadas localmente. O sistema esta preparado para usar o dominio final, refletir nome atualizado, aplicar temas com contraste seguro, abrir convites no fluxo correto e ser instalado no celular como app.
