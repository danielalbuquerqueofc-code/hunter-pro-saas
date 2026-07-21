# Checklist de comercializacao - Hunter Pro

## Diagnostico desta rodada

O pedido completo envolve quatro frentes grandes: experiencia da Vitrine Digital, operacao comercial do SaaS, cobranca real e integracoes externas. A auditoria mostrou que a base do produto ja existe, mas alguns recursos ainda precisam de credenciais, autorizacoes OAuth ou contratos com provedores antes de serem vendidos como funcionais.

Nesta rodada foi priorizado o ponto urgente que podia ser corrigido sem credenciais externas: o seletor de temas da Vitrine Digital. O problema principal era que a cor antiga padrao salva no banco podia sobrescrever a cor do tema escolhido. Na pratica, escolher temas como Wellness podia nao alterar a vitrine publica como esperado.

## Corrigido agora

- O tema da Vitrine passou a usar um resolvedor unico em `features/showcase/theme.ts`.
- O estúdio da Vitrine agora usa o mesmo resolvedor visual da pagina publica.
- Foram adicionados tokens novos e seguros como `--theme-primary`, `--theme-bg`, `--theme-card`, `--theme-text` e aliases antigos `--store-*` para preservar o layout atual.
- A cor padrao antiga `#F74E14` nao bloqueia mais o tema selecionado.
- O tema Wellness e os demais temas passam a alterar a identidade visual da vitrine quando nao houver uma cor customizada real.
- A protecao de contraste continua ativa para texto de botoes.
- O painel da Vitrine agora exibe acoes explicitas:
  - Aplicar tema;
  - Salvar alteracoes;
  - Restaurar padrao;
  - Visualizar vitrine;
  - Cancelar alteracoes.
- O preview do painel foi alinhado ao mesmo sistema de cores do link publico.
- O botao global "Novo" sem destino real foi removido do cabecalho padrao do painel. Agora ele so aparece quando uma tela informar uma acao real.
- Os testes locais da vitrine foram ampliados para evitar regressao do tema.

## Preservado

- Layout publico da vitrine.
- Estrutura dos cards de servicos.
- Fluxo de agendamento existente.
- APIs existentes.
- Banco de dados.
- Autenticacao.
- Isolamento multiempresa.
- Uploads ja existentes.
- Disponibilidade/agendamento ja implementados.
- RLS e regras atuais.

## Recursos comerciais ainda pendentes

### Planos e assinatura

Status: parcialmente preparado.

Falta transformar a gestao de planos em uma tela operacional completa para superadmin:

- criar plano;
- editar plano;
- duplicar plano;
- ativar/desativar;
- arquivar;
- excluir apenas quando nao estiver em uso;
- configurar mensal/anual;
- teste gratis;
- limites por plano;
- matriz de funcionalidades;
- plano em destaque;
- ordem de exibicao;
- desconto/cortesia;
- recorrencia.

### Vincular plano a empresa

Status: parcialmente preparado.

Falta tela completa para:

- trocar plano de uma empresa;
- aplicar upgrade;
- aplicar downgrade;
- controlar cortesia;
- controlar inadimplencia;
- exibir alertas de limite;
- bloquear recursos por status.

### Asaas

Status: preparado para credenciais reais.

Foi criada a base de integracao com:

- variaveis `BILLING_PROVIDER`, `ASAAS_ENVIRONMENT`, `ASAAS_API_KEY` e `ASAAS_WEBHOOK_TOKEN`;
- cliente HTTP usando o header oficial `access_token`;
- ambiente sandbox/producao separado;
- criacao de cliente Asaas;
- criacao de assinatura Asaas;
- webhook em `/api/webhooks/asaas`;
- validacao do header `asaas-access-token`;
- idempotencia por evento em `billing_events`;
- atualizacao de assinatura e status da empresa por evento de pagamento;
- migration `0013_asaas_billing_readiness.sql`.

Ainda depende de:

- chave sandbox/producao real no Vercel;
- token real de webhook configurado no painel Asaas;
- teste de homologacao sandbox;
- tela superadmin completa para editar planos sem SQL.

Nao foi criada simulacao de pagamento.

### WhatsApp oficial

Status: camada visual e fluxos de contato existem, mas automacao oficial depende de provedor.

Para comercializar como automacao real, ainda falta:

- escolher provedor oficial/autorizado;
- configurar credenciais;
- templates aprovados;
- consentimento;
- fila de envio;
- historico;
- tentativas;
- idempotencia;
- tela de logs;
- rotina de lembretes.

Redirecionamento para WhatsApp nao deve ser vendido como automacao automatica.

### Google Calendar

Status: estrutura de agenda existe, mas OAuth real ainda precisa ser fechado.

Para comercializar como sincronizacao real, falta:

- OAuth por empresa/profissional;
- escolha de calendario;
- status da conexao;
- teste de sincronizacao;
- reconectar/desconectar;
- criar evento;
- atualizar ao remarcar;
- cancelar evento;
- considerar eventos externos na disponibilidade.

E-mail cadastrado nao autoriza acesso ao Google Calendar.

### Usuarios, convites e seguranca

Status: base criada.

Ainda falta evoluir para operacao completa:

- convite por e-mail com experiencia final polida;
- senha temporaria quando aplicavel;
- tela de permissoes granular;
- sessoes ativas mais completas;
- politicas por perfil;
- auditoria de acoes sensiveis.

### Dados fiscais

Status: pendente.

Falta tela completa para:

- documento;
- razao social;
- nome fantasia;
- inscricao municipal/estadual quando necessario;
- endereco fiscal;
- dados de cobranca.

## Regras de produto antes de vender

- Nenhum botao pode ser apenas visual.
- Nenhuma integracao deve prometer envio automatico sem credencial real.
- Nenhum pagamento deve ser criado sem webhooks e idempotencia.
- Nenhum calendario deve ser sincronizado sem OAuth.
- Nenhuma tela publica deve exibir textos tecnicos ou internos.
- Nenhum recurso multiempresa deve ignorar `organization_id`.
- Toda acao sensivel precisa validar permissao no servidor.

## Validacoes executadas nesta rodada

- `npm.cmd run lint`: aprovado.
- `npm.cmd run typecheck`: aprovado.
- `npm.cmd test`: aprovado.

## Build

- `npm.cmd run build`: aprovado.

## Proximas prioridades recomendadas

1. Fechar Asaas primeiro, porque assinatura e cobranca sustentam a comercializacao.
2. Em seguida, finalizar tela de planos e troca de plano por empresa.
3. Depois, WhatsApp oficial com templates e logs.
4. Depois, Google Calendar OAuth por profissional.
5. Por ultimo, 2FA/sessoes avancadas e auditoria administrativa fina.
