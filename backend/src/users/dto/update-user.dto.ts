import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsNumber, Min, Max, IsIn } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    description: 'Preferred currency',
    example: 'EUR',
    enum: ['EUR', 'USD', 'GBP'],
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(['EUR', 'USD', 'GBP'], { message: 'Currency must be EUR, USD, or GBP' })
  currency?: string;

  @ApiProperty({
    description: 'Day of the month to start budget calculation (1-28)',
    example: 1,
    minimum: 1,
    maximum: 28,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Month start day must be a number' })
  @Min(1, { message: 'Month start day must be between 1 and 28' })
  @Max(28, { message: 'Month start day must be between 1 and 28' })
  monthStartDay?: number;

  @ApiProperty({
    description: 'Margin percentage for safety calculations (0-50)',
    example: 5,
    minimum: 0,
    maximum: 50,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Margin percentage must be a number' })
  @Min(0, { message: 'Margin percentage must be between 0 and 50' })
  @Max(50, { message: 'Margin percentage must be between 0 and 50' })
  marginPct?: number;

  @ApiProperty({
    description: 'Enable or disable notifications',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Notification must be a boolean value' })
  notification?: boolean;
}