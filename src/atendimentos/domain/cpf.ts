import { DadoInvalidoError } from '../../shared/domain/erros';

/**
 * Objeto de valor: um CPF so existe se for valido.
 * Guarda os 11 digitos sem mascara; formata apenas na saida.
 */
export class Cpf {
  private constructor(readonly valor: string) {}

  static criar(entrada: string): Cpf {
    const digitos = Cpf.somenteDigitos(entrada ?? '');

    if (digitos.length !== 11) {
      throw new DadoInvalidoError('CPF deve ter 11 digitos');
    }
    if (/^(\d)\1{10}$/.test(digitos)) {
      throw new DadoInvalidoError('CPF invalido: todos os digitos sao iguais');
    }
    if (
      Cpf.digitoVerificador(digitos, 9) !== Number(digitos[9]) ||
      Cpf.digitoVerificador(digitos, 10) !== Number(digitos[10])
    ) {
      throw new DadoInvalidoError('CPF invalido: digito verificador nao confere');
    }

    return new Cpf(digitos);
  }

  static somenteDigitos(entrada: string): string {
    return entrada.replace(/\D/g, '');
  }

  /** Calcula o digito verificador da posicao indicada pelo algoritmo modulo 11. */
  private static digitoVerificador(digitos: string, posicao: number): number {
    let soma = 0;
    for (let i = 0; i < posicao; i++) {
      soma += Number(digitos[i]) * (posicao + 1 - i);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  }

  /** 000.000.000-00 */
  formatado(): string {
    return this.valor.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  igual(outro: Cpf): boolean {
    return this.valor === outro.valor;
  }
}
