# Relatorio - Vitrine Publica, Agenda e Automacoes Hunter Pro

## Diagnostico inicial

A vitrine publica fica em `/p/[slug]`, com alias em `/p/[slug]/company`. O fluxo usava `features/showcase/public-storefront.tsx`, `features/showcase/queries.ts` e enviava o agendamento por `features/appointments/actions.ts`.

Antes desta etapa, a vitrine ja exibia empresa, servicos, profissionais, galeria, links e formulario de agendamento. Porem, a disponibilidade ainda precisava de uma regra operacional mais forte: horarios nao deveriam ser digitados livremente, conflitos precisavam ser validados no servidor, faltava reserva temporaria, margem entre atendimentos, rotina de lembretes e uma estrutura preparada para Google Calendar e WhatsApp oficial.

## Arquitetura da disponibilidade

Foi criada uma camada propria em `features/scheduling/availability.ts`. Ela calcula os horarios disponiveis a partir de:

- empresa;
- servico;
- profissional;
- turnos de trabalho;
- bloqueios;
- agendamentos existentes;
- reservas temporarias;
- eventos ocupados do Google Calendar, quando conectados;
- fuso horario;
- antecedencia minima;
- limite maximo de dias futuros;
- margem entre atendimentos;
- modo de grade.

A vitrine publica nao consulta mais dados sensiveis de agendamentos diretamente. Ela usa a funcao segura `get_public_busy_times`, que retorna apenas inicio, fim, profissional e tipo do bloqueio.

## Algoritmo de horarios

O cliente escolhe servico, profissional ou qualquer profissional, e data. Depois disso, a rota `/api/public/availability` calcula os horarios no backend.

Cada horario so aparece quando o atendimento cabe integralmente dentro de um unico turno. Se houver turno das 08:00 as 12:00 e outro das 13:00 as 17:00, o sistema nao atravessa o almoco.

Tambem sao bloqueados conflitos totais e parciais. Se um atendimento ocupa de 09:00 a 09:45, nenhum outro pode comecar, terminar, atravessar ou conter esse periodo.

## Regra de margem

A margem padrao entre atendimentos foi definida como 10 minutos.

O calculo usado e:

`duracao ocupada = margem antes + duracao do servico + margem depois`

Quando a empresa nao configurar nada, a margem depois do servico usa 10 minutos. Exemplo: um servico exibido ao cliente como 35 minutos ocupa 45 minutos internamente.

## Grade de horarios

Foram preparados dois modos:

- `FIXED_GRID`: horarios em grade fixa, como 08:00, 08:15, 08:30.
- `SEQUENTIAL_BLOCKS`: o proximo horario comeca apos a duracao total ocupada.

A empresa configura isso na tela de agenda.

## Estrutura de turnos

Os turnos continuam usando `availability_rules`, agora com suporte operacional a multiplos periodos no mesmo dia. Para representar almoco, o correto e cadastrar dois turnos separados, por exemplo:

- 08:00 as 12:00;
- 13:00 as 17:00.

## Reservas temporarias

Foi criada a tabela `appointment_holds`. Quando o cliente avanca para a etapa final, o sistema segura o horario por 5 minutos.

Campos principais:

- empresa;
- profissional;
- servico;
- inicio e fim;
- periodo ocupado;
- validade;
- token de sessao;
- status.

Se o cliente abandona o fluxo, a reserva expira. Se outro cliente tentar confirmar o mesmo periodo, o banco bloqueia o conflito.

## Protecao contra concorrencia

A funcao `confirm_public_appointment_from_hold` confirma o agendamento dentro do banco, usando bloqueio por empresa e profissional. Antes de salvar, ela recalcula conflito e valida que a reserva pertence a sessao correta.

Isso evita que duas pessoas reservem o mesmo horario ao mesmo tempo.

## WhatsApp

Foi criada uma camada backend para envio por provedor oficial ou autorizado.

Arquivos principais:

- `app/api/cron/reminders/route.ts`
- tabelas `reminder_jobs` e `whatsapp_message_deliveries`

O sistema nao abre WhatsApp no navegador como automacao. Ele so envia de verdade quando existirem as variaveis:

- `WHATSAPP_PROVIDER_URL`
- `WHATSAPP_PROVIDER_TOKEN`

Sem essas credenciais, o job marca o envio como `skipped`, preservando o agendamento e registrando o motivo.

## Google Calendar

A estrutura de banco foi preparada para OAuth e sincronizacao:

- `google_calendar_connections`;
- colunas de sincronizacao em `appointments`;
- calendario por profissional;
- status de conexao exibido na agenda;
- disponibilidade preparada para considerar eventos externos ocupados.

Importante: o e-mail cadastrado nao autoriza acesso ao Google Calendar. Ainda e necessario conectar uma conta Google por OAuth e configurar as credenciais oficiais do Google. Sem OAuth, o sistema nao tenta acessar calendario privado.

## Rotina de lembretes

Foi criada a rota agendada:

`/api/cron/reminders`

Ela processa lembretes vencidos, respeita idempotencia, evita duplicidade, registra tentativas, falhas e mensagens enviadas. O arquivo `vercel.json` configura execucao recorrente.

Variavel obrigatoria:

- `CRON_SECRET`

## Tabelas e migrations criadas

Migration:

- `supabase/migrations/0011_scheduling_availability_automations.sql`

Ela adiciona:

- configuracoes de agenda em `organizations`;
- margens em `services`;
- configuracoes em `professionals`;
- `appointment_holds`;
- `appointment_history`;
- `message_templates`;
- `reminder_rules`;
- `reminder_jobs`;
- `whatsapp_message_deliveries`;
- `google_calendar_connections`;
- funcoes publicas seguras para reserva, confirmacao e horarios ocupados.

## Tela operacional

A tela `/agenda` recebeu:

- configuracao de margem;
- antecedencia minima;
- limite futuro;
- intervalo da grade;
- modo de horarios;
- confirmacao automatica ou manual;
- janela de silencio;
- bloqueios, folgas, feriados e pausas;
- status de integracoes Google Calendar e WhatsApp.

## Fluxo publico de agendamento

O fluxo agora e:

1. cliente escolhe servico e profissional;
2. sistema busca horarios reais no backend;
3. cliente escolhe data e horario;
4. sistema cria uma reserva temporaria;
5. cliente informa nome, WhatsApp, e-mail e observacoes;
6. banco confirma a reserva e cria o agendamento;
7. tela final mostra o status real;
8. lembrete imediato fica registrado para envio pelo job.

## Tela final

A pagina `/agendamento-recebido` foi refeita para buscar o resumo por token publico seguro.

Quando confirmado automaticamente, mostra:

- empresa;
- servico;
- profissional;
- data;
- horario;
- duracao;
- status;
- botao para voltar a vitrine;
- botao de WhatsApp quando configurado.

## Seguranca e LGPD

- A vitrine publica nao recebe detalhes internos de agenda.
- Reservas temporarias usam token de sessao.
- Links publicos usam token nao sequencial.
- Textos personalizados continuam sem HTML arbitrario.
- WhatsApp transacional exige consentimento no formulario.
- Campanhas promocionais nao sao autorizadas automaticamente pelo agendamento.
- A service role foi isolada em cliente de servidor.

## Variaveis de ambiente necessarias

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `CRON_SECRET`
- `WHATSAPP_PROVIDER_URL`
- `WHATSAPP_PROVIDER_TOKEN`

Para Google Calendar, ainda serao necessarias credenciais OAuth oficiais do Google quando a conexao for ativada.

## Arquivos alterados

- `app/(app)/agenda/page.tsx`
- `app/(app)/servicos/page.tsx`
- `app/(public)/agendamento-recebido/page.tsx`
- `app/(public)/p/[slug]/page.tsx`
- `app/api/public/availability/route.ts`
- `app/api/public/holds/route.ts`
- `app/api/cron/reminders/route.ts`
- `features/appointments/actions.ts`
- `features/appointments/queries.ts`
- `features/organizations/current.ts`
- `features/scheduling/availability.ts`
- `features/services/actions.ts`
- `features/services/service-forms.tsx`
- `features/showcase/public-storefront.tsx`
- `features/showcase/queries.ts`
- `lib/env.ts`
- `lib/supabase/admin.ts`
- `lib/validations/service.ts`
- `package.json`
- `scripts/public-showcase-tests.mjs`
- `scripts/scheduling-tests.mjs`
- `supabase/migrations/0011_scheduling_availability_automations.sql`
- `vercel.json`

## Testes executados

- `npm.cmd run lint`: passou.
- `npm.cmd run typecheck`: passou.
- `npm.cmd test`: passou.
- `npm.cmd run build`: passou.

## Falhas conhecidas e pendencias

- Envio real por WhatsApp depende de provedor oficial configurado.
- Google Calendar real depende de OAuth e credenciais do Google.
- A rotina de cron a cada 5 minutos pode exigir plano Vercel compativel.
- Ainda e recomendavel adicionar uma tela dedicada para conectar Google por OAuth.
- Ainda e recomendavel adicionar uma tela dedicada para editar modelos de mensagem.

## Instrucoes para conectar o WhatsApp

1. Contratar ou configurar um provedor oficial/autorizado de WhatsApp.
2. Obter URL de envio e token.
3. Configurar `WHATSAPP_PROVIDER_URL` e `WHATSAPP_PROVIDER_TOKEN`.
4. Fazer um agendamento de teste.
5. Verificar `whatsapp_message_deliveries`.

## Instrucoes para conectar o Google

1. Criar credenciais OAuth no Google Cloud.
2. Configurar URL de callback no dominio do sistema.
3. Salvar tokens por empresa ou profissional em `google_calendar_connections`.
4. Escolher o calendario que bloqueia disponibilidade.
5. Testar criacao de evento e leitura de horarios ocupados.

## Recomendacoes futuras

- Criar UI completa de conexao Google Calendar.
- Criar UI completa de modelos de mensagens.
- Adicionar painel de logs de automacao.
- Adicionar captcha invisivel ou rate limit publico.
- Criar politicas de retencao de logs para LGPD.
- Criar relatorio de falhas por integracao.
