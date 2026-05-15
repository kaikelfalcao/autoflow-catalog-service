import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'Bad Request' })
  error: string;

  @ApiProperty({
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    example: 'Validation failed',
  })
  message: string | string[];

  @ApiProperty({ example: '2026-05-15T10:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/parts' })
  path: string;

  @ApiProperty({ example: 'a1b2c3d4-...' })
  correlationId: string;
}
