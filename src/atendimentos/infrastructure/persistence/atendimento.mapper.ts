import { Atendimento } from '../../domain/atendimento';
import { Cpf } from '../../domain/cpf';
import { AtendimentoOrmEntity } from './atendimento.orm-entity';

/** Traducao entre o modelo de dominio e o modelo de tabela. */
export class AtendimentoMapper {
  static paraDominio(linha: AtendimentoOrmEntity): Atendimento {
    return Atendimento.reconstituir({
      id: linha.id,
      senha: Number(linha.senha),
      nomeCliente: linha.nomeCliente,
      cpf: Cpf.criar(linha.cpf),
      perfil: linha.perfil,
      tipoServico: linha.tipoServico,
      descricao: linha.descricao,
      status: linha.status,
      criadoEm: linha.criadoEm,
      atualizadoEm: linha.atualizadoEm,
      encerradoEm: linha.encerradoEm,
    });
  }

  static paraLinha(atendimento: Atendimento): AtendimentoOrmEntity {
    const linha = new AtendimentoOrmEntity();
    linha.id = atendimento.id;
    linha.senha = atendimento.senha;
    linha.nomeCliente = atendimento.nomeCliente;
    linha.cpf = atendimento.cpf.valor;
    linha.perfil = atendimento.perfil;
    linha.tipoServico = atendimento.tipoServico;
    linha.descricao = atendimento.descricao;
    linha.status = atendimento.status;
    linha.criadoEm = atendimento.criadoEm;
    linha.atualizadoEm = atendimento.atualizadoEm;
    linha.encerradoEm = atendimento.encerradoEm;
    return linha;
  }
}
