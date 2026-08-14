/**
 * Servico solicitado. Define o desempate entre clientes do mesmo perfil,
 * ordenado por risco financeiro e por tempo medio de balcao.
 */
export enum TipoServico {
  /** Fraude, cartao clonado, bloqueio de conta: risco imediato de perda. */
  EMERGENCIA = 'EMERGENCIA',
  /** Saque, deposito, pagamento: alto giro, atendimento curto no caixa. */
  CAIXA = 'CAIXA',
  /** Emprestimo, renegociacao de divida, limite: prazo e impacto altos. */
  CREDITO = 'CREDITO',
  /** Abertura de conta, investimentos, consultoria: sessao longa de mesa. */
  RELACIONAMENTO = 'RELACIONAMENTO',
}
