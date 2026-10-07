# RAG — LightRAG — bank-priority-queue-api

Busca semântica no código e na documentação deste projeto. Server local em
Docker, backend OpenAI (`gpt-4o-mini` + `text-embedding-3-large`). Protocolo de
quando e como alimentar: `../conhecimento/alimentar-lightrag.md`.

## Onde está

| Onde | O quê |
|---|---|
| `C:\Users\carri\lightrag\` | clone HKUDS/LightRAG: compose, `.env` com a `OPENAI_API_KEY`, storage |
| `localhost:9621` | índice **compartilhado** de todos os projetos, separado por prefixo de arquivo |
| `localhost:9622` | agentes, skills e `conhecimento/` da base (workspace `base_claude`) |
| `C:\Users\carri\lightrag\index_pasta.py` | o indexador |
| `../scripts/lightrag_mcp.py` | cliente MCP, uma cópia só na raiz do workspace — nunca copiar para cá |
| `.ragignore` (raiz deste projeto) | o que NÃO é indexado |

Workspace no LightRAG é **por instância**, não por requisição: o
`POST /documents/text` só aceita `text` e `file_source`, e o header
`LIGHTRAG-WORKSPACE` só vale no `/health`. Por isso todos os projetos dividem
a 9621 e se distinguem pelo prefixo `bank-priority-queue-api/` no `file_source`.

## Reindexar

```bash
python C:\Users\carri\lightrag\index_pasta.py \
  --raiz "bank-priority-queue-api" --prefixo bank-priority-queue-api --porta 9621
```

Rodar da raiz do workspace. `--conferir` lista o que entraria sem mandar nada
(e sem gastar OpenAI). Reindexar depois do commit, não antes.

## Consultar

WebUI do grafo: http://localhost:9621/webui. Pela API,
`POST /query` com `{"query": "...", "mode": "hybrid"}`.

O índice é compartilhado: **diga o nome do projeto na pergunta** ("no
bank-priority-queue-api, onde ...") e desconfie de resposta que cite arquivo sem o prefixo
`bank-priority-queue-api/`. Ela pode estar falando de outro projeto.

Ordem numa sessão: RAG primeiro, Read/Grep depois. Resposta que cita arquivo
que não existe mais é RAG velho — reindexe antes de confiar.

## Regras

1. Nunca commitar `.env`. A chave da OpenAI vive só em
   `C:\Users\carri\lightrag\.env`.
2. Dependência ou ativo novo entra no `.ragignore` na mesma tarefa.
3. Projeto na 9621, base na 9622. Não misturar.
