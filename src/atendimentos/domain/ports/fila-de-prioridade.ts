import { Atendimento } from '../atendimento';

export const FILA_DE_PRIORIDADE = Symbol('FILA_DE_PRIORIDADE');

/**
 * Contrato da fila de prioridade. O caso de uso depende desta abstracao, nao do
 * heap: trocar a estrutura (heap pareado, fila no Redis) nao muda a aplicacao.
 */
export interface FilaDePrioridade {
  /** Coloca na fila. O(log n). */
  enfileirar(atendimento: Atendimento): void;
  /** Tira da fila sem atender (exclusao logica). O(n). */
  retirar(id: string): Atendimento | undefined;
  /** Reflete uma alteracao de dados que muda a pontuacao. */
  reposicionar(atendimento: Atendimento): void;
  /** Ordem real de atendimento, sem consumir a fila. */
  espiarOrdenado(): Atendimento[];
  /** Carga inicial a partir do banco. O(n). */
  reidratar(atendimentos: Atendimento[]): void;
  readonly tamanho: number;
}
