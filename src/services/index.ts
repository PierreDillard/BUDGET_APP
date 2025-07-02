import { AuthService } from './authService';
import { IncomeService } from './incomeService';
import { ExpenseService } from './expenseService';
import { PlannedExpenseService } from './plannedExpenseService';
import { BalanceService } from './balanceService';
import { UserService } from './userService';
import { TokenManager } from './tokenManager';

// Services individuels
export const authService = new AuthService();
export const incomeService = new IncomeService();
export const expenseService = new ExpenseService();
export const plannedExpenseService = new PlannedExpenseService();
export const balanceService = new BalanceService();
export const userService = new UserService();

// Service API principal qui combine tous les services pour maintenir la compatibilité
class ApiService {
  // Services d'authentification
  login = authService.login.bind(authService);
  register = authService.register.bind(authService);
  logout = authService.logout.bind(authService);
  getCurrentUser = authService.getCurrentUser.bind(authService);

  // Services de revenus
  getIncomes = incomeService.getIncomes.bind(incomeService);
  createIncome = incomeService.createIncome.bind(incomeService);
  updateIncome = incomeService.updateIncome.bind(incomeService);
  deleteIncome = incomeService.deleteIncome.bind(incomeService);

  // Services de dépenses
  getExpenses = expenseService.getExpenses.bind(expenseService);
  createExpense = expenseService.createExpense.bind(expenseService);
  updateExpense = expenseService.updateExpense.bind(expenseService);
  deleteExpense = expenseService.deleteExpense.bind(expenseService);

  // Services de dépenses planifiées
  getPlannedExpenses = plannedExpenseService.getPlannedExpenses.bind(plannedExpenseService);
  createPlannedExpense = plannedExpenseService.createPlannedExpense.bind(plannedExpenseService);
  updatePlannedExpense = plannedExpenseService.updatePlannedExpense.bind(plannedExpenseService);
  deletePlannedExpense = plannedExpenseService.deletePlannedExpense.bind(plannedExpenseService);
  markPlannedExpenseAsSpent = plannedExpenseService.markPlannedExpenseAsSpent.bind(plannedExpenseService);

  // Services de solde
  getBalance = balanceService.getBalance.bind(balanceService);
  getBalanceProjection = balanceService.getBalanceProjection.bind(balanceService);
  adjustBalance = balanceService.adjustBalance.bind(balanceService);
  triggerMonthlyReset = balanceService.triggerMonthlyReset.bind(balanceService);
  getMonthlyResetStatus = balanceService.getMonthlyResetStatus.bind(balanceService);

  // Services utilisateur
  updateUserProfile = userService.updateUserProfile.bind(userService);
  healthCheck = userService.healthCheck.bind(userService);
}

// Instance globale du service API pour maintenir la compatibilité
export const apiService = new ApiService();

// Exports pour la rétrocompatibilité et l'usage direct
export { TokenManager };

// Export des types
export type { 
  LoginRequest, 
  RegisterRequest, 
  LoginResponse, 
  BalanceAdjustmentRequest,
  AuthTokens 
} from './types';

// Export des classes de service pour un usage avancé
export {
  AuthService,
  IncomeService,
  ExpenseService,
  PlannedExpenseService,
  BalanceService,
  UserService
};
