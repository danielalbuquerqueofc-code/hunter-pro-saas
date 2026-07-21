# Performance Hunter Pro

Data: 21/07/2026

## Medicoes

| Metrica | Antes | Depois | Observacao |
|---|---:|---:|---|
| Compile local do build | 48s | 29.7s | Medido no build local do projeto |
| TypeScript no build | 52s | 33.6s | Medido no build local do projeto |
| Geracao de paginas estaticas | Nao registrado | 43 paginas em 2.8s | Build atual |
| Tamanho `.next` | 488,072,907 bytes | 488,077,130 bytes | Variacao minima; sem ganho de bundle comprovado |
| Pasta `components` | 100,001 bytes | 97,635 bytes | Reducao por remocao de componente antigo |
| Pasta `features` | 230,883 bytes | 227,258 bytes | Reducao por remocao de forms antigos |
| Pasta `app` | 188,279 bytes | 188,218 bytes | Pequena reducao |
| Dependencias removidas | 0 | 2 | `react-hook-form`, `@hookform/resolvers` |
| Vulnerabilidades moderadas ou maiores | 0 | 0 | `npm audit --audit-level=moderate` |

## Maiores chunks observados

| Arquivo | Tamanho aproximado |
|---|---:|
| `40o4efq1agxep.js` | 242 KB |
| `3rxl-jt3pdxgx.js` | 228 KB |
| `1ldhwkdsg700d.js` | 118 KB |
| `0cz1d0mv5g_q7.js` | 113 KB |
| `14mrh2-p_w84d.js` | 55 KB |
| CSS principal | 45 KB |

## Paginas mais sensiveis a lentidao

- Dashboard: concentra cards, consultas e componentes do painel.
- Vitrine publica: imagens, servicos, galeria e agendamento.
- Servicos e agenda: combinam formularios, disponibilidade e dados da empresa.
- Login/cadastro: sensiveis a configuracao externa do Supabase Auth e rede.

## Correcoes aplicadas

- Remocao de dois pacotes nao usados.
- Remocao de dois arquivos antigos sem import.
- Eliminacao de links falsos `#` em areas revisadas.
- Filtros de clientes passaram a operar por query server-side, evitando estado visual sem efeito.
- Remocao de indicador visual falso em notificacoes.

## Limites da medicao

- Nao foi feita afirmacao de melhoria de Lighthouse/Core Web Vitals, pois nao houve execucao completa de Lighthouse nesta etapa.
- Testes de tempo em URL publica tinham ruido de rede e nao representam melhoria direta do codigo local.
- A versao de limpeza precisa ser publicada para comparacao definitiva em producao.

## Recomendacoes proximas

- Rodar Lighthouse em producao apos deploy.
- Auditar chunks por rota com ferramenta dedicada de bundle analyzer.
- Revisar carregamento de imagens da vitrine e aplicar tamanhos responsivos onde ainda faltar.
- Medir tempo real de consultas Supabase em dashboard, agenda e vitrine.
- Revisar aliases antigos e DNS para evitar roteamento e cache confusos.
