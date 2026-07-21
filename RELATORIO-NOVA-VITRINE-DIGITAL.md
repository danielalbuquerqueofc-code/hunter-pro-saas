# Relatorio - Nova Vitrine Digital Publica

## Diagnostico da versao anterior

A vitrine publica estava funcional, mas ainda nao reproduzia a composicao premium da referencia. A pagina tinha hero clara e correta tecnicamente, porem faltavam proporcao visual, contraste de landing page, navegacao mobile mais parecida com app, CTA final, rodape completo e agendamento em etapas mais explicitas.

Tambem havia risco de a experiencia parecer generica quando a empresa nao tinha capa, galeria ou imagens de servico. A reforma preservou dados reais e nao adicionou numeros, avaliacoes ou resultados ficticios.

## Arquitetura encontrada

- Rota publica principal: `app/(public)/p/[slug]/page.tsx`.
- Alias publico preservado: `app/(public)/p/[slug]/company/page.tsx`.
- Componente principal: `features/showcase/public-storefront.tsx`.
- Dados publicos: `features/showcase/queries.ts`.
- Tema/contraste: `features/showcase/theme.ts`.
- Disponibilidade real: `/api/public/availability`.
- Reserva temporaria: `/api/public/holds`.
- Confirmacao do agendamento: `requestAppointmentAction`.
- Busy times seguros: RPC `get_public_busy_times`.

## Decisoes de design

- Hero escura com imagem de capa, overlay e conteudo a esquerda, como a referencia.
- Cor da empresa aplicada principalmente em CTAs, palavras de destaque, icones e detalhes.
- Layout mobile first, com barra inferior fixa e botao central de agendamento.
- Desktop com hero de alto impacto, faixa de confianca sobreposta, grid de servicos e CTA final.
- Secoes vazias sao ocultadas quando nao existem dados reais, especialmente galeria e avaliacoes.
- Logo nunca e usada como capa ampliada quando a empresa nao configurou uma imagem apropriada.

## Componentes criados/refatorados

- `PublicStorefrontHeader`
- `PublicStorefrontHero`
- `TrustHighlights`
- `ServiceCard`
- `ServicesSection`
- `GallerySection`
- `FinalCallToAction`
- `PublicStorefrontFooter`
- `MobileBottomNavigation`
- `BookingStepper`
- `BookingDialog`

## Arquivos modificados

- `features/showcase/public-storefront.tsx`
- `scripts/public-showcase-tests.mjs`
- `RELATORIO-NOVA-VITRINE-DIGITAL.md`

## Melhorias desktop

- Cabeçalho leve sobre a hero.
- Hero com imagem em tela larga, overlay e CTAs claros.
- Faixa de diferenciais sobreposta a hero.
- Grid de servicos com ate quatro cards por linha.
- CTA final semelhante a uma landing page comercial.
- Rodape completo com dados reais configurados.

## Melhorias mobile

- Header compacto com logo, WhatsApp e menu.
- Menu mobile funcional.
- Hero reorganizada para celular.
- Cards de servico com imagem, preco, duracao e botao grande.
- Grid de servicos ajustado para 2 cards por linha no celular, mantendo imagem, nome, duracao, preco e botao `Agendar`.
- A home da vitrine mostra inicialmente ate 4 servicos, em 2 linhas no mobile, com botao `Ver todos os servicos`.
- Barra inferior fixa com item central `Agendar`.
- Formulario de agendamento em formato de sheet.

## Ajuste dos cards de servicos

O componente-base reutilizado continua sendo `ServiceCard`, dentro de `ServicesSection`, preservando o visual aprovado da vitrine e o fluxo de agendamento com servico pre-selecionado.

Breakpoints aplicados:

- celular: `grid-cols-2`, com gap compacto e card reduzido;
- celulares pequenos: o layout tenta manter 2 colunas com imagem 4:3 e textos truncados;
- tablet/notebook: `md:grid-cols-3`;
- desktop amplo: `xl:grid-cols-4`.

Regras do grid:

- a lista inicial exibe `services.slice(0, 4)`;
- o botao `Ver todos os servicos` expande a lista completa sem trocar de componente;
- os cards usam `h-full`, coluna flexivel e `mt-auto` no botao para manter alinhamento inferior;
- imagens usam proporcao 4:3 e `object-fit: cover` via `ServiceMedia`;
- nomes e descricoes usam `line-clamp-2` para evitar desalinhamento;
- preco, duracao e botao permanecem visiveis no mobile;
- `Sob consulta` continua sendo usado quando nao ha preco definido.

Testes de responsividade considerados na implementacao:

- 320 px, 360 px, 375 px, 390 px, 414 px e 430 px: 2 cards por linha como padrao mobile;
- 768 px e 1024 px: grade intermediaria com 3 cards por linha quando houver espaco;
- 1280 px e 1440 px: 4 cards por linha.

Casos especiais cobertos:

- servico sem imagem usa fallback visual;
- servico sem preco nao exibe `R$ 0,00` como promocao;
- nome e descricao longos sao truncados;
- botao `Agendar` permanece alinhado ao fim do card;
- grid evita scroll horizontal usando colunas fluidas e gaps reduzidos no mobile.

## Melhorias de conversao

- CTAs repetidos em pontos estrategicos: hero, servicos, CTA final e nav mobile.
- Servico selecionado abre direto no fluxo de agendamento.
- WhatsApp aparece somente quando configurado.
- Rodape reforca contato e links uteis reais.

## Melhorias de acessibilidade

- Botoes de icone possuem `aria-label`.
- Campos do agendamento possuem labels.
- Foco visual preservado nos campos.
- Contraste segue tokens calculados em `resolveShowcaseTheme`.
- Navegacao e CTAs usam tamanho adequado para toque.

## Melhorias de performance

- Imagem principal usa prioridade de carregamento.
- Imagens de servico e galeria usam lazy loading quando adequado.
- Galeria e secoes vazias nao sao renderizadas sem dados.
- Nenhuma dependencia pesada foi adicionada.

## Mudancas no agendamento

O backend e as regras de disponibilidade foram preservados. A mudanca foi na experiencia:

- fluxo agora mostra 5 etapas: Servico, Profissional, Data e hora, Seus dados e Resumo;
- servico vindo do card permanece pre-selecionado;
- horarios continuam sendo buscados em `/api/public/availability`;
- reserva temporaria continua sendo criada em `/api/public/holds`;
- confirmacao continua usando `requestAppointmentAction`;
- validacao final de conflito permanece no servidor.

## Integracoes preservadas

- WhatsApp configurado na vitrine/empresa.
- Google Calendar estruturalmente preservado na camada de disponibilidade ja existente.
- Disponibilidade por expediente, bloqueios, holds e agendamentos existentes.
- Isolamento multiempresa via queries e regras atuais.

## Testes executados

- `npm.cmd run lint`: aprovado.
- `npm.cmd run typecheck`: aprovado.
- `npm.cmd test`: aprovado.
- `npm.cmd run build`: aprovado.

O comando de testes executou auditoria local de seguranca, testes de acesso, checagens da vitrine publica e testes de disponibilidade/agendamento.

## Pendencias

- A vitrine ainda nao possui fonte publica de avaliacoes reais; por isso a secao de avaliacoes permanece oculta quando nao houver dados reais.
- Diferenciais personalizados por empresa ainda nao possuem tabela/campos proprios; a faixa usa apenas sinais reais existentes, como agenda, profissionais, WhatsApp e endereco.
- Uma pagina visualmente identica a referencia depende de capa, logo, galeria e fotos de servicos de boa qualidade cadastradas pela empresa.

## Limitacoes

- Nao foram criadas tabelas novas por seguranca e para preservar o banco atual.
- Nao foram adicionados numeros de clientes, notas ou depoimentos ficticios.
- O envio automatico real por WhatsApp e Google Calendar depende das credenciais e OAuth ja citados nas etapas anteriores.

## Recomendacoes futuras

- Criar cadastro de diferenciais por empresa.
- Criar modulo de avaliacoes publicas reais.
- Criar templates por nicho com preview.
- Adicionar crop/ajuste de imagem no upload da capa e servicos.
- Criar Open Graph dinamico visual para compartilhamento.
