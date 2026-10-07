# PRD — bank-priority-queue-api

> Por que este projeto existe. Teto: 80 linhas.
> Trabalho acadêmico. O enunciado não está no repo; a fonte do escopo é o
> registro em `tasks/todo.md` (correção de rumo de 2026-08-13).

## Problema

Numa agência, atender por ordem de chegada descumpre a Lei 10.048/2000
(prioridade a idosos, gestantes, lactantes, criança de colo, PcD) e a
Lei 13.466/2017 (prioridade especial para maiores de 80 anos).

## Objetivo

Entregar uma API REST de fila de atendimento bancário em que a ordem sai de uma
política de prioridade explícita, mantida por um heap binário implementado à
mão. A apresentação do trabalho precisa conseguir justificar a estrutura de
dados e mostrar a ordem mudando ao vivo.

## Usuário

Professor/avaliador da disciplina e o próprio dono na apresentação. Uso pelo
Swagger e por curl; sem login, sem cliente final real.

## Features do v1

- Seis endpoints do recurso `atendimentos-bancarios`: POST, GET `/{id}`,
  GET `?page&size`, GET `/buscar`, PUT, DELETE.
- Pontuação = perfil × 100 + serviço × 10 − bônus de espera (5 a cada 10 min,
  teto 90, sempre menor que a distância entre perfis).
- Desempate pela senha sequencial emitida por sequência do Postgres.
- Listagem paginada lida do heap, na ordem real de atendimento.
- PUT recalcula a prioridade e reposiciona na fila.
- Exclusão lógica: DELETE muda o status para `CANCELADO`, idempotente.
- Busca no histórico por CPF, trecho de descrição ou status.
- Resposta explica a conta da prioridade (`explicacaoDaPrioridade`).
- Fila reconstruída do banco no boot.
- Swagger em `/docs`; sobe com Docker Compose.

## Fora de escopo

- Painel web, `GET /fila`, `chamar-proximo`, `concluir` e rota de saúde:
  construídos e removidos em 2026-08-13, o enunciado não pede.
- Status `EM_ATENDIMENTO` e `ATENDIDO`: nenhum endpoint os produziria.
- Login e autenticação: o enunciado não pede.
- Mais de uma instância da API: o heap vive em memória.
- Migração versionada de esquema: `synchronize: true` basta para o trabalho.
- Role de banco com privilégio mínimo: só se sair do escopo acadêmico
  (WARN registrado na auditoria de 2026-08-27).
- Mascarar o CPF na resposta: o avaliador confere o dado que cadastrou.

## Decisões em aberto

- Enunciado original: vai para o repo (ex.: `docs/enunciado.pdf`) ou fica fora?
- Prazo e data da apresentação.
- Depois da entrega: projeto arquivado, vira portfólio público, ou evolui?
