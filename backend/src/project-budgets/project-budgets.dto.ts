import { IsString, IsNumber, IsOptional, Min, IsEnum } from 'class-validator';

export enum ProjectBudgetCategory {
  ELECTRONICS = 'ELECTRONICS',
  TRAVEL = 'TRAVEL',
  HOME_IMPROVEMENT = 'HOME_IMPROVEMENT',
  VEHICLE = 'VEHICLE',
  EDUCATION = 'EDUCATION',
  EMERGENCY_FUND = 'EMERGENCY_FUND',
  INVESTMENT = 'INVESTMENT',
  OTHER = 'OTHER'
}

export class CreateProjectBudgetDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  target_amount: number;

  @IsEnum(ProjectBudgetCategory)
  @IsOptional()
  category?: ProjectBudgetCategory;

  @IsString()
  @IsOptional()
  target_date?: string; // ISO date string
}

export class UpdateProjectBudgetDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  target_amount?: number;

  @IsEnum(ProjectBudgetCategory)
  @IsOptional()
  category?: ProjectBudgetCategory;

  @IsString()
  @IsOptional()
  target_date?: string;
}

export class AddContributionDto {
  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsOptional()
  description?: string;
}

export class MonthlyAllocationDto {
  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsOptional()
  description?: string;
}
