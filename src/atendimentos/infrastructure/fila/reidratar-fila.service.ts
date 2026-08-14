import { Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import {
  ATENDIMENTO_REPOSITORY,
  AtendimentoRepository,
} from '../../domain/ports/atendimento.repository';
import { FILA_DE_PRIORIDADE, FilaDePrioridade } from '../../domain/ports/fila-de-prioridade';

/**
 * Reconstroi a fila no boot a partir do banco.
 *
 * O heap vive em memoria, entao reiniciar a API o esvaziaria e os clientes que
 * ja tinham senha sumiriam da fila. Aqui os atendimentos AGUARDANDO voltam
 * em um unico heapify O(n), e a ordem e recalculada com o relogio de agora —
 * quem esperou durante a parada recebe o bonus de espera correspondente.
 */
@Injectable()
export class ReidratarFilaNoBoot implements OnApplicationBootstrap {
  private readonly logger = new Logger(ReidratarFilaNoBoot.name);

  constructor(
    @Inject(ATENDIMENTO_REPOSITORY) private readonly repositorio: AtendimentoRepository,
    @Inject(FILA_DE_PRIORIDADE) private readonly fila: FilaDePrioridade,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const aguardando = await this.repositorio.aguardando();
    this.fila.reidratar(aguardando);
    this.logger.log(`fila pronta com ${this.fila.tamanho} atendimento(s)`);
  }
}
