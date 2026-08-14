# BankPriorityQueueApi

API REST de fila de prioridade para atendimento bancário, com heap binário próprio
como estrutura de dados.

Numa agência, atender por ordem de chegada é errado — e ilegal. A Lei 10.048/2000
garante prioridade a idosos, gestantes, lactantes, pessoas com criança de colo e
pessoas com deficiência, e a Lei 13.466/2017 cria uma prioridade especial para
maiores de 80 anos dentro do próprio grupo de idosos. Esta API implementa essa
ordem: quem entra na fila recebe uma pontuação calculada, e um heap binário mantém
o mais prioritário sempre acessível.

- **Recurso:** `atendimentos-bancarios`
- **Documentação interativa:** `http://localhost:3000/docs`

---

## Como rodar

Requisito único: Docker.

```bash
cp .env.example .env
docker compose up --build
```

Sobem dois contêineres: Postgres 16 e a API. A API só inicia depois que o
`healthcheck` do banco passa. Ao subir, o esquema é criado a partir das entidades
e a fila é reconstruída a partir dos atendimentos ainda aguardando.

Abra `http://localhost:3000/docs` para o Swagger.

Testes unitários (precisa de Node 22 e `npm install`):

```bash
npm test
```

---

## Endpoints

| Método | Rota | O que faz |
|---|---|---|
| `POST` | `/atendimentos-bancarios` | Cadastra na fila. Emite a senha e insere no heap. |
| `GET` | `/atendimentos-bancarios/{id}` | Busca um atendimento específico. |
| `GET` | `/atendimentos-bancarios?page=1&size=10` | Lista os ativos, paginados, **na ordem de atendimento**. |
| `GET` | `/atendimentos-bancarios/buscar?cpf=&descricao=&status=` | Busca no histórico, cancelados inclusive. |
| `PUT` | `/atendimentos-bancarios/{id}` | Atualiza os dados e recalcula a prioridade. |
| `DELETE` | `/atendimentos-bancarios/{id}` | **Exclusão lógica**: muda o status para `CANCELADO`. |

### Exemplo

```bash
curl -X POST http://localhost:3000/atendimentos-bancarios \
  -H 'Content-Type: application/json' \
  -d '{
    "nomeCliente": "Doralice Sampaio Neves",
    "cpf": "119.753.086-03",
    "perfil": "PRIORIDADE_ESPECIAL",
    "tipoServico": "CREDITO",
    "descricao": "Renegociacao de consignado"
  }'
```

A resposta traz, além dos dados, a conta que colocou o cliente naquela posição:

```json
{
  "senhaFormatada": "PE0003",
  "pontuacao": 20,
  "minutosDeEspera": 0,
  "explicacaoDaPrioridade": "perfil PRIORIDADE_ESPECIAL e servico CREDITO somam base 20; 0 min de espera concedem bonus 0; pontuacao final 20",
  "status": "AGUARDANDO"
}
```

### Códigos de resposta

O domínio lança um erro tipado e um único filtro traduz para HTTP.

| Situação | Status |
|---|---|
| Dado inválido (CPF, nome curto, descrição vazia) | `400` |
| Corpo ou parâmetro fora do contrato | `400` |
| Atendimento inexistente | `404` |
| Operação incompatível com o estado (ex.: `PUT` em cancelado) | `409` |

---

## Regra de prioridade

Explícita, automatizada e com desempate determinístico. Chave numérica onde
**menor valor = atendido antes**, para casar com um min-heap:

```
pontuação = (peso do perfil × 100) + (peso do serviço × 10) − bônus de espera
```

### 1. Perfil do cliente — critério dominante

| Perfil | Peso | Base | Por quê |
|---|---|---|---|
| `PRIORIDADE_ESPECIAL` | 0 | 0 | Maior de 80 anos (Lei 13.466/2017) |
| `PRIORIDADE_LEGAL` | 1 | 100 | Idoso 60+, gestante, lactante, criança de colo, PcD (Lei 10.048/2000) |
| `PRIME` | 2 | 200 | Segmento exclusivo — prioridade contratual, não legal |
| `GERAL` | 3 | 300 | Demais clientes e não correntistas |

### 2. Tipo de serviço — desempate dentro do perfil

Ordenado por risco financeiro e tempo de balcão.

| Serviço | Peso | Por quê |
|---|---|---|
| `EMERGENCIA` | 0 | Fraude, cartão clonado, bloqueio: risco imediato de perda |
| `CAIXA` | 1 | Saque, depósito, pagamento: alto giro, atendimento curto |
| `CREDITO` | 2 | Empréstimo, renegociação: prazo e impacto altos |
| `RELACIONAMENTO` | 3 | Abertura de conta, investimentos: sessão longa de mesa |

### 3. Envelhecimento — evita inanição

A cada **10 minutos** completos de espera, o atendimento ganha **5 pontos** de
bônus, até o teto de **90**.

O teto é deliberado: 90 é menor que 100, a distância entre dois perfis. Consequência
— a espera reordena a fila dentro de um perfil e aproxima faixas vizinhas, mas
**nunca** faz um cliente `GERAL` passar na frente de um cliente com prioridade legal.
A lei não envelhece. Há teste cobrindo exatamente isso.

### 4. Empates

Duas pontuações iguais são resolvidas pela **senha sequencial**, emitida por uma
sequência do Postgres: única, crescente e imune a concorrência. Como não existem
duas senhas iguais, a ordem é total e determinística — dois atendimentos nunca ficam
realmente empatados, e a fila nunca depende da ordem interna do array.

```ts
static comparar(a: Atendimento, b: Atendimento, agora: Date): number {
  return a.pontuacao(agora) - b.pontuacao(agora) || a.senha - b.senha;
}
```

---

## Justificativa da estrutura de dados: por que um Heap

A pergunta que a fila responde o tempo todo é **"quem é o próximo?"**. Para essa
pergunta, o custo de cada alternativa:

| Estrutura | Inserir | Ler o mais prioritário | Remover o mais prioritário | Construir de uma lista |
|---|---|---|---|---|
| Lista não ordenada | O(1) | O(n) | O(n) | O(n) |
| Lista sempre ordenada | O(n) | O(1) | O(1) | O(n log n) |
| **Heap binário** | **O(log n)** | **O(1)** | **O(log n)** | **O(n)** |

A lista ordenada é ótima para ler e péssima para inserir — e numa agência as
inserções são constantes. A lista não ordenada é o contrário. O heap é o único que
não é ruim em nenhuma das duas, e é o que faz a operação real da agência ser barata.

Três razões a mais, específicas deste domínio:

1. **A pontuação muda sozinha.** O bônus de espera depende do relógio, então a
   chave de ordenação não é estável. Nenhum índice de banco resolve isso — um
   `ORDER BY` numa coluna precisaria reescrever todas as linhas a cada minuto. O
   heap é reconstruído em O(n) com `heapify`, no máximo uma vez por minuto.
2. **Ordem parcial basta.** Só interessa quem está no topo. Manter a fila inteira
   ordenada seria pagar por uma garantia que ninguém consome.
3. **`heapify` é O(n).** Reconstruir a fila do banco no boot custa uma passada, não
   uma ordenação.

### A implementação

`src/atendimentos/domain/binary-heap.ts` — array simples, sem dependência externa.
Para o índice `i`: filhos em `2i+1` e `2i+2`, pai em `⌊(i−1)/2⌋`.

```
índice:   0     1     2     3     4     5     6
        PE03  PM04  PL01  GE08  GE05  PM06  GE02

                      PE0003
                    ↙        ↘
               PM0004          PL0001
              ↙      ↘        ↙      ↘
          GE0008   GE0005  PM0006  GE0002
```

Repare que a árvore **não** está ordenada: `PM0004` aparece antes de `PL0001` no
array. Um heap garante só que todo nó vem antes dos seus filhos — nunca que os
irmãos estão em ordem entre si. É essa garantia mais fraca que torna a inserção
O(log n) em vez de O(n).

Operações implementadas: `inserir` (sobe), `extrair` (desce), `espiar`, `remover`
por predicado, `de` (heapify O(n)) e `paraArrayOrdenado`, que copia antes de ordenar
para não destruir o heap.

### Onde o heap é usado

- `POST` insere no heap;
- `PUT` retira e reinsere, porque a pontuação mudou;
- `DELETE` retira;
- `GET ?page&size` **lê do heap**, não do banco — a ordem de atendimento é resposta
  da estrutura de dados, não de um `ORDER BY`.

O banco guarda o fato. O heap responde a pergunta.

---

## Arquitetura

Clean Architecture com quatro camadas. A dependência aponta sempre para dentro: o
domínio não importa nada de fora dele.

```
src/atendimentos/
├── domain/                         regra de negócio pura, sem framework
│   ├── atendimento.ts              raiz de agregado: invariantes e ciclo de vida
│   ├── binary-heap.ts              a estrutura de dados
│   ├── politica-de-prioridade.ts   a regra de prioridade, isolada
│   ├── cpf.ts                      objeto de valor: só existe se for válido
│   └── ports/                      contratos que a infraestrutura implementa
├── application/                    casos de uso, um por operação
├── infrastructure/                 adaptadores: TypeORM e o heap
└── presentation/                   controller, DTOs
```

```
HTTP → Controller → Caso de uso → Porta (interface) → Adaptador → Postgres
                          ↓                                ↓
                       Domínio                       Heap em memória
```

### SOLID, onde cada princípio aparece

| Princípio | Onde |
|---|---|
| **S** — Responsabilidade única | Um caso de uso por operação. `PoliticaDePrioridade` só calcula pontuação; `Atendimento` só guarda invariantes. |
| **O** — Aberto/fechado | Um perfil ou serviço novo entra pela tabela de pesos, sem tocar no heap nem nos casos de uso. |
| **L** — Substituição de Liskov | Qualquer `FilaDePrioridade` serve aos casos de uso: o heap pode virar fila no Redis sem que a aplicação perceba. |
| **I** — Segregação de interface | `AtendimentoRepository` e `FilaDePrioridade` são portas separadas, porque persistir e ordenar são responsabilidades distintas. |
| **D** — Inversão de dependência | O domínio **declara** as portas; a infraestrutura as implementa. `atendimentos.module.ts` é o único arquivo que sabe quem é o adaptador concreto. |

### DDD

Raiz de agregado (`Atendimento`), objeto de valor (`Cpf`), portas de repositório,
linguagem ubíqua em português (senha, perfil, pontuação, aguardando, cancelado) e
erros de domínio tipados que a camada HTTP traduz.

---

## Decisões técnicas

| Decisão | Escolha | Motivo |
|---|---|---|
| Stack | NestJS 11 + TypeScript | Injeção de dependência nativa torna a inversão explícita; módulos mapeiam as camadas |
| Banco | PostgreSQL 16 via Docker Compose | Requisito do trabalho |
| ORM | TypeORM | Isolado na infraestrutura, atrás de uma porta |
| Entidade ORM separada do domínio | Sim | Decoradores de ORM não vazam para a regra de negócio; `AtendimentoMapper` traduz |
| Identificador | UUID emitido pela aplicação | O domínio precisa da identidade antes do insert |
| Senha | Sequência do Postgres | Unicidade e monotonicidade sob concorrência — é o critério de desempate |
| Exclusão | Lógica (`status = CANCELADO`) | Requisito do trabalho; preserva auditoria |
| Esquema | `synchronize: true` | Trabalho acadêmico. Em produção seria migração versionada |

### Limitações conhecidas

- **O heap vive em memória e pressupõe instância única.** Escalar horizontalmente
  exigiria mover a fila para um serviço dedicado ou reconstruí-la por instância com
  bloqueio no banco. A reidratação no boot resolve o reinício, não a replicação.
- **A reconstrução por envelhecimento é preguiçosa:** acontece no máximo uma vez por
  minuto, na próxima leitura ou escrita. Como o bônus só muda em janelas de 10
  minutos, a ordem fica no máximo um minuto defasada.
- **`synchronize: true`** é adequado a este trabalho e inadequado a produção.

---

## Testes

37 testes unitários cobrindo a estrutura de dados e a regra de negócio:

```bash
npm test
```

| Arquivo | O que prova |
|---|---|
| `binary-heap.spec.ts` | Invariante do heap, heapify O(n), remoção do meio, comparador invertido, heap vazio |
| `politica-de-prioridade.spec.ts` | Perfil domina serviço, janela e teto do bônus, e que espera **não** ultrapassa prioridade legal |
| `atendimento.spec.ts` | Validações, senha formatada, desempate por senha, cancelamento idempotente |
| `cpf.spec.ts` | Dígito verificador, dígitos repetidos, máscara |

---

## Roteiro de apresentação

1. **O problema** — ordem de chegada é ilegal numa agência. Mostrar as duas leis.
2. **Subir** — `docker compose up`, mostrar o log da fila sendo reidratada.
3. **Cadastrar fora de ordem** — no Swagger, criar quatro senhas: um `GERAL`, um
   `PRIME`, um `PRIORIDADE_LEGAL` e um `PRIORIDADE_ESPECIAL`, nessa ordem.
4. **`GET /atendimentos-bancarios`** — a lista sai **invertida** em relação à
   chegada. Ler o campo `explicacaoDaPrioridade` de um deles em voz alta.
5. **`PUT`** — trocar o perfil do `GERAL` para `PRIORIDADE_ESPECIAL` (cliente
   apresentou laudo). Repetir o `GET`: ele saltou para o topo, com senha nova.
6. **`DELETE`** — cancelar um. Mostrar que sumiu da lista de ativos, mas continua
   em `GET /{id}` e em `/buscar?status=CANCELADO`. **Isso é exclusão lógica.**
7. **Empate** — criar dois `GERAL` + `CAIXA` idênticos. Mesma pontuação, e mesmo
   assim a ordem é estável: quem tirou a senha menor vai antes.
8. **A estrutura** — abrir `binary-heap.ts`, mostrar o desenho da árvore neste
   README e a tabela de custos. Fechar explicando por que não é uma lista ordenada.
9. **A arquitetura** — abrir `atendimentos.module.ts`: é o único arquivo que sabe
   que existe Postgres. Trocar o banco muda esse arquivo e mais nada.

---

## Licença

MIT.
