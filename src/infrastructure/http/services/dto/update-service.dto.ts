import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class LaborCostDto {
  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  amount: number;

  @ApiPropertyOptional()
  @IsString()
  currency: string;
}

export class UpdateServiceDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ minimum: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  estimatedMinutes?: number;

  @ApiPropertyOptional({ type: LaborCostDto })
  @IsObject()
  @ValidateNested()
  @Type(() => LaborCostDto)
  @IsOptional()
  laborCost?: LaborCostDto;
}
