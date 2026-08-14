/**
 * Perfil do cliente na fila. Define o peso mais forte da prioridade.
 *
 * Os dois primeiros perfis existem por obrigacao legal brasileira:
 * a Lei 10.048/2000 garante atendimento prioritario a idosos, gestantes,
 * lactantes, pessoas com crianca de colo e pessoas com deficiencia, e a
 * Lei 13.466/2017 cria a "prioridade especial" para maiores de 80 anos
 * dentro do proprio grupo de idosos.
 */
export enum PerfilCliente {
  /** Maior de 80 anos: prioridade especial sobre os demais prioritarios. */
  PRIORIDADE_ESPECIAL = 'PRIORIDADE_ESPECIAL',
  /** Idoso 60+, gestante, lactante, crianca de colo ou pessoa com deficiencia. */
  PRIORIDADE_LEGAL = 'PRIORIDADE_LEGAL',
  /** Cliente de segmento prime/exclusivo: prioridade contratual, nao legal. */
  PRIME = 'PRIME',
  /** Demais clientes e nao correntistas. */
  GERAL = 'GERAL',
}
