import { ConflitoDeEstadoError, DadoInvalidoError } from '../../shared/domain/erros';
import { Atendimento, NovoAtendimento } from './atendimento';
import { Cpf } from './cpf';
import { PerfilCliente } from './perfil-cliente.enum';
import { StatusAtendimento } from './status-atendimento.enum';
import { TipoServico } from './tipo-servico.enum';

const BASE = new Date('2026-08-13T12:00:00.000Z');

function novo(sobrescrever: Partial<NovoAtendimento> = {}): Atendimento {
  return Atendimento.novo({
    id: 'a5f0e2c4-0000-4000-8000-000000000001',
    senha: 1,
    nomeCliente: 'Marisa Fontenele Braga',
    cpf: Cpf.criar('52998224725'),
    perfil: PerfilCliente.GERAL,
    tipoServico: TipoServico.CAIXA,
    descricao: 'Saque acima do limite do caixa eletronico',
    criadoEm: BASE,
    ...sobrescrever,
  });
}

describe('Atendimento', () => {
  it('nasce aguardando, sem instante de encerramento', () => {
    const atendimento = novo();

    expect(atendimento.status).toBe(StatusAtendimento.AGUARDANDO);
    expect(atendimento.aguardando).toBe(true);
    expect(atendimento.encerradoEm).toBeNull();
  });

  it('imprime a senha com o prefixo do perfil e quatro digitos', () => {
    expect(novo({ senha: 42, perfil: PerfilCliente.PRIORIDADE_LEGAL }).senhaFormatada).toBe(
      'PL0042',
    );
    expect(novo({ senha: 7, perfil: PerfilCliente.PRIORIDADE_ESPECIAL }).senhaFormatada).toBe(
      'PE0007',
    );
  });

  it('remove espacos em volta do nome e da descricao', () => {
    const atendimento = novo({ nomeCliente: '  Ana Lima  ', descricao: '  Deposito  ' });

    expect(atendimento.nomeCliente).toBe('Ana Lima');
    expect(atendimento.descricao).toBe('Deposito');
  });

  it('recusa nome curto demais e descricao vazia', () => {
    expect(() => novo({ nomeCliente: 'Jo' })).toThrow(DadoInvalidoError);
    expect(() => novo({ descricao: '   ' })).toThrow(DadoInvalidoError);
  });

  it('recusa descricao acima do limite', () => {
    expect(() => novo({ descricao: 'x'.repeat(501) })).toThrow(DadoInvalidoError);
  });

  describe('comparacao para o heap', () => {
    it('coloca a menor pontuacao na frente', () => {
      const legal = novo({ senha: 9, perfil: PerfilCliente.PRIORIDADE_LEGAL });
      const geral = novo({ senha: 1, perfil: PerfilCliente.GERAL });

      expect(Atendimento.comparar(legal, geral, BASE)).toBeLessThan(0);
    });

    it('desempata pela senha, entao a ordem e total e deterministica', () => {
      const primeiro = novo({ senha: 3 });
      const segundo = novo({ senha: 4 });

      expect(Atendimento.comparar(primeiro, segundo, BASE)).toBeLessThan(0);
      expect(Atendimento.comparar(segundo, primeiro, BASE)).toBeGreaterThan(0);
      expect(Atendimento.comparar(primeiro, primeiro, BASE)).toBe(0);
    });
  });

  describe('alterar', () => {
    it('recalcula a pontuacao ao trocar o perfil', () => {
      const atendimento = novo();
      const antes = atendimento.pontuacao(BASE);

      atendimento.alterar({ perfil: PerfilCliente.PRIORIDADE_ESPECIAL }, BASE);

      expect(atendimento.pontuacao(BASE)).toBeLessThan(antes);
    });

    it('mantem o valor atual dos campos ausentes', () => {
      const atendimento = novo();

      atendimento.alterar({ descricao: 'Outra coisa' }, BASE);

      expect(atendimento.descricao).toBe('Outra coisa');
      expect(atendimento.nomeCliente).toBe('Marisa Fontenele Braga');
    });

    it('valida o dado novo com o mesmo criterio da criacao', () => {
      const atendimento = novo();

      expect(() => atendimento.alterar({ nomeCliente: 'Jo' }, BASE)).toThrow(DadoInvalidoError);
    });

    it('recusa alteracao de atendimento cancelado', () => {
      const atendimento = novo();
      atendimento.cancelar(BASE);

      expect(() => atendimento.alterar({ descricao: 'tarde demais' }, BASE)).toThrow(
        ConflitoDeEstadoError,
      );
    });
  });

  describe('cancelar', () => {
    it('faz exclusao logica, preservando o registro', () => {
      const atendimento = novo();

      atendimento.cancelar(BASE);

      expect(atendimento.status).toBe(StatusAtendimento.CANCELADO);
      expect(atendimento.encerradoEm).toEqual(BASE);
      expect(atendimento.senha).toBe(1);
    });

    it('e idempotente: repetir o DELETE nao gera erro nem move a data', () => {
      const atendimento = novo();
      atendimento.cancelar(BASE);

      const depois = new Date(BASE.getTime() + 60_000);
      atendimento.cancelar(depois);

      expect(atendimento.encerradoEm).toEqual(BASE);
    });
  });
});
