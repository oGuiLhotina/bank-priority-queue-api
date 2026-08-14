# BankPriorityQueueApi — mapa

Trabalho acadêmico. API REST de fila de prioridade com heap binário próprio.
Tema: fila de atendimento bancário. Recurso: `atendimentos-bancarios`.
NestJS 11 + TypeScript + Postgres 16 (Docker Compose) + TypeORM.

Explicação completa (regra de prioridade, justificativa do heap, SOLID,
roteiro de apresentação): `README.md`. Não duplicar aqui.

## Onde fica o quê

```
src/atendimentos/
├── domain/          regra pura. Não importa nada de fora.
│   ├── atendimento.ts             invariantes e ciclo de vida
│   ├── binary-heap.ts             a estrutura de dados
│   ├── politica-de-prioridade.ts  a fórmula da pontuação
│   ├── cpf.ts                     objeto de valor
│   └── ports/                     contratos (repositório, fila)
├── application/     um caso de uso por operação
├── infrastructure/  TypeORM + adaptador do heap + reidratação no boot
└── presentation/    controller e DTOs
src/shared/          erros de domínio e o filtro que os traduz para HTTP
```

`atendimentos.module.ts` é o único arquivo que decide quais adaptadores
concretos satisfazem as portas. Trocar banco ou estrutura passa só por ele.

## Regras deste projeto

- **Escopo fechado nos 6 endpoints do enunciado.** POST, GET/{id},
  GET ?page&size, GET /buscar, PUT, DELETE lógico. Nada além disso sem o
  usuário pedir — já foi cortado um painel web e quatro rotas extras.
- **Status só existe se algum endpoint produzir.** Hoje: `AGUARDANDO` e
  `CANCELADO`. Não reintroduzir estado inalcançável.
- **O `GET ?page&size` lê do heap**, não do banco. É o que justifica a
  estrutura de dados existir. Não trocar por `ORDER BY`.
- **Desempate é a senha sequencial** (sequência do Postgres). Não usar
  `criadoEm`: dois inserts no mesmo milissegundo empatariam.
- **O teto do bônus de espera (90) tem que continuar menor que 100**, a
  distância entre dois perfis. É o que impede espera de ultrapassar
  prioridade legal. Há teste cobrindo.
- Comentário explica **por quê**, não o quê. Código em português.

## Comandos

```bash
docker compose up --build    # sobe Postgres + API; docs em /docs
npm test                     # 37 testes unitários
npx tsc --noEmit             # typecheck
```
