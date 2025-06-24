import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({
    description: 'User unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Preferred currency',
    example: 'EUR',
  })
  currency: string;

  @ApiProperty({
    description: 'Day of the month when the budget period starts',
    example: 1,
  })
  monthStartDay: number;

  @ApiProperty({
    description: 'Safety margin percentage',
    example: 5,
  })
  marginPct: number;

  @ApiProperty({
    description: 'Enable/disable notifications',
    example: true,
  })
  notification: boolean;

  @ApiProperty({
    description: 'User creation date',
    example: '2025-05-29T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'User last update date',
    example: '2025-05-29T10:00:00.000Z',
  })
  updatedAt: Date;
}