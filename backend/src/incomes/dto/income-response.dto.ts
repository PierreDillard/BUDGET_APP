import { ApiProperty } from '@nestjs/swagger';

export class IncomeResponseDto {
  @ApiProperty({
    description: 'Income unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    description: 'Income label/name',
    example: 'Salary',
  })
  label: string;

  @ApiProperty({
    description: 'Income amount',
    example: 2800,
  })
  amount: number;

  @ApiProperty({
    description: 'Day of the month when income is received',
    example: 28,
  })
  dayOfMonth: number;

  @ApiProperty({
    description: 'Income category',
    example: 'salary',
  })
  category: string;

  @ApiProperty({
    description: 'Creation date',
    example: '2025-05-29T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update date',
    example: '2025-05-29T10:00:00.000Z',
  })
  updatedAt: Date;
}