import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { TAMANHO_MAXIMO_DA_PAGINA } from '../../application/use-cases/listar-ativos.use-case';
import { StatusAtendimento } from '../../domain/status-atendimento.enum';

/** Paginacao compartilhada pelos dois GETs de colecao. */
export class PaginacaoDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: TAMANHO_MAXIMO_DA_PAGINA, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(TAMANHO_MAXIMO_DA_PAGINA)
  size?: number;
}

/** Parametros de `GET /atendimentos-bancarios/buscar`. */
export class BuscarAtendimentosDto extends PaginacaoDto {
  @ApiPropertyOptional({ example: '52998224725', description: 'Com ou sem mascara.' })
  @IsOptional()
  @IsString()
  @Length(11, 14)
  cpf?: string;

  @ApiPropertyOptional({
    example: 'saque',
    description: 'Trecho da descricao, sem diferenciar maiusculas.',
  })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  descricao?: string;

  @ApiPropertyOptional({
    enum: StatusAtendimento,
    isArray: true,
    description: 'Repita o parametro ou separe por virgula. Ausente = todos os status.',
  })
  @IsOptional()
  // A query string entrega um valor solto quando ha um so status; normalizar
  // aqui deixa o caso de uso lidar sempre com uma lista.
  @Transform(({ value }) => (Array.isArray(value) ? value : String(value).split(',')))
  @IsArray()
  @IsEnum(StatusAtendimento, { each: true })
  status?: StatusAtendimento[];
}
