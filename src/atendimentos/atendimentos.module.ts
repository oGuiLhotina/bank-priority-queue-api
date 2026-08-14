import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AtualizarAtendimento } from './application/use-cases/atualizar-atendimento.use-case';
import { BuscarAtendimento } from './application/use-cases/buscar-atendimento.use-case';
import { BuscarAtendimentos } from './application/use-cases/buscar-atendimentos.use-case';
import { CancelarAtendimento } from './application/use-cases/cancelar-atendimento.use-case';
import { CriarAtendimento } from './application/use-cases/criar-atendimento.use-case';
import { ListarAtivos } from './application/use-cases/listar-ativos.use-case';
import { ATENDIMENTO_REPOSITORY } from './domain/ports/atendimento.repository';
import { FILA_DE_PRIORIDADE } from './domain/ports/fila-de-prioridade';
import { HeapFilaDePrioridade } from './infrastructure/fila/heap-fila-de-prioridade';
import { ReidratarFilaNoBoot } from './infrastructure/fila/reidratar-fila.service';
import { AtendimentoOrmEntity } from './infrastructure/persistence/atendimento.orm-entity';
import { TypeOrmAtendimentoRepository } from './infrastructure/persistence/typeorm-atendimento.repository';
import { AtendimentosController } from './presentation/atendimentos.controller';

/**
 * Ligacao entre as camadas. Os casos de uso pedem as interfaces do dominio
 * (`ATENDIMENTO_REPOSITORY`, `FILA_DE_PRIORIDADE`); e aqui, e so aqui, que se
 * decide quais adaptadores concretos as satisfazem. Trocar Postgres por outro
 * banco, ou o heap por uma fila distribuida, muda este arquivo e mais nada.
 */
@Module({
  imports: [TypeOrmModule.forFeature([AtendimentoOrmEntity])],
  controllers: [AtendimentosController],
  providers: [
    { provide: ATENDIMENTO_REPOSITORY, useClass: TypeOrmAtendimentoRepository },
    // Fabrica em vez de `useClass`: o heap recebe o relogio por parametro e nao
    // deve passar pela resolucao automatica de dependencias.
    { provide: FILA_DE_PRIORIDADE, useFactory: () => new HeapFilaDePrioridade() },
    ReidratarFilaNoBoot,
    CriarAtendimento,
    BuscarAtendimento,
    BuscarAtendimentos,
    ListarAtivos,
    AtualizarAtendimento,
    CancelarAtendimento,
  ],
})
export class AtendimentosModule {}
