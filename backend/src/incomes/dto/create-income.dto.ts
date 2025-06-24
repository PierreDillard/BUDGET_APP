import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsInt, Min, Max, IsOptional } from 'class-validator';

export class CreateIncomeDto {
  @ApiProperty({
    description: 'Income label/name',
    example: 'Salary',
  })
  @IsString()
  label: string;

  @ApiProperty({
    description: 'Income amount',
    example: 2800,
  })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({
    description: 'Day of the month when income is received',
    example: 28,
    minimum: 1,
    maximum: 31,
  })
  @IsInt()
  @Min(1)
  @Max(31)
  dayOfMonth: number;

  @ApiProperty({
    description: 'Income category',
    example: 'salary',
    required: false,
  })
  @IsOptional()
  @IsString()
  category?: string;
}