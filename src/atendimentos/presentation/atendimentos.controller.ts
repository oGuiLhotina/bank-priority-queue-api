import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AtualizarAtendimento } from '../application/use-cases/atualizar-atendimento.use-case';
import { BuscarAtendimento } from '../application/use-cases/buscar-atendimento.use-case';
import { BuscarAtendimentos } from '../application/use-cases/buscar-atendimentos.use-case';
import { CancelarAtendimento } from '../application/use-cases/cancelar-atendimento.use-case';
import { CriarAtendimento } from '../application/use-cases/criar-atendimento.use-case';
import { ListarAtivos } from '../application/use-cases/listar-ativos.use-case';
import { AtendimentoResponse, PaginaResponse } from './dto/atendimento.response';
import { AtualizarAtendimentoDto } from './dto/atualizar-atendimento.dto';
import { BuscarAtendimentosDto, PaginacaoDto } from './dto/consultar-atendimentos.dto';
import { CriarAtendimentoDto } from './dto/criar-atendimento.dto';

/**
 * Recurso REST da fila de atendimento bancario.
 *
 * O controller so traduz HTTP: valida a entrada pelo DTO, delega a um caso de
 * uso e formata a saida. Nao ha regra de negocio aqui.
 */
@ApiTags('atendimentos-bancarios')
@Controller('atendimentos-bancarios')
export class AtendimentosController {
  constructor(
    private readonly criar: CriarAtendimento,
    private readonly buscarPorIdentificador: BuscarAtendimento,
    private readonly listarAtivos: ListarAtivos,
    private readonly buscar: BuscarAtendimentos,
    private readonly atualizar: AtualizarAtendimento,
    private readonly cancelar: CancelarAtendimento,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Cadastra um atendimento na fila',
    description:
      'Emite a senha a partir de uma sequencia do banco e insere no heap. A posicao sai da politica de prioridade, nunca da ordem de chegada.',
  })
  @ApiBody({ type: CriarAtendimentoDto })
  @ApiCreatedResponse({ type: AtendimentoResponse })
  async criarAtendimento(@Body() dto: CriarAtendimentoDto): Promise<AtendimentoResponse> {
    return AtendimentoResponse.de(await this.criar.executar(dto));
  }

  @Get('buscar')
  @ApiOperation({
    summary: 'Busca por CPF, trecho da descricao ou status',
    description:
      'Consulta o banco, entao alcanca tambem os atendimentos cancelados — e a rota do historico.',
  })
  @ApiOkResponse({ type: PaginaResponse })
  async buscarAtendimentos(@Query() consulta: BuscarAtendimentosDto): Promise<PaginaResponse> {
    return AtendimentoResponse.dePagina(await this.buscar.executar(consulta));
  }

  @Get()
  @ApiOperation({
    summary: 'Lista os atendimentos ativos, paginados',
    description:
      'Na ordem real de atendimento, lida do heap. Cancelado nao aparece: essa e a metade visivel da exclusao logica.',
  })
  @ApiOkResponse({ type: PaginaResponse })
  listar(@Query() paginacao: PaginacaoDto): PaginaResponse {
    return AtendimentoResponse.dePagina(this.listarAtivos.executar(paginacao));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um atendimento especifico' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: AtendimentoResponse })
  @ApiNotFoundResponse({ description: 'Atendimento inexistente.' })
  async buscarPorId(@Param('id', ParseUUIDPipe) id: string): Promise<AtendimentoResponse> {
    return AtendimentoResponse.de(await this.buscarPorIdentificador.executar(id));
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Atualiza os dados e recalcula a prioridade',
    description: 'Trocar perfil ou tipo de servico reordena a fila na mesma requisicao.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: AtendimentoResponse })
  @ApiNotFoundResponse({ description: 'Atendimento inexistente.' })
  @ApiConflictResponse({ description: 'Atendimento ja cancelado.' })
  async atualizarAtendimento(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarAtendimentoDto,
  ): Promise<AtendimentoResponse> {
    return AtendimentoResponse.de(await this.atualizar.executar(id, dto));
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Exclusao logica: altera o status para CANCELADO',
    description:
      'A linha permanece no banco para auditoria e sai da fila. Repetir a chamada nao gera erro.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: AtendimentoResponse })
  @ApiNotFoundResponse({ description: 'Atendimento inexistente.' })
  async cancelarAtendimento(@Param('id', ParseUUIDPipe) id: string): Promise<AtendimentoResponse> {
    return AtendimentoResponse.de(await this.cancelar.executar(id));
  }
}
