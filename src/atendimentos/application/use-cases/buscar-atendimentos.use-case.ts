import { Inject, Injectable } from '@nestjs/common';
import { Atendimento } from '../../domain/atendimento';
import {
  ATENDIMENTO_REPOSITORY,
  AtendimentoRepository,
  FiltroDeBusca,
  Pagina,
} from '../../domain/ports/atendimento.repository';
import { TAMANHO_MAXIMO_DA_PAGINA, TAMANHO_PADRAO_DA_PAGINA } from './listar-ativos.use-case';

export interface BuscarAtendimentosConsulta extends FiltroDeBusca {
  page?: number;
  size?: number;
}

/**
 * Busca por CPF, trecho da descricao ou status.
 *
 * Vai ao banco, e nao a fila, porque a pergunta e outra: aqui se procura um
 * atendimento que pode ja ter sido cancelado, e cancelado nao esta no heap.
 */
@Injectable()
export class BuscarAtendimentos {
  constructor(
    @Inject(ATENDIMENTO_REPOSITORY) private readonly repositorio: AtendimentoRepository,
  ) {}

  executar(consulta: BuscarAtendimentosConsulta): Promise<Pagina<Atendimento>> {
    const { page, size, ...filtro } = consulta;
    return this.repositorio.buscar(
      filtro,
      Math.max(1, page ?? 1),
      Math.min(TAMANHO_MAXIMO_DA_PAGINA, Math.max(1, size ?? TAMANHO_PADRAO_DA_PAGINA)),
    );
  }
}
