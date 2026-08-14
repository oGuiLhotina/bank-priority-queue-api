import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { PerfilCliente } from '../../domain/perfil-cliente.enum';
import { StatusAtendimento } from '../../domain/status-atendimento.enum';
import { TipoServico } from '../../domain/tipo-servico.enum';

/**
 * Modelo de persistencia. Existe separado da entidade de dominio para que
 * decoradores de ORM nao vazem para as regras de negocio.
 */
@Entity('atendimentos')
@Index('idx_atendimentos_status_senha', ['status', 'senha'])
export class AtendimentoOrmEntity {
  /** UUID emitido pela aplicacao: o dominio precisa da identidade antes do insert. */
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  /**
   * Numero da senha. O valor vem de uma sequencia do Postgres consultada antes
   * do insert (veja `TypeOrmAtendimentoRepository.proximaSenha`), porque o
   * dominio compara por senha no momento em que o atendimento nasce.
   */
  @Column({ type: 'int', unique: true })
  senha: number;

  @Column({ name: 'nome_cliente', type: 'varchar', length: 120 })
  nomeCliente: string;

  @Index('idx_atendimentos_cpf')
  @Column({ type: 'char', length: 11 })
  cpf: string;

  @Column({ type: 'enum', enum: PerfilCliente })
  perfil: PerfilCliente;

  @Column({ name: 'tipo_servico', type: 'enum', enum: TipoServico })
  tipoServico: TipoServico;

  @Column({ type: 'varchar', length: 500 })
  descricao: string;

  @Column({ type: 'enum', enum: StatusAtendimento, default: StatusAtendimento.AGUARDANDO })
  status: StatusAtendimento;

  @CreateDateColumn({ name: 'criado_em', type: 'timestamptz' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em', type: 'timestamptz' })
  atualizadoEm: Date;

  @Column({ name: 'encerrado_em', type: 'timestamptz', nullable: true })
  encerradoEm: Date | null;
}
