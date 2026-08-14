/** Erro de regra de negocio. A camada HTTP traduz para 4xx. */
export abstract class ErroDeDominio extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = new.target.name;
  }
}

/** Dado invalido enviado pelo cliente. Vira 400. */
export class DadoInvalidoError extends ErroDeDominio {}

/** Recurso inexistente. Vira 404. */
export class NaoEncontradoError extends ErroDeDominio {
  constructor(recurso: string, id: string) {
    super(`${recurso} ${id} nao encontrado`);
  }
}

/** Operacao incompativel com o estado atual do recurso. Vira 409. */
export class ConflitoDeEstadoError extends ErroDeDominio {}
