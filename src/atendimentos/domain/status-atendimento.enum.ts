/**
 * Ciclo de vida do atendimento.
 *
 * Sao dois estados porque sao dois os que a API produz: o POST cria
 * AGUARDANDO e o DELETE leva a CANCELADO. Nao existe status intermediario
 * inalcancavel so para parecer completo.
 */
export enum StatusAtendimento {
  /** Na fila, disputando a proxima posicao. */
  AGUARDANDO = 'AGUARDANDO',
  /** Exclusao logica: a linha permanece no banco, fora da fila. */
  CANCELADO = 'CANCELADO',
}
