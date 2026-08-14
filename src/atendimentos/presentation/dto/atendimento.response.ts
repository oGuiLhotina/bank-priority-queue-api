import { ApiProperty } from '@nestjs/swagger';
import { Atendimento } from '../../domain/atendimento';
import { PerfilCliente } from '../../domain/perfil-cliente.enum';
import { PoliticaDePrioridade } from '../../domain/politica-de-prioridade';
import { Pagina } from '../../domain/ports/atendimento.repository';
import { StatusAtendimento } from '../../domain/status-atendimento.enum';
import { TipoServico } from '../../domain/tipo-servico.enum';

/** Formato de saida da API. */
export class AtendimentoResponse {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 42, description: 'Numero sequencial. Desempata a fila.' })
  senha: number;

  @ApiProperty({ example: 'PL0042', description: 'Prefixo do perfil + sequencial.' })
  senhaFormatada: string;

  @ApiProperty({ example: 'Maria Aparecida de Souza' })
  nomeCliente: string;

  @ApiProperty({ example: '529.982.247-25' })
  cpf: string;

  @ApiProperty({ enum: PerfilCliente })
  perfil: PerfilCliente;

  @ApiProperty({ enum: TipoServico })
  tipoServico: TipoServico;

  @ApiProperty({ example: 'Saque acima do limite do caixa eletronico' })
  descricao: string;

  @ApiProperty({ enum: StatusAtendimento })
  status: StatusAtendimento;

  @ApiProperty({ example: 110, description: 'Chave do heap. Menor valor = atendido antes.' })
  pontuacao: number;

  @ApiProperty({ example: 23 })
  minutosDeEspera: number;

  @ApiProperty({ description: 'Por que este atendimento esta nesta posicao.' })
  explicacaoDaPrioridade: string;

  @ApiProperty({ format: 'date-time' })
  criadoEm: Date;

  @ApiProperty({ format: 'date-time' })
  atualizadoEm: Date;

  @ApiProperty({ format: 'date-time', nullable: true, description: 'Instante do cancelamento.' })
  encerradoEm: Date | null;

  static de(atendimento: Atendimento, agora: Date = new Date()): AtendimentoResponse {
    return {
      id: atendimento.id,
      senha: atendimento.senha,
      senhaFormatada: atendimento.senhaFormatada,
      nomeCliente: atendimento.nomeCliente,
      cpf: atendimento.cpf.formatado(),
      perfil: atendimento.perfil,
      tipoServico: atendimento.tipoServico,
      descricao: atendimento.descricao,
      status: atendimento.status,
      pontuacao: atendimento.pontuacao(agora),
      minutosDeEspera: PoliticaDePrioridade.minutosDeEspera(atendimento, agora),
      explicacaoDaPrioridade: atendimento.explicacaoDaPrioridade(agora),
      criadoEm: atendimento.criadoEm,
      atualizadoEm: atendimento.atualizadoEm,
      encerradoEm: atendimento.encerradoEm,
    };
  }

  /** Converte a pagina com um unico "agora", para a lista nao ter desvio de relogio dentro dela. */
  static dePagina(pagina: Pagina<Atendimento>): PaginaResponse {
    const agora = new Date();
    return {
      itens: pagina.itens.map((item) => AtendimentoResponse.de(item, agora)),
      total: pagina.total,
      pagina: pagina.pagina,
      tamanho: pagina.tamanho,
      totalDePaginas: pagina.totalDePaginas,
    };
  }
}

export class PaginaResponse {
  @ApiProperty({ type: [AtendimentoResponse] })
  itens: AtendimentoResponse[];

  @ApiProperty({ example: 137, description: 'Total de registros que casam com a consulta.' })
  total: number;

  @ApiProperty({ example: 1 })
  pagina: number;

  @ApiProperty({ example: 10 })
  tamanho: number;

  @ApiProperty({ example: 14 })
  totalDePaginas: number;
}
