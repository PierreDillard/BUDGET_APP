export interface User {
  id: string;
  email: string;
  currency: string;
  monthStartDay: number;
  marginPct: number;
  notification: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface RecIncome {
  id: string;
  userId: string;
  label: string;
  amount: number;
  dayOfMonth: number;
  category?: string;
  frequency: FrequencyType;
  frequencyData?: FrequencyData;
  createdAt?: string;
  updatedAt?: string;
}

export interface RecExpense {
  id: string;
  userId: string;
  label: string;
  amount: number;
  dayOfMonth: number;
  category?: string;
  frequency: FrequencyType;
  frequencyData?: FrequencyData;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlannedExpense {
  id: string;
  userId: string;
  label: string;
  amount: number;
  date: string;
  spent: boolean;
  category?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Balance {
  currentBalance: number;
  totalIncome: number;
  totalExpenses: number;
  totalPlanned: number;
  projectedBalance: number;
  marginAmount?: number;
  adjustments?: BalanceAdjustment[];
}

export interface BalanceAdjustment {
  id: string;
  amount: number;
  description: string;
  date: string;
  type: 'manual_adjustment' | 'monthly_reset' | 'correction';
}

export interface BalanceProjection {
  date: string;
  balance: number;
  projectedIncome?: number;
  projectedExpenses?: number;
}

export interface Alert {
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  timestamp?: string;
}

export type Currency = 'EUR' | 'USD' | 'GBP';

// Frequency types
export type FrequencyType = 'ONE_TIME' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

export interface FrequencyData {
  // For quarterly: which months (1-12)
  // For yearly: which month (1-12)
  // For one-time: specific date
  months?: number[];
  date?: string;
}

// Request types for API calls
export interface CreateIncomeRequest {
  label: string;
  amount: number;
  dayOfMonth: number;
  category?: string;
  frequency: FrequencyType;
  frequencyData?: FrequencyData;
}

export interface CreateExpenseRequest {
  label: string;
  amount: number;
  dayOfMonth: number;
  category?: string;
  frequency: FrequencyType;
  frequencyData?: FrequencyData;
}

export interface CreatePlannedExpenseRequest {
  label: string;
  amount: number;
  date: string;
  category?: string;
}

export interface CreateUnexpectedExpenseRequest {
  label: string;
  amount: number;
  category: UnexpectedExpenseCategory;
  date: string;
  description?: string;
}

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  currency?: string;
  monthStartDay?: number;
  marginPct?: number;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Balance adjustment types
export interface BalanceAdjustmentRequest {
  amount: number;
  description: string;
  type?: 'manual_adjustment' | 'correction';
}

// Monthly reset types
export interface MonthlyResetResponse {
  message: string;
  newBalance: Balance;
  resetDate: string;
  previousBalance: number;
}

export interface MonthlyResetStatus {
  lastReset: string | null;
  nextReset: string;
  isResetDue: boolean;
  daysSinceLastReset: number;
}

// Unexpected Expenses types
export interface UnexpectedExpense {
  id: string;
  label: string;
  amount: number;
  category: UnexpectedExpenseCategory;
  date: string;
  description?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export type UnexpectedExpenseCategory = 
  | 'medical'
  | 'car_repair'
  | 'home_repair'
  | 'family'
  | 'work'
  | 'technology'
  | 'legal'
  | 'emergency'
  | 'other';

// Categories
export type IncomeCategory = 
  | 'salary'
  | 'freelance'
  | 'investment'
  | 'allowance'
  | 'other';

export type ExpenseCategory = 
  | 'rent'
  | 'utilities'
  | 'insurance'
  | 'food'
  | 'transport'
  | 'health'
  | 'subscription'
  | 'other';

export type PlannedExpenseCategory = 
  | 'travel'
  | 'equipment'
  | 'clothing'
  | 'electronics'
  | 'home'
  | 'health'
  | 'education'
  | 'gift'
  | 'other';

// API response wrapper types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
  timestamp: string;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// Statistics types
export interface IncomeStatistics {
  totalAmount: number;
  averageAmount: number;
  categoryBreakdown: Record<IncomeCategory, number>;
  monthlyProjection: number;
}

export interface ExpenseStatistics {
  totalAmount: number;
  averageAmount: number;
  categoryBreakdown: Record<ExpenseCategory, number>;
  monthlyProjection: number;
  upcomingPayments: Array<{
    id: string;
    label: string;
    amount: number;
    daysUntilDue: number;
  }>;
}

export interface PlannedExpenseStatistics {
  totalAmount: number;
  spentAmount: number;
  remainingAmount: number;
  categoryBreakdown: Record<PlannedExpenseCategory, number>;
  overdueCount: number;
  upcomingCount: number;
}

// Dashboard types
export interface DashboardData {
  balance: Balance;
  projection: BalanceProjection[];
  alerts: Alert[];
  monthlyStatistics: {
    income: IncomeStatistics;
    expenses: ExpenseStatistics;
    plannedExpenses: PlannedExpenseStatistics;
  };
  recentActivity: Array<{
    id: string;
    type: 'income' | 'expense' | 'planned_expense' | 'balance_adjustment';
    description: string;
    amount: number;
    date: string;
  }>;
}

// Export project budget types
export * from './projectBudget';
