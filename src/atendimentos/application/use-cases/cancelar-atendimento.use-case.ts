import { Inject, Injectable } from '@nestjs/common';
import { Atendimento } from '../../domain/atendimento';
import {
  ATENDIMENTO_REPOSITORY,
  AtendimentoRepository,
} from '../../domain/ports/atendimento.repository';
import { FILA_DE_PRIORIDADE, FilaDePrioridade } from '../../domain/ports/fila-de-prioridade';
import { exigirAtendimento } from '../exigir-atendimento';

/**
 * Exclusao logica: marca o atendimento como CANCELADO e o tira da fila.
 * A linha continua no banco para auditoria, entao o historico nunca some.
 */
@Injectable()
export class CancelarAtendimento {
  constructor(
    @Inject(ATENDIMENTO_REPOSITORY) private readonly repositorio: AtendimentoRepository,
    @Inject(FILA_DE_PRIORIDADE) private readonly fila: FilaDePrioridade,
  ) {}

  async executar(id: string): Promise<Atendimento> {
    const atendimento = await exigirAtendimento(this.repositorio, id);
    atendimento.cancelar();

    const salvo = await this.repositorio.salvar(atendimento);
    this.fila.retirar(id);
    return salvo;
  }
}
