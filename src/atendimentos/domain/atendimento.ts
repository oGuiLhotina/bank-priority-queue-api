import { ConflitoDeEstadoError, DadoInvalidoError } from '../../shared/domain/erros';
import { Cpf } from './cpf';
import { PerfilCliente } from './perfil-cliente.enum';
import { PoliticaDePrioridade } from './politica-de-prioridade';
import { StatusAtendimento } from './status-atendimento.enum';
import { TipoServico } from './tipo-servico.enum';

export interface DadosDoAtendimento {
  id: string;
  senha: number;
  nomeCliente: string;
  cpf: Cpf;
  perfil: PerfilCliente;
  tipoServico: TipoServico;
  descricao: string;
  status: StatusAtendimento;
  criadoEm: Date;
  atualizadoEm: Date;
  encerradoEm: Date | null;
}

export interface NovoAtendimento {
  id: string;
  senha: number;
  nomeCliente: string;
  cpf: Cpf;
  perfil: PerfilCliente;
  tipoServico: TipoServico;
  descricao: string;
  criadoEm?: Date;
}

/** Campos que o PUT pode alterar. Ausente = mantem o valor atual. */
export interface AlteracaoDoAtendimento {
  nomeCliente?: string;
  perfil?: PerfilCliente;
  tipoServico?: TipoServico;
  descricao?: string;
}

const TAMANHO_MINIMO_NOME = 3;
const TAMANHO_MAXIMO_DESCRICAO = 500;

/**
 * Raiz de agregado da fila. Concentra as invariantes do atendimento e a
 * transicao de status; nao sabe nada de HTTP, banco ou framework.
 */
export class Atendimento {
  readonly id: string;
  readonly senha: number;
  readonly cpf: Cpf;
  readonly criadoEm: Date;

  private _nomeCliente: string;
  private _perfil: PerfilCliente;
  private _tipoServico: TipoServico;
  private _descricao: string;
  private _status: StatusAtendimento;
  private _atualizadoEm: Date;
  private _encerradoEm: Date | null;

  private constructor(dados: DadosDoAtendimento) {
    this.id = dados.id;
    this.senha = dados.senha;
    this.cpf = dados.cpf;
    this.criadoEm = dados.criadoEm;
    this._nomeCliente = dados.nomeCliente;
    this._perfil = dados.perfil;
    this._tipoServico = dados.tipoServico;
    this._descricao = dados.descricao;
    this._status = dados.status;
    this._atualizadoEm = dados.atualizadoEm;
    this._encerradoEm = dados.encerradoEm;
  }

  static novo(dados: NovoAtendimento): Atendimento {
    const criadoEm = dados.criadoEm ?? new Date();
    return new Atendimento({
      ...dados,
      nomeCliente: Atendimento.validarNome(dados.nomeCliente),
      descricao: Atendimento.validarDescricao(dados.descricao),
      status: StatusAtendimento.AGUARDANDO,
      criadoEm,
      atualizadoEm: criadoEm,
      encerradoEm: null,
    });
  }

  /** Reconstroi a partir do banco, sem revalidar o que ja foi aceito. */
  static reconstituir(dados: DadosDoAtendimento): Atendimento {
    return new Atendimento(dados);
  }

  get nomeCliente(): string {
    return this._nomeCliente;
  }
  get perfil(): PerfilCliente {
    return this._perfil;
  }
  get tipoServico(): TipoServico {
    return this._tipoServico;
  }
  get descricao(): string {
    return this._descricao;
  }
  get status(): StatusAtendimento {
    return this._status;
  }
  get atualizadoEm(): Date {
    return this._atualizadoEm;
  }
  get encerradoEm(): Date | null {
    return this._encerradoEm;
  }

  /** Senha impressa: prefixo do perfil + numero sequencial. Ex.: PL0042. */
  get senhaFormatada(): string {
    const prefixo: Record<PerfilCliente, string> = {
      [PerfilCliente.PRIORIDADE_ESPECIAL]: 'PE',
      [PerfilCliente.PRIORIDADE_LEGAL]: 'PL',
      [PerfilCliente.PRIME]: 'PM',
      [PerfilCliente.GERAL]: 'GE',
    };
    return `${prefixo[this._perfil]}${String(this.senha).padStart(4, '0')}`;
  }

  get aguardando(): boolean {
    return this._status === StatusAtendimento.AGUARDANDO;
  }

  pontuacao(agora: Date = new Date()): number {
    return PoliticaDePrioridade.pontuacao(this, agora);
  }

  explicacaoDaPrioridade(agora: Date = new Date()): string {
    return PoliticaDePrioridade.explicar(this, agora);
  }

  /**
   * Comparador do heap. Menor pontuacao sai primeiro; empate cai na senha
   * sequencial, que e unica e crescente, entao a ordem e sempre total e
   * deterministica: dois atendimentos nunca ficam realmente empatados.
   */
  static comparar(a: Atendimento, b: Atendimento, agora: Date = new Date()): number {
    return a.pontuacao(agora) - b.pontuacao(agora) || a.senha - b.senha;
  }

  alterar(alteracao: AlteracaoDoAtendimento, agora: Date = new Date()): void {
    this.exigirStatus([StatusAtendimento.AGUARDANDO], 'alterar');

    if (alteracao.nomeCliente !== undefined) {
      this._nomeCliente = Atendimento.validarNome(alteracao.nomeCliente);
    }
    if (alteracao.descricao !== undefined) {
      this._descricao = Atendimento.validarDescricao(alteracao.descricao);
    }
    if (alteracao.perfil !== undefined) {
      this._perfil = alteracao.perfil;
    }
    if (alteracao.tipoServico !== undefined) {
      this._tipoServico = alteracao.tipoServico;
    }
    this._atualizadoEm = agora;
  }

  /**
   * Exclusao logica: o registro continua no banco para auditoria e apenas sai
   * da fila. Idempotente, para o DELETE poder ser repetido sem erro.
   */
  cancelar(agora: Date = new Date()): void {
    if (this._status === StatusAtendimento.CANCELADO) return;
    this._status = StatusAtendimento.CANCELADO;
    this._encerradoEm = agora;
    this._atualizadoEm = agora;
  }

  private exigirStatus(permitidos: StatusAtendimento[], operacao: string): void {
    if (!permitidos.includes(this._status)) {
      throw new ConflitoDeEstadoError(
        `nao e possivel ${operacao} um atendimento com status ${this._status}`,
      );
    }
  }

  private static validarNome(nome: string): string {
    const limpo = (nome ?? '').trim();
    if (limpo.length < TAMANHO_MINIMO_NOME) {
      throw new DadoInvalidoError(
        `nome do cliente deve ter ao menos ${TAMANHO_MINIMO_NOME} caracteres`,
      );
    }
    return limpo;
  }

  private static validarDescricao(descricao: string): string {
    const limpo = (descricao ?? '').trim();
    if (limpo.length === 0) {
      throw new DadoInvalidoError('descricao do atendimento e obrigatoria');
    }
    if (limpo.length > TAMANHO_MAXIMO_DESCRICAO) {
      throw new DadoInvalidoError(
        `descricao deve ter no maximo ${TAMANHO_MAXIMO_DESCRICAO} caracteres`,
      );
    }
    return limpo;
  }
}
