import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import {
  ConflitoDeEstadoError,
  DadoInvalidoError,
  ErroDeDominio,
  NaoEncontradoError,
} from '../domain/erros';

/**
 * Traduz erro de regra de negocio em resposta HTTP.
 *
 * O dominio nao conhece HTTP: ele lanca um tipo, e o mapeamento para status
 * vive aqui, num unico lugar. Um erro de dominio novo sem entrada na tabela
 * cai em 422, nunca em 500 — falha de negocio nao e falha do servidor.
 */
const STATUS_POR_ERRO = new Map<Function, HttpStatus>([
  [DadoInvalidoError, HttpStatus.BAD_REQUEST],
  [NaoEncontradoError, HttpStatus.NOT_FOUND],
  [ConflitoDeEstadoError, HttpStatus.CONFLICT],
]);

@Catch(ErroDeDominio)
export class ErroDeDominioFilter implements ExceptionFilter<ErroDeDominio> {
  private readonly logger = new Logger(ErroDeDominioFilter.name);

  catch(erro: ErroDeDominio, host: ArgumentsHost): void {
    const status = STATUS_POR_ERRO.get(erro.constructor) ?? HttpStatus.UNPROCESSABLE_ENTITY;
    const resposta = host.switchToHttp().getResponse<Response>();

    this.logger.warn(`${erro.name}: ${erro.message}`);
    resposta.status(status).json({
      statusCode: status,
      erro: erro.name,
      mensagem: erro.message,
      instante: new Date().toISOString(),
    });
  }
}
