import { DadoInvalidoError } from '../../shared/domain/erros';
import { Cpf } from './cpf';

const VALIDO = '52998224725';

describe('Cpf', () => {
  it('aceita um CPF valido com ou sem mascara e guarda so os digitos', () => {
    expect(Cpf.criar(VALIDO).valor).toBe(VALIDO);
    expect(Cpf.criar('529.982.247-25').valor).toBe(VALIDO);
  });

  it('recusa quantidade de digitos diferente de 11', () => {
    expect(() => Cpf.criar('5299822472')).toThrow(DadoInvalidoError);
    expect(() => Cpf.criar('529982247259')).toThrow(DadoInvalidoError);
  });

  it('recusa sequencia de digitos repetidos', () => {
    expect(() => Cpf.criar('11111111111')).toThrow(/digitos sao iguais/);
  });

  it('recusa digito verificador que nao confere', () => {
    expect(() => Cpf.criar('52998224726')).toThrow(/digito verificador/);
  });

  it('recusa entrada vazia', () => {
    expect(() => Cpf.criar('')).toThrow(DadoInvalidoError);
  });

  it('formata para exibicao', () => {
    expect(Cpf.criar(VALIDO).formatado()).toBe('529.982.247-25');
  });

  it('compara pelo valor, nao pela referencia', () => {
    expect(Cpf.criar(VALIDO).igual(Cpf.criar('529.982.247-25'))).toBe(true);
    expect(Cpf.criar(VALIDO).igual(Cpf.criar('11144477735'))).toBe(false);
  });
});
