import { PerfilCliente } from './perfil-cliente.enum';
import { TipoServico } from './tipo-servico.enum';

/**
 * Regra de prioridade da fila, explicita e automatizada.
 *
 * A pontuacao e uma chave numerica onde MENOR = MAIS URGENTE, para casar com
 * um min-heap. Ela tem tres componentes:
 *
 *   pontuacao = (peso do perfil x 100) + (peso do servico x 10) - bonus de espera
 *
 *   1. Perfil do cliente (dezenas de centenas): criterio dominante, porque a
 *      prioridade legal nao pode ser negociada por conveniencia operacional.
 *   2. Tipo de servico (dezenas): desempata dentro do mesmo perfil por risco
 *      financeiro e por tempo de balcao.
 *   3. Bonus de espera (unidades ate o teto): envelhecimento (aging) que impede
 *      inanicao (starvation) de quem esta na faixa mais baixa.
 *
 * O teto do bonus (BONUS_MAXIMO = 90) e menor que a distancia entre dois
 * perfis (100). Consequencia deliberada: a espera reordena a fila dentro de um
 * perfil e pode aproximar faixas vizinhas, mas nunca faz um cliente GERAL
 * passar na frente de um cliente com prioridade legal. A lei nao envelhece.
 *
 * Empates de pontuacao sao resolvidos fora daqui, pela senha sequencial
 * (ordem de chegada), que e unica e monotonica: veja `Atendimento.comparar`.
 */
export const PESO_PERFIL: Readonly<Record<PerfilCliente, number>> = {
  [PerfilCliente.PRIORIDADE_ESPECIAL]: 0,
  [PerfilCliente.PRIORIDADE_LEGAL]: 1,
  [PerfilCliente.PRIME]: 2,
  [PerfilCliente.GERAL]: 3,
};

export const PESO_SERVICO: Readonly<Record<TipoServico, number>> = {
  [TipoServico.EMERGENCIA]: 0,
  [TipoServico.CAIXA]: 1,
  [TipoServico.CREDITO]: 2,
  [TipoServico.RELACIONAMENTO]: 3,
};

/** A cada janela completa de espera, o atendimento ganha um passo de bonus. */
export const JANELA_DE_ESPERA_MINUTOS = 10;
export const PASSO_DO_BONUS = 5;
export const BONUS_MAXIMO = 90;

export interface DadosDePriorizacao {
  readonly perfil: PerfilCliente;
  readonly tipoServico: TipoServico;
  readonly criadoEm: Date;
}

export class PoliticaDePrioridade {
  /** Parte fixa da chave: perfil e servico, sem influencia do relogio. */
  static pontuacaoBase(dados: DadosDePriorizacao): number {
    return PESO_PERFIL[dados.perfil] * 100 + PESO_SERVICO[dados.tipoServico] * 10;
  }

  static minutosDeEspera(dados: DadosDePriorizacao, agora: Date): number {
    const decorrido = agora.getTime() - dados.criadoEm.getTime();
    return Math.max(0, Math.floor(decorrido / 60_000));
  }

  static bonusDeEspera(dados: DadosDePriorizacao, agora: Date): number {
    const janelas = Math.floor(
      PoliticaDePrioridade.minutosDeEspera(dados, agora) / JANELA_DE_ESPERA_MINUTOS,
    );
    return Math.min(janelas * PASSO_DO_BONUS, BONUS_MAXIMO);
  }

  /** Chave final do heap. Menor valor = atendido antes. */
  static pontuacao(dados: DadosDePriorizacao, agora: Date): number {
    return (
      PoliticaDePrioridade.pontuacaoBase(dados) - PoliticaDePrioridade.bonusDeEspera(dados, agora)
    );
  }

  /** Texto curto que acompanha o atendimento na resposta da API. */
  static explicar(dados: DadosDePriorizacao, agora: Date): string {
    const base = PoliticaDePrioridade.pontuacaoBase(dados);
    const bonus = PoliticaDePrioridade.bonusDeEspera(dados, agora);
    const espera = PoliticaDePrioridade.minutosDeEspera(dados, agora);
    return (
      `perfil ${dados.perfil} e servico ${dados.tipoServico} somam base ${base}; ` +
      `${espera} min de espera concedem bonus ${bonus}; pontuacao final ${base - bonus}`
    );
  }
}
