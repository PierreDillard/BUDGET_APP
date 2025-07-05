import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, Min, Max, IsOptional, IsIn, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

const INCOME_CATEGORIES = ['salary', 'freelance', 'investment', 'allowance', 'other'] as const;

export enum FrequencyType {
  ONE_TIME = 'ONE_TIME',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
}

export class FrequencyDataDto {
  @ApiProperty({
    description: 'Months for quarterly/yearly frequency (1-12)',
    example: [1, 4, 7, 10],
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { each: true })
  @Min(1, { each: true })
  @Max(12, { each: true })
  months?: number[];

  @ApiProperty({
    description: 'Specific date for one-time frequency',
    example: '2024-12-31',
    required: false,
  })
  @IsOptional()
  @IsString()
  date?: string;
}

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

  @ApiProperty({
    description: 'Frequency of the income',
    example: FrequencyType.MONTHLY,
    enum: FrequencyType,
    default: FrequencyType.MONTHLY,
  })
  @IsEnum(FrequencyType, { message: 'Frequency must be a valid frequency type' })
  frequency: FrequencyType;

  @ApiProperty({
    description: 'Additional frequency data',
    type: FrequencyDataDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FrequencyDataDto)
  frequencyData?: FrequencyDataDto;
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

  @ApiProperty({
    description: 'Frequency of the income',
    example: FrequencyType.MONTHLY,
    enum: FrequencyType,
    required: false,
  })
  @IsOptional()
  @IsEnum(FrequencyType, { message: 'Frequency must be a valid frequency type' })
  frequency?: FrequencyType;

  @ApiProperty({
    description: 'Additional frequency data',
    type: FrequencyDataDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FrequencyDataDto)
  frequencyData?: FrequencyDataDto;
}