import { Inject, Injectable } from '@nestjs/common';
import { Atendimento } from '../../domain/atendimento';
import {
  ATENDIMENTO_REPOSITORY,
  AtendimentoRepository,
} from '../../domain/ports/atendimento.repository';
import { exigirAtendimento } from '../exigir-atendimento';

/** Consulta pontual por identificador. */
@Injectable()
export class BuscarAtendimento {
  constructor(
    @Inject(ATENDIMENTO_REPOSITORY) private readonly repositorio: AtendimentoRepository,
  ) {}

  executar(id: string): Promise<Atendimento> {
    return exigirAtendimento(this.repositorio, id);
  }
}
