# Bugs e Pendencias Hunter Pro

Data: 21/07/2026

## Bugs corrigidos

| Titulo | Severidade | Modulo | Causa raiz | Correcao | Arquivo | Teste | Status |
|---|---|---|---|---|---|---|---|
| Busca global apontava para CRM | Medio | Shell | Acao enviava para `/crm` e usava texto antigo | Direcionada para `/clientes` com texto mais coerente | `components/shell/global-search.tsx` | Lint, typecheck, test, build | Corrigido |
| Filtros de clientes eram visuais | Medio | Clientes | Chips sem query nem acao real | Filtros viraram links com `q` e `filtro` | `app/(app)/clientes/page.tsx` | Lint, typecheck, test, build | Corrigido |
| Atalhos de telefone/WhatsApp quebrados | Medio | Clientes | Links `#` quando cliente nao tinha telefone | Renderizacao desabilitada e acessivel quando nao ha telefone | `app/(app)/clientes/page.tsx` | Lint, typecheck, test, build | Corrigido |
| Indicador falso de notificacao | Baixo | Shell | Ponto visual fixo sugeria alerta inexistente | Remocao do indicador fake | `components/shell/notification-center.tsx` | Lint, typecheck, test, build | Corrigido |
| Links sociais sem destino na vitrine studio | Medio | Vitrine digital | `href="#"` para links nao configurados | Componente `SocialPreviewLink` com estado desabilitado | `components/showcase/showcase-studio.tsx` | Lint, typecheck, test, build | Corrigido |
| Texto com acento quebrado | Baixo | Vitrine digital | Encoding antigo exibindo mojibake | Ajustado para texto ASCII seguro | `components/showcase/showcase-studio.tsx` | Lint, typecheck, test, build | Corrigido |

## Pendencias funcionais

| Titulo | Severidade | Modulo | Motivo | Acao recomendada | Status |
|---|---|---|---|---|---|
| Modulos placeholder ainda existem | Alto | SaaS | Algumas rotas estao preparadas, mas nao entregam fluxo completo | Finalizar antes de vender como plataforma completa | Pendente |
| Aliases antigos no Vercel | Medio | Deploy | Dominios antigos ainda apontam para o projeto | Remover aliases antigos quando o dominio oficial estiver validado | Pendente |
| DNS Hostinger | Alto | Infra | O dominio comercial depende do apontamento correto | Confirmar A record `@ -> 76.76.21.21` e dominio final | Pendente externo |
| URLs do Supabase Auth | Alto | Auth | Convites e reset precisam apontar para dominio final | Ajustar Site URL e Redirect URLs no Supabase | Pendente externo |
| Asaas real | Alto | Pagamentos | Exige credenciais e webhook real | Configurar ambiente e validar webhook em producao | Pendente externo |
| WhatsApp oficial | Alto | Comunicacao | Exige provedor oficial e tokens reais | Configurar provider, templates, retries e logs | Pendente externo |
| Google Calendar OAuth | Alto | Agenda | Exige consentimento OAuth por empresa/profissional | Configurar credenciais Google e fluxo de autorizacao | Pendente externo |
| 2FA e sessoes ativas | Medio | Seguranca | Recurso planejado, nao totalmente validado na auditoria | Implementar tela operacional e testes | Pendente |

## Observacoes de seguranca

- Nao foram alteradas RLS, migrations antigas, autenticao ou regras de negocio.
- A auditoria manteve isolamento multiempresa existente e nao removeu estruturas de seguranca.
- Endpoints e integracoes externas precisam de testes com credenciais reais antes de venda em escala.
