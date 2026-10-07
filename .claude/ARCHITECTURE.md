# Arquitetura — bank-priority-queue-api

> Como as partes se conectam. Teto: 80 linhas.
> Nunca escreva aqui: endpoint interno, chave, token, nome de bucket, ID de
> projeto em provedor, string de conexão, caminho absoluto de máquina.

## Visão geral

```
Cliente HTTP (Swagger em /docs, curl, avaliador)
   ↓
presentation/   controller + DTOs validados + filtro de erro de domínio
   ↓
application/    um caso de uso por endpoint
   ↓                         ↓
porta AtendimentoRepository  porta FilaDePrioridade
   ↓                         ↓
TypeORM → Postgres           heap binário em memória (instância única)
```

O banco guarda o fato; o heap responde "quem é o próximo".

## Stack

| Camada | Tecnologia | Por quê |
|---|---|---|
| API | NestJS 11 + TypeScript | DI nativa deixa a inversão de dependência explícita |
| Validação | class-validator + ValidationPipe global | rejeita campo fora do contrato (`forbidNonWhitelisted`) |
| Persistência | TypeORM + PostgreSQL 16 | Postgres é requisito do trabalho; ORM isolado atrás de porta |
| Estrutura de dados | `BinaryHeap<T>` próprio | requisito central; sem dependência externa |
| Docs | `@nestjs/swagger` em `/docs` | requisito |
| Testes | Jest + ts-jest | 37 testes unitários de domínio |
| Runtime | Docker Compose, Node 22 alpine | sobe banco e API com um comando; sem serviço externo |

## Estrutura de pastas

```
src/atendimentos/domain/          regra pura: Atendimento, Cpf, BinaryHeap,
                                  PoliticaDePrioridade, enums, ports/
src/atendimentos/application/     casos de uso (criar, buscar, listar ativos,
                                  buscar histórico, atualizar, cancelar)
src/atendimentos/infrastructure/  persistence/ (entidade ORM, mapper, repo)
                                  e fila/ (adaptador do heap, reidratação)
src/atendimentos/presentation/    controller e DTOs
src/shared/                       erros de domínio e filtro que os traduz p/ HTTP
tasks/                            plano, correções de rumo, auditoria
```

## Fluxo de dados

1. Requisição chega no `AtendimentosController` (`/atendimentos-bancarios`).
2. Validação em duas camadas: `ValidationPipe` + DTO (forma do corpo e
   parâmetros, UUID no path) e domínio (`Cpf`, nome, descrição, estado).
3. Caso de uso: no POST, a sequência do Postgres emite a senha, o repositório
   grava e só então o heap recebe o item (falha no insert não deixa fantasma).
   PUT grava e reposiciona; DELETE marca `CANCELADO`, grava e retira do heap.
4. Leitura: `GET ?page&size` sai do heap (ordem de atendimento);
   `GET /{id}` e `GET /buscar` saem do banco, cancelados inclusive.
5. Erro de domínio tipado vira HTTP no `ErroDeDominioFilter`: 400 inválido,
   404 inexistente, 409 estado incompatível.
6. Boot: `ReidratarFilaNoBoot` lê os `AGUARDANDO` e reconstrói o heap em O(n).
   O bônus de espera muda a chave com o tempo, então o heap se reconstrói no
   máximo uma vez por minuto, na próxima leitura ou escrita.

## Deploy

Só ambiente de desenvolvimento/apresentação: `docker compose up --build` sobe
Postgres e API; a API espera o healthcheck do banco. Dockerfile multi-stage,
processo sem root. Esquema criado por `synchronize: true` a cada boot, sem
migração. Credenciais vêm do `.env` (modelo em `.env.example`). Não há deploy
público nem pipeline de CI. Voltar atrás: `git revert` e subir o compose de novo.

## Regras de camada

- `domain/` não importa nada de fora dele (nem NestJS, nem TypeORM).
- `atendimentos.module.ts` é o único arquivo que liga porta a adaptador.
- Entidade ORM separada do agregado; `AtendimentoMapper` traduz.
- Controller não tem regra de negócio: valida, delega, formata.
- Heap em memória pressupõe uma instância só da API.
