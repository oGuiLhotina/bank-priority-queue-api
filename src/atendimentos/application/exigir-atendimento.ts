import { NaoEncontradoError } from '../../shared/domain/erros';
import { Atendimento } from '../domain/atendimento';
import { AtendimentoRepository } from '../domain/ports/atendimento.repository';

/**
 * Carrega o atendimento ou falha com 404. Existe para que nenhum caso de uso
 * precise repetir a checagem de nulo nem escolher a mensagem de erro sozinho.
 */
export async function exigirAtendimento(
  repositorio: AtendimentoRepository,
  id: string,
): Promise<Atendimento> {
  const atendimento = await repositorio.porId(id);
  if (!atendimento) {
    throw new NaoEncontradoError('atendimento', id);
  }
  return atendimento;
}
