export interface ProjectBudget {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  category: ProjectBudgetCategory;
  target_date?: Date;
  status: ProjectBudgetStatus;
  created_at: Date;
  updated_at: Date;
  contributions?: BudgetContribution[];
}

export interface BudgetContribution {
  id: string;
  project_budget_id: string;
  user_id: string;
  amount: number;
  description?: string;
  created_at: Date;
}

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

export enum ProjectBudgetStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED'
}

export interface CreateProjectBudgetRequest {
  name: string;
  description?: string;
  target_amount: number;
  category: ProjectBudgetCategory;
  target_date?: Date;
}

export interface UpdateProjectBudgetRequest {
  name?: string;
  description?: string;
  target_amount?: number;
  category?: ProjectBudgetCategory;
  target_date?: Date;
  status?: ProjectBudgetStatus;
}

export interface AddContributionRequest {
  amount: number;
  description?: string;
}

export interface ProjectBudgetStats {
  totalBudgets: number;
  activeBudgets: number;
  completedBudgets: number;
  pausedBudgets: number;
  totalTargetAmount: number;
  totalCurrentAmount: number;
  totalContributions: number;
  completionRate: number;
}
