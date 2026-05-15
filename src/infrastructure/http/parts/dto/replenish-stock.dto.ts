import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class ReplenishStockDto {
  @ApiProperty({
    description: 'Number of units to add to stock',
    minimum: 1,
    example: 20,
  })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: 'Reason for the replenishment',
    example: 'Purchase order #PO-2026-001',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
