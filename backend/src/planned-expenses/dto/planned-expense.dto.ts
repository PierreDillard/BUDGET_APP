import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, Min, IsOptional, IsIn, IsDateString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

const PLANNED_EXPENSE_CATEGORIES = ['travel', 'equipment', 'clothing', 'electronics', 'home', 'health', 'education', 'gift', 'other'] as const;

export class CreatePlannedExpenseDto {
  @ApiProperty({
    description: 'Label for the planned expense',
    example: 'Voyage d\'été',
  })
  @IsString({ message: 'Label must be a string' })
  @IsNotEmpty({ message: 'Label is required' })
  label: string;

  @ApiProperty({
    description: 'Amount of the planned expense',
    example: 1500.00,
    minimum: 0.01,
  })
  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(0.01, { message: 'Amount must be greater than 0' })
  amount: number;

  @ApiProperty({
    description: 'Date when the expense is planned',
    example: '2025-07-15',
    type: 'string',
    format: 'date',
  })
  @IsDateString({}, { message: 'Date must be a valid date string (YYYY-MM-DD)' })
  @Transform(({ value }) => {
    // Ensure we handle date properly
    if (typeof value === 'string') {
      return value;
    }
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }
    return value;
  })
  date: string;

  @ApiProperty({
    description: 'Category of the planned expense',
    example: 'travel',
    enum: PLANNED_EXPENSE_CATEGORIES,
    required: false,
    default: 'other',
  })
  @IsOptional()
  @IsString({ message: 'Category must be a string' })
  @IsIn(PLANNED_EXPENSE_CATEGORIES, { 
    message: `Category must be one of: ${PLANNED_EXPENSE_CATEGORIES.join(', ')}` 
  })
  category?: string;
}

export class UpdatePlannedExpenseDto {
  @ApiProperty({
    description: 'Label for the planned expense',
    example: 'Voyage d\'été',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Label must be a string' })
  @IsNotEmpty({ message: 'Label cannot be empty' })
  label?: string;

  @ApiProperty({
    description: 'Amount of the planned expense',
    example: 1500.00,
    minimum: 0.01,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(0.01, { message: 'Amount must be greater than 0' })
  amount?: number;

  @ApiProperty({
    description: 'Date when the expense is planned',
    example: '2025-07-15',
    type: 'string',
    format: 'date',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Date must be a valid date string (YYYY-MM-DD)' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value;
    }
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }
    return value;
  })
  date?: string;

  @ApiProperty({
    description: 'Whether the expense has been spent',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Spent must be a boolean value' })
  spent?: boolean;

  @ApiProperty({
    description: 'Category of the planned expense',
    example: 'travel',
    enum: PLANNED_EXPENSE_CATEGORIES,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Category must be a string' })
  @IsIn(PLANNED_EXPENSE_CATEGORIES, { 
    message: `Category must be one of: ${PLANNED_EXPENSE_CATEGORIES.join(', ')}` 
  })
  category?: string;
}

export class MarkAsSpentDto {
  @ApiProperty({
    description: 'Whether the expense has been spent',
    example: true,
  })
  @IsBoolean({ message: 'Spent must be a boolean value' })
  spent: boolean;
}