import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PartCategory } from '../../../../domain/parts/enums/part-category.enum';
import { Unit } from '../../../../domain/parts/enums/unit.enum';

export class CreatePartDto {
  @ApiProperty({ description: 'Part name', example: 'Oil Filter Premium' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    enum: PartCategory,
    description: 'Part category',
    example: PartCategory.FILTER,
  })
  @IsEnum(PartCategory)
  category: PartCategory;

  @ApiProperty({
    enum: Unit,
    description: 'Unit of measure',
    example: Unit.UN,
  })
  @IsEnum(Unit)
  unit: Unit;

  @ApiPropertyOptional({
    description: 'Flexible category-specific attributes',
    example: { brand: 'Bosch', partNumber: 'F026407006' },
  })
  @IsObject()
  @IsOptional()
  attributes?: Record<string, unknown>;

  @ApiProperty({
    description: 'Initial stock quantity',
    minimum: 0,
    example: 50,
  })
  @IsInt()
  @Min(0)
  stockQuantity: number;

  @ApiProperty({
    description: 'Minimum stock level — triggers low-stock alert when crossed',
    minimum: 0,
    example: 10,
  })
  @IsInt()
  @Min(0)
  minimumStock: number;
}
