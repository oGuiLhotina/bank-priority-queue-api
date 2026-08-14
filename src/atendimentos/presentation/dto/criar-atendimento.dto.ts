import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, Length, Matches } from 'class-validator';
import { PerfilCliente } from '../../domain/perfil-cliente.enum';
import { TipoServico } from '../../domain/tipo-servico.enum';

/**
 * Entrada do POST. Valida forma (tipo, tamanho, formato); regra de negocio
 * (CPF valido, transicao de status) continua no dominio.
 */
export class CriarAtendimentoDto {
  @ApiProperty({ example: 'Maria Aparecida de Souza', minLength: 3, maxLength: 120 })
  @IsString()
  @Length(3, 120)
  nomeCliente: string;

  @ApiProperty({
    example: '529.982.247-25',
    description: 'Com ou sem mascara. O digito verificador e conferido no dominio.',
  })
  @IsString()
  @Matches(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, {
    message: 'cpf deve ter 11 digitos, com ou sem mascara',
  })
  cpf: string;

  @ApiProperty({
    enum: PerfilCliente,
    example: PerfilCliente.PRIORIDADE_LEGAL,
    description: 'Criterio dominante da fila. Os dois primeiros sao prioridade legal.',
  })
  @IsEnum(PerfilCliente)
  perfil: PerfilCliente;

  @ApiProperty({
    enum: TipoServico,
    example: TipoServico.CAIXA,
    description: 'Desempata clientes do mesmo perfil.',
  })
  @IsEnum(TipoServico)
  tipoServico: TipoServico;

  @ApiProperty({ example: 'Saque acima do limite do caixa eletronico', maxLength: 500 })
  @IsString()
  @Length(1, 500)
  descricao: string;
}
