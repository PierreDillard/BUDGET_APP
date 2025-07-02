import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, Min, IsOptional, IsIn, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

const UNEXPECTED_EXPENSE_CATEGORIES = ['medical', 'car_repair', 'home_repair', 'legal', 'emergency', 'technology', 'family', 'work', 'other'] as const;

export class CreateUnexpectedExpenseDto {
  @ApiProperty({
    description: 'Label for the unexpected expense',
    example: 'Réparation voiture urgente',
  })
  @IsString({ message: 'Label must be a string' })
  @IsNotEmpty({ message: 'Label is required' })
  label: string;

  @ApiProperty({
    description: 'Amount of the unexpected expense',
    example: 350.00,
    minimum: 0.01,
  })
  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(0.01, { message: 'Amount must be greater than 0' })
  amount: number;

  @ApiProperty({
    description: 'Date when the expense occurred',
    example: '2025-06-30',
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
    description: 'Category of the unexpected expense',
    example: 'car_repair',
    enum: UNEXPECTED_EXPENSE_CATEGORIES,
    required: false,
    default: 'other',
  })
  @IsOptional()
  @IsString({ message: 'Category must be a string' })
  @IsIn(UNEXPECTED_EXPENSE_CATEGORIES, { 
    message: `Category must be one of: ${UNEXPECTED_EXPENSE_CATEGORIES.join(', ')}` 
  })
  category?: string;

  @ApiProperty({
    description: 'Optional description of the unexpected expense',
    example: 'Changement de pneus suite à crevaison',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;
}