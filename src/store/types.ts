import type { 
  User, 
  RecIncome, 
  RecExpense, 
  PlannedExpense, 
  Balance, 
  BalanceProjection,
  Alert,
  LoginRequest,
  RegisterRequest,
  CreateIncomeRequest,
  CreateExpenseRequest,
  CreatePlannedExpenseRequest,
  BalanceAdjustmentRequest
} from '../types';

// Auth slice state and actions
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface AuthActions {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

// Income slice state and actions
export interface IncomeState {
  incomes: RecIncome[];
}

export interface IncomeActions {
  setIncomes: (incomes: RecIncome[]) => void;
  addIncome: (income: CreateIncomeRequest) => Promise<void>;
  updateIncome: (id: string, income: Partial<CreateIncomeRequest>) => Promise<void>;
  removeIncome: (id: string) => Promise<void>;
}

// Expense slice state and actions
export interface ExpenseState {
  expenses: RecExpense[];
}

export interface ExpenseActions {
  setExpenses: (expenses: RecExpense[]) => void;
  addExpense: (expense: CreateExpenseRequest) => Promise<void>;
  updateExpense: (id: string, expense: Partial<CreateExpenseRequest>) => Promise<void>;
  removeExpense: (id: string) => Promise<void>;
}

// Planned Expense slice state and actions
export interface PlannedExpenseState {
  plannedExpenses: PlannedExpense[];
}

export interface PlannedExpenseActions {
  setPlannedExpenses: (plannedExpenses: PlannedExpense[]) => void;
  addPlannedExpense: (expense: CreatePlannedExpenseRequest) => Promise<void>;
  updatePlannedExpense: (id: string, expense: Partial<CreatePlannedExpenseRequest>) => Promise<void>;
  removePlannedExpense: (id: string) => Promise<void>;
  markPlannedExpenseAsSpent: (id: string) => Promise<void>;
}

// Balance slice state and actions
export interface BalanceState {
  balance: Balance | null;
  projection: BalanceProjection[];
}

export interface BalanceActions {
  setBalance: (balance: Balance) => void;
  setProjection: (projection: BalanceProjection[]) => void;
  loadBalance: () => Promise<void>;
  loadProjection: () => Promise<void>;
  adjustBalance: (adjustment: BalanceAdjustmentRequest) => Promise<void>;
  triggerMonthlyReset: () => Promise<void>;
  calculateBalance: () => void;
  setDirectBalance: (amount: number) => Promise<void>;
}

// UI slice state and actions
export interface UIState {
  currentTab: string;
  isLoading: boolean;
  error: string | null;
  alerts: Alert[];
}

export interface UIActions {
  setCurrentTab: (tab: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setAlerts: (alerts: Alert[]) => void;
  addAlert: (alert: Alert) => void;
  removeAlert: (index: number) => void;
  dismissMonthlyResetAlert: () => void;
}

// Combined store interface
export interface BudgetStore extends 
  AuthState, 
  IncomeState, 
  ExpenseState, 
  PlannedExpenseState, 
  BalanceState, 
  UIState,
  AuthActions,
  IncomeActions,
  ExpenseActions,
  PlannedExpenseActions,
  BalanceActions,
  UIActions {
  // Global actions
  loadAllData: () => Promise<void>;
  clearData: () => void;
  // Temporary unexpected expenses (as any for now)
  unexpectedExpenses?: any[];
  loadUnexpectedExpenses?: () => Promise<void>;
  addUnexpectedExpense?: (expense: any) => Promise<void>;
  updateUnexpectedExpense?: (id: string, expense: any) => Promise<void>;
  removeUnexpectedExpense?: (id: string) => Promise<void>;
}

// Slice creator type
export type SliceCreator<T> = (
  set: (fn: (state: BudgetStore) => Partial<BudgetStore>) => void,
  get: () => BudgetStore
) => T;
