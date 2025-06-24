import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, Min, Max, IsOptional, IsIn } from 'class-validator';

const INCOME_CATEGORIES = ['salary', 'freelance', 'investment', 'allowance', 'other'] as const;

export class CreateIncomeDto {
  @ApiProperty({
    description: 'Label for the income',
    example: 'Salaire principal',
  })
  @IsString({ message: 'Label must be a string' })
  @IsNotEmpty({ message: 'Label is required' })
  label: string;

  @ApiProperty({
    description: 'Amount of the income',
    example: 2500.50,
    minimum: 0.01,
  })
  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(0.01, { message: 'Amount must be greater than 0' })
  amount: number;

  @ApiProperty({
    description: 'Day of the month when income is received (1-31)',
    example: 28,
    minimum: 1,
    maximum: 31,
  })
  @IsNumber({}, { message: 'Day of month must be a number' })
  @Min(1, { message: 'Day of month must be between 1 and 31' })
  @Max(31, { message: 'Day of month must be between 1 and 31' })
  dayOfMonth: number;

  @ApiProperty({
    description: 'Category of the income',
    example: 'salary',
    enum: INCOME_CATEGORIES,
    required: false,
    default: 'salary',
  })
  @IsOptional()
  @IsString({ message: 'Category must be a string' })
  @IsIn(INCOME_CATEGORIES, { 
    message: `Category must be one of: ${INCOME_CATEGORIES.join(', ')}` 
  })
  category?: string;
}

export class UpdateIncomeDto {
  @ApiProperty({
    description: 'Label for the income',
    example: 'Salaire principal',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Label must be a string' })
  @IsNotEmpty({ message: 'Label cannot be empty' })
  label?: string;

  @ApiProperty({
    description: 'Amount of the income',
    example: 2500.50,
    minimum: 0.01,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(0.01, { message: 'Amount must be greater than 0' })
  amount?: number;

  @ApiProperty({
    description: 'Day of the month when income is received (1-31)',
    example: 28,
    minimum: 1,
    maximum: 31,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Day of month must be a number' })
  @Min(1, { message: 'Day of month must be between 1 and 31' })
  @Max(31, { message: 'Day of month must be between 1 and 31' })
  dayOfMonth?: number;

  @ApiProperty({
    description: 'Category of the income',
    example: 'salary',
    enum: INCOME_CATEGORIES,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Category must be a string' })
  @IsIn(INCOME_CATEGORIES, { 
    message: `Category must be one of: ${INCOME_CATEGORIES.join(', ')}` 
  })
  category?: string;
}