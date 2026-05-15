import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class UpdatePartDto {
  @ApiPropertyOptional({
    description: 'New part name',
    example: 'Premium Oil Filter',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated category-specific attributes',
    example: { brand: 'Mann', partNumber: 'HU 612/2 x' },
  })
  @IsObject()
  @IsOptional()
  attributes?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'New minimum stock level',
    minimum: 0,
    example: 5,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  minimumStock?: number;
}
