import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, Min, Max, IsOptional, IsIn } from 'class-validator';

const EXPENSE_CATEGORIES = ['rent', 'utilities', 'insurance', 'food', 'transport', 'health', 'subscription', 'other'] as const;

export class CreateExpenseDto {
  @ApiProperty({
    description: 'Label for the expense',
    example: 'Loyer appartement',
  })
  @IsString({ message: 'Label must be a string' })
  @IsNotEmpty({ message: 'Label is required' })
  label: string;

  @ApiProperty({
    description: 'Amount of the expense',
    example: 800.00,
    minimum: 0.01,
  })
  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(0.01, { message: 'Amount must be greater than 0' })
  amount: number;

  @ApiProperty({
    description: 'Day of the month when expense is due (1-31)',
    example: 1,
    minimum: 1,
    maximum: 31,
  })
  @IsNumber({}, { message: 'Day of month must be a number' })
  @Min(1, { message: 'Day of month must be between 1 and 31' })
  @Max(31, { message: 'Day of month must be between 1 and 31' })
  dayOfMonth: number;

  @ApiProperty({
    description: 'Category of the expense',
    example: 'rent',
    enum: EXPENSE_CATEGORIES,
    required: false,
    default: 'other',
  })
  @IsOptional()
  @IsString({ message: 'Category must be a string' })
  @IsIn(EXPENSE_CATEGORIES, { 
    message: `Category must be one of: ${EXPENSE_CATEGORIES.join(', ')}` 
  })
  category?: string;
}

export class UpdateExpenseDto {
  @ApiProperty({
    description: 'Label for the expense',
    example: 'Loyer appartement',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Label must be a string' })
  @IsNotEmpty({ message: 'Label cannot be empty' })
  label?: string;

  @ApiProperty({
    description: 'Amount of the expense',
    example: 800.00,
    minimum: 0.01,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(0.01, { message: 'Amount must be greater than 0' })
  amount?: number;

  @ApiProperty({
    description: 'Day of the month when expense is due (1-31)',
    example: 1,
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
    description: 'Category of the expense',
    example: 'rent',
    enum: EXPENSE_CATEGORIES,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Category must be a string' })
  @IsIn(EXPENSE_CATEGORIES, { 
    message: `Category must be one of: ${EXPENSE_CATEGORIES.join(', ')}` 
  })
  category?: string;
}