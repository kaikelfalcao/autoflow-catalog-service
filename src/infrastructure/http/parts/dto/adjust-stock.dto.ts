import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class AdjustStockDto {
  @ApiProperty({
    description: 'Target stock quantity after adjustment',
    minimum: 0,
    example: 45,
  })
  @IsInt()
  @Min(0)
  newQuantity: number;

  @ApiProperty({
    description: 'Reason for the manual adjustment',
    example: 'Inventory count correction — physical audit 2026-05',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
