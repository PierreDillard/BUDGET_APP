import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsNumber, IsEnum } from 'class-validator';

export class GetBalanceDto {
  @ApiProperty({
    description: 'Month for balance calculation (YYYY-MM format)',
    example: '2025-05',
    required: false,
  })
  @IsOptional()
  @IsString()
  month?: string;
}

export class GetProjectionDto {
  @ApiProperty({
    description: 'Month for projection calculation (YYYY-MM format)',
    example: '2025-05',
    required: false,
  })
  @IsOptional()
  @IsString()
  month?: string;

  @ApiProperty({
    description: 'Number of days for projection',
    example: 30,
    required: false,
    default: 30,
  })
  @IsOptional()
  days?: number;
}

export class BalanceAdjustmentDto {
  @ApiProperty({
    description: 'Amount to adjust (positive to add, negative to subtract)',
    example: 150.50,
  })
  @IsNumber()
  amount: number;

  @ApiProperty({
    description: 'Description of the adjustment',
    example: 'Correction for bank error',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Type of adjustment',
    enum: ['manual_adjustment', 'correction', 'MANUAL_ADJUSTMENT', 'CORRECTION', 'MONTHLY_RESET'],
    example: 'manual_adjustment',
    required: false,
  })
  @IsOptional()
  @IsEnum(['manual_adjustment', 'correction', 'MANUAL_ADJUSTMENT', 'CORRECTION', 'MONTHLY_RESET'])
  type?: 'manual_adjustment' | 'correction' | 'MANUAL_ADJUSTMENT' | 'CORRECTION' | 'MONTHLY_RESET';
}

export interface BalanceData {
  currentBalance: number;
  totalIncome: number;
  totalExpenses: number;
  totalPlanned: number;
  projectedBalance: number;
  marginAmount?: number;
  adjustments?: Array<{
    id: string;
    amount: number;
    description: string;
    date: string;
    type: string;
  }>;
}

export interface ProjectionData {
  date: string;
  balance: number;
  day: number;
  events?: {
    incomes: Array<{ label: string; amount: number }>;
    expenses: Array<{ label: string; amount: number }>;
    plannedExpenses: Array<{ label: string; amount: number }>;
  };
}

export interface AlertData {
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  date?: string;
  amount?: number;
}

export interface MonthlyResetDto {
  message: string;
  newBalance: BalanceData;
  resetDate: string;
  previousBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  netChange: number;
  lastResetDate: string | null;
}

export interface MonthlyResetStatusDto {
  lastReset: string | null;
  nextReset: string;
  isResetDue: boolean;
  daysSinceLastReset: number;
  monthStartDay: number;
}
