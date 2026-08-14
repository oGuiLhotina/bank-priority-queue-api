import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, Repository } from 'typeorm';
import { Atendimento } from '../../domain/atendimento';
import { Cpf } from '../../domain/cpf';
import { StatusAtendimento } from '../../domain/status-atendimento.enum';
import {
  AtendimentoRepository,
  FiltroDeBusca,
  Pagina,
} from '../../domain/ports/atendimento.repository';
import { AtendimentoMapper } from './atendimento.mapper';
import { AtendimentoOrmEntity } from './atendimento.orm-entity';

const SEQUENCIA_DA_SENHA = 'atendimentos_senha_seq';

@Injectable()
export class TypeOrmAtendimentoRepository implements AtendimentoRepository, OnModuleInit {
  constructor(
    @InjectRepository(AtendimentoOrmEntity)
    private readonly repositorio: Repository<AtendimentoOrmEntity>,
  ) {}

  async salvar(atendimento: Atendimento): Promise<Atendimento> {
    const salvo = await this.repositorio.save(AtendimentoMapper.paraLinha(atendimento));
    return AtendimentoMapper.paraDominio(salvo);
  }

  async porId(id: string): Promise<Atendimento | null> {
    const linha = await this.repositorio.findOne({ where: { id } });
    return linha ? AtendimentoMapper.paraDominio(linha) : null;
  }

  async buscar(
    filtro: FiltroDeBusca,
    pagina: number,
    tamanho: number,
  ): Promise<Pagina<Atendimento>> {
    const where: Record<string, unknown> = {};

    if (filtro.cpf) {
      where.cpf = Cpf.somenteDigitos(filtro.cpf);
    }
    if (filtro.descricao) {
      // ILike = comparacao sem diferenciar maiusculas, nativa do Postgres.
      where.descricao = ILike(`%${filtro.descricao}%`);
    }
    if (filtro.status?.length) {
      where.status = In(filtro.status);
    }

    const [linhas, total] = await this.repositorio.findAndCount({
      where,
      order: { senha: 'ASC' },
      skip: (pagina - 1) * tamanho,
      take: tamanho,
    });
    return this.montarPagina(linhas, total, pagina, tamanho);
  }

  async aguardando(): Promise<Atendimento[]> {
    const linhas = await this.repositorio.find({
      where: { status: StatusAtendimento.AGUARDANDO },
      order: { senha: 'ASC' },
    });
    return linhas.map(AtendimentoMapper.paraDominio);
  }

  /**
   * Consome a sequencia dedicada da senha. Deixar o banco emitir o numero
   * garante unicidade e monotonicidade mesmo com requisicoes simultaneas — e a
   * senha e o criterio de desempate da fila.
   */
  async proximaSenha(): Promise<number> {
    const [{ nextval }] = await this.repositorio.query(
      `SELECT nextval('${SEQUENCIA_DA_SENHA}') AS nextval`,
    );
    return Number(nextval);
  }

  /**
   * A sequencia nao pertence a nenhuma coluna, entao o `synchronize` do TypeORM
   * nao a cria. Criar aqui mantem a definicao ao lado do unico ponto que a usa.
   */
  async onModuleInit(): Promise<void> {
    await this.repositorio.query(`CREATE SEQUENCE IF NOT EXISTS ${SEQUENCIA_DA_SENHA} START 1`);
  }

  private montarPagina(
    linhas: AtendimentoOrmEntity[],
    total: number,
    pagina: number,
    tamanho: number,
  ): Pagina<Atendimento> {
    return {
      itens: linhas.map(AtendimentoMapper.paraDominio),
      total,
      pagina,
      tamanho,
      totalDePaginas: Math.max(1, Math.ceil(total / tamanho)),
    };
  }
}
