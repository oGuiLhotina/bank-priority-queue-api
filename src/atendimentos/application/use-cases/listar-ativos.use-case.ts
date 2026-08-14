import { Inject, Injectable } from '@nestjs/common';
import { Atendimento } from '../../domain/atendimento';
import { Pagina } from '../../domain/ports/atendimento.repository';
import { FILA_DE_PRIORIDADE, FilaDePrioridade } from '../../domain/ports/fila-de-prioridade';

export const TAMANHO_PADRAO_DA_PAGINA = 10;
export const TAMANHO_MAXIMO_DA_PAGINA = 100;

export interface ListarAtivosConsulta {
  page?: number;
  size?: number;
}

/**
 * Lista os atendimentos ativos, paginados, na ordem em que serao atendidos.
 *
 * A ordem vem do heap, nao de um `ORDER BY`. Essa e a razao de a estrutura
 * existir no projeto: a pontuacao depende do tempo de espera, muda sozinha
 * entre duas requisicoes e nao e coluna indexavel. O banco guarda o fato; o
 * heap responde a pergunta "quem e o proximo".
 *
 * A paginacao e feita sobre a lista ja ordenada porque a fila ativa cabe em
 * memoria por definicao: ela e o balcao de uma agencia, nao um historico.
 */
@Injectable()
export class ListarAtivos {
  constructor(@Inject(FILA_DE_PRIORIDADE) private readonly fila: FilaDePrioridade) {}

  executar(consulta: ListarAtivosConsulta): Pagina<Atendimento> {
    const pagina = Math.max(1, consulta.page ?? 1);
    const tamanho = Math.min(
      TAMANHO_MAXIMO_DA_PAGINA,
      Math.max(1, consulta.size ?? TAMANHO_PADRAO_DA_PAGINA),
    );

    const ordenados = this.fila.espiarOrdenado();
    const inicio = (pagina - 1) * tamanho;

    return {
      itens: ordenados.slice(inicio, inicio + tamanho),
      total: ordenados.length,
      pagina,
      tamanho,
      totalDePaginas: Math.max(1, Math.ceil(ordenados.length / tamanho)),
    };
  }
}
