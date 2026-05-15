import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class ListServicesQuery {
  @ApiPropertyOptional()
  @Transform(({ value }: { value: unknown }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

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
