import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Atendimento } from '../../domain/atendimento';
import { Cpf } from '../../domain/cpf';
import { PerfilCliente } from '../../domain/perfil-cliente.enum';
import {
  ATENDIMENTO_REPOSITORY,
  AtendimentoRepository,
} from '../../domain/ports/atendimento.repository';
import { FILA_DE_PRIORIDADE, FilaDePrioridade } from '../../domain/ports/fila-de-prioridade';
import { TipoServico } from '../../domain/tipo-servico.enum';

export interface CriarAtendimentoComando {
  nomeCliente: string;
  cpf: string;
  perfil: PerfilCliente;
  tipoServico: TipoServico;
  descricao: string;
}

/**
 * Emite a senha, persiste o atendimento e o coloca na fila.
 *
 * A ordem importa: o banco emite a senha antes do insert porque ela e o
 * criterio de desempate do heap, e a fila so recebe o atendimento depois de
 * gravado — se o insert falhar, a fila em memoria nao fica com um fantasma.
 */
@Injectable()
export class CriarAtendimento {
  constructor(
    @Inject(ATENDIMENTO_REPOSITORY) private readonly repositorio: AtendimentoRepository,
    @Inject(FILA_DE_PRIORIDADE) private readonly fila: FilaDePrioridade,
  ) {}

  async executar(comando: CriarAtendimentoComando): Promise<Atendimento> {
    const atendimento = Atendimento.novo({
      id: randomUUID(),
      senha: await this.repositorio.proximaSenha(),
      nomeCliente: comando.nomeCliente,
      cpf: Cpf.criar(comando.cpf),
      perfil: comando.perfil,
      tipoServico: comando.tipoServico,
      descricao: comando.descricao,
    });

    const salvo = await this.repositorio.salvar(atendimento);
    this.fila.enfileirar(salvo);
    return salvo;
  }
}
