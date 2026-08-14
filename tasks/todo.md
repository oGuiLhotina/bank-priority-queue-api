# BankPriorityQueueApi — plano

Trabalho acadêmico: API REST de fila de prioridade com heap binário.
Tema: fila de atendimento bancário. Recurso: `atendimentos-bancarios`.

## Decisões

| Decisão | Escolha | Motivo |
|---|---|---|
| Stack | NestJS 11 + TypeScript | DI nativa = inversão de dependência explícita |
| Banco | PostgreSQL 16 via Docker Compose | requisito do trabalho |
| ORM | TypeORM | adapter isolado na infraestrutura, atrás de uma porta |
| Heap | implementação própria em memória | requisito central; banco só persiste |
| Docs | Swagger em `/docs` | requisito |
| Exclusão | lógica (`status = CANCELADO`) | requisito |
| Ordem da listagem | lida do heap, não do banco | é o que justifica a estrutura existir |
| Desempate | senha sequencial do Postgres | única e monotônica sob concorrência |

## Tarefas

- [x] Scaffold (package.json, tsconfig, nest-cli, prettier)
- [x] Domínio: `Atendimento`, `Cpf`, enums, `PoliticaDePrioridade`
- [x] Estrutura de dados: `BinaryHeap<T>` genérico
- [x] Portas: `AtendimentoRepository`, `FilaDePrioridade`
- [x] Casos de uso: criar, buscar por id, listar ativos, buscar, atualizar, cancelar
- [x] Infra: entidade ORM, mapper, repositório TypeORM, adaptador de fila
- [x] Apresentação: controller, DTOs validados, filtro de erros de domínio
- [x] Reidratação da fila no boot a partir do banco
- [x] Docker Compose (Postgres + API) com healthcheck, e Dockerfile multi-stage
- [x] 37 testes unitários (heap, política, CPF, agregado) — todos verdes
- [x] Teste ponta a ponta dos 6 endpoints contra o compose — todos verdes
- [x] README completo, CLAUDE.md, `.ragignore`

## Correção de rumo (2026-08-13)

Primeira versão saiu do escopo: painel web, `GET /fila`, `POST /chamar-proximo`,
`POST /{id}/concluir`, `GET /saude` e `PRODUCT.md`. O usuário pediu o enunciado
e nada mais. Tudo removido.

Duas consequências do corte, decididas com ele:

1. Sem `chamar-proximo`/`concluir`, os status `EM_ATENDIMENTO` e `ATENDIDO`
   ficariam inalcançáveis. O ciclo de vida foi reduzido a `AGUARDANDO` e
   `CANCELADO` — que é exatamente o que os 6 endpoints produzem. Saiu junto o
   campo `chamadoEm`.
2. Sem nenhuma rota lendo a fila, o heap ficaria sem consumidor e a
   justificativa da estrutura cairia. O `GET ?page&size` passou a ler do heap.
   Nenhuma rota nova foi criada para isso.

Também por decisão do usuário: CPF volta **formatado por extenso** na resposta
(era mascarado), porque o avaliador confere o dado que cadastrou.

## Revisão

Entregue: API NestJS em Clean Architecture (domain / application /
infrastructure / presentation), heap binário próprio com política de prioridade
explícita e desempate determinístico por senha sequencial, exclusão lógica,
paginação lida do heap, busca por CPF e descrição alcançando o histórico,
Swagger em `/docs`, Postgres em Docker Compose e suíte de testes cobrindo
estrutura de dados e regra de negócio.

Limitação documentada no README: a fila em memória pressupõe instância única.
