import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { MovementType } from '../../../../domain/parts/enums/movement-type.enum';

export class ListMovementsQuery {
  @ApiPropertyOptional({ enum: MovementType })
  @IsEnum(MovementType)
  @IsOptional()
  type?: MovementType;

  @ApiPropertyOptional()
  @Transform(({ value }: { value: unknown }) => new Date(String(value)))
  @IsDate()
  @IsOptional()
  from?: Date;

  @ApiPropertyOptional()
  @Transform(({ value }: { value: unknown }) => new Date(String(value)))
  @IsDate()
  @IsOptional()
  to?: Date;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @Transform(({ value }: { value: unknown }) => parseInt(String(value), 10))
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @Transform(({ value }: { value: unknown }) => parseInt(String(value), 10))
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;
}
