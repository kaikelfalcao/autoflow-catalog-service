import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class LaborCostDto {
  @ApiProperty({ description: 'Amount in centavos (BRL)', example: 8000 })
  @IsInt()
  @Min(0)
  amount: number;

  @ApiProperty({ description: 'Currency code', example: 'BRL' })
  @IsString()
  @IsNotEmpty()
  currency: string;
}

export class CreateServiceDto {
  @ApiProperty({ description: 'Service name', example: 'Full Oil Change' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Service description',
    example: 'Engine oil and filter replacement with multi-point inspection',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Estimated duration in minutes',
    minimum: 1,
    example: 45,
  })
  @IsInt()
  @Min(1)
  estimatedMinutes: number;

  @ApiProperty({
    description: 'Labor cost (parts not included)',
    type: LaborCostDto,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => LaborCostDto)
  laborCost: LaborCostDto;
}
