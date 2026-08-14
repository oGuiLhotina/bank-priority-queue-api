import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { PerfilCliente } from '../../domain/perfil-cliente.enum';
import { TipoServico } from '../../domain/tipo-servico.enum';

/**
 * Entrada do PUT. Todo campo e opcional: o que vier ausente mantem o valor
 * atual. CPF e senha nao aparecem porque sao imutaveis — trocar a identidade
 * do cliente ou o numero da senha seria criar outro atendimento.
 */
export class AtualizarAtendimentoDto {
  @ApiPropertyOptional({ example: 'Maria Aparecida de Souza', minLength: 3, maxLength: 120 })
  @IsOptional()
  @IsString()
  @Length(3, 120)
  nomeCliente?: string;

  @ApiPropertyOptional({ enum: PerfilCliente, description: 'Alterar reordena a fila.' })
  @IsOptional()
  @IsEnum(PerfilCliente)
  perfil?: PerfilCliente;

  @ApiPropertyOptional({ enum: TipoServico, description: 'Alterar reordena a fila.' })
  @IsOptional()
  @IsEnum(TipoServico)
  tipoServico?: TipoServico;

  @ApiPropertyOptional({ example: 'Cliente trocou o saque por renegociacao', maxLength: 500 })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  descricao?: string;
}
