import { PerfilCliente } from './perfil-cliente.enum';
import {
  BONUS_MAXIMO,
  JANELA_DE_ESPERA_MINUTOS,
  PASSO_DO_BONUS,
  PoliticaDePrioridade,
} from './politica-de-prioridade';
import { TipoServico } from './tipo-servico.enum';

const BASE = new Date('2026-08-13T12:00:00.000Z');
const minutosDepois = (minutos: number): Date => new Date(BASE.getTime() + minutos * 60_000);

const dados = (perfil: PerfilCliente, tipoServico: TipoServico) => ({
  perfil,
  tipoServico,
  criadoEm: BASE,
});

describe('PoliticaDePrioridade', () => {
  it('ordena os perfis por prioridade legal antes de qualquer outro criterio', () => {
    const especial = PoliticaDePrioridade.pontuacaoBase(
      dados(PerfilCliente.PRIORIDADE_ESPECIAL, TipoServico.RELACIONAMENTO),
    );
    const geral = PoliticaDePrioridade.pontuacaoBase(
      dados(PerfilCliente.GERAL, TipoServico.EMERGENCIA),
    );

    // Mesmo com o pior servico, o perfil legal vence o melhor servico do geral.
    expect(especial).toBeLessThan(geral);
  });

  it('usa o tipo de servico para desempatar dentro do mesmo perfil', () => {
    const emergencia = PoliticaDePrioridade.pontuacaoBase(
      dados(PerfilCliente.PRIME, TipoServico.EMERGENCIA),
    );
    const relacionamento = PoliticaDePrioridade.pontuacaoBase(
      dados(PerfilCliente.PRIME, TipoServico.RELACIONAMENTO),
    );

    expect(emergencia).toBeLessThan(relacionamento);
  });

  it('nao concede bonus antes de a primeira janela de espera fechar', () => {
    const entrada = dados(PerfilCliente.GERAL, TipoServico.CAIXA);

    expect(
      PoliticaDePrioridade.bonusDeEspera(entrada, minutosDepois(JANELA_DE_ESPERA_MINUTOS - 1)),
    ).toBe(0);
    expect(
      PoliticaDePrioridade.bonusDeEspera(entrada, minutosDepois(JANELA_DE_ESPERA_MINUTOS)),
    ).toBe(PASSO_DO_BONUS);
  });

  it('acumula um passo de bonus por janela completa', () => {
    const entrada = dados(PerfilCliente.GERAL, TipoServico.CAIXA);

    expect(
      PoliticaDePrioridade.bonusDeEspera(entrada, minutosDepois(JANELA_DE_ESPERA_MINUTOS * 3)),
    ).toBe(PASSO_DO_BONUS * 3);
  });

  it('trava o bonus no teto, por mais que a espera cresca', () => {
    const entrada = dados(PerfilCliente.GERAL, TipoServico.CAIXA);

    expect(PoliticaDePrioridade.bonusDeEspera(entrada, minutosDepois(60_000))).toBe(BONUS_MAXIMO);
  });

  it('nunca deixa a espera de um GERAL ultrapassar um perfil de prioridade legal', () => {
    const geralAntigo = dados(PerfilCliente.GERAL, TipoServico.EMERGENCIA);
    const legalRecemChegado = {
      perfil: PerfilCliente.PRIORIDADE_LEGAL,
      tipoServico: TipoServico.RELACIONAMENTO,
      criadoEm: minutosDepois(60_000),
    };
    const agora = minutosDepois(60_001);

    expect(PoliticaDePrioridade.pontuacao(geralAntigo, agora)).toBeGreaterThan(
      PoliticaDePrioridade.pontuacao(legalRecemChegado, agora),
    );
  });

  it('nao gera espera negativa quando o relogio esta atras da criacao', () => {
    const entrada = dados(PerfilCliente.GERAL, TipoServico.CAIXA);

    expect(PoliticaDePrioridade.minutosDeEspera(entrada, minutosDepois(-30))).toBe(0);
  });

  it('explica a pontuacao com base, bonus e resultado', () => {
    const entrada = dados(PerfilCliente.PRIME, TipoServico.CAIXA);
    const texto = PoliticaDePrioridade.explicar(entrada, minutosDepois(20));

    expect(texto).toContain('base 210');
    expect(texto).toContain('bonus 10');
    expect(texto).toContain('pontuacao final 200');
  });
});
