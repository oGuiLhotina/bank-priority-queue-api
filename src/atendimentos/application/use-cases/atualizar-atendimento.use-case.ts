import { Inject, Injectable } from '@nestjs/common';
import { AlteracaoDoAtendimento, Atendimento } from '../../domain/atendimento';
import {
  ATENDIMENTO_REPOSITORY,
  AtendimentoRepository,
} from '../../domain/ports/atendimento.repository';
import { FILA_DE_PRIORIDADE, FilaDePrioridade } from '../../domain/ports/fila-de-prioridade';
import { exigirAtendimento } from '../exigir-atendimento';

/**
 * Altera os dados do atendimento e reposiciona a fila.
 *
 * Trocar perfil ou tipo de servico muda a pontuacao, e um item ja inserido no
 * heap nao se reordena sozinho: por isso a fila e avisada explicitamente.
 */
@Injectable()
export class AtualizarAtendimento {
  constructor(
    @Inject(ATENDIMENTO_REPOSITORY) private readonly repositorio: AtendimentoRepository,
    @Inject(FILA_DE_PRIORIDADE) private readonly fila: FilaDePrioridade,
  ) {}

  async executar(id: string, alteracao: AlteracaoDoAtendimento): Promise<Atendimento> {
    const atendimento = await exigirAtendimento(this.repositorio, id);
    atendimento.alterar(alteracao);

    const salvo = await this.repositorio.salvar(atendimento);
    this.fila.reposicionar(salvo);
    return salvo;
  }
}
