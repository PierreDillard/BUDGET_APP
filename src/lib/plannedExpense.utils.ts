// Utility functions for planned expenses
import type { PlannedExpense } from '@/types';

/**
 * Check if a planned expense is expired (date is in the past)
 */
export function isPlannedExpenseExpired(dateString: string): boolean {
  const today = new Date();
  const expenseDate = new Date(dateString);
  
  // Set hours to 0 for date comparison
  today.setHours(0, 0, 0, 0);
  expenseDate.setHours(0, 0, 0, 0);
  
  return expenseDate < today;
}

/**
 * Filter out expired planned expenses that are not spent
 * This removes clutter from the UI by hiding old expenses that won't happen
 */
export function filterActiveOrSpentPlannedExpenses(expenses: PlannedExpense[]): PlannedExpense[] {
  return expenses.filter(expense => {
    // Keep if already spent (for history)
    if (expense.spent) {
      return true;
    }
    
    // Keep if not expired (upcoming)
    return !isPlannedExpenseExpired(expense.date);
  });
}

/**
 * Check if a planned expense is upcoming (date is today or in the future)
 */
export function isPlannedExpenseUpcoming(dateString: string): boolean {
  const today = new Date();
  const expenseDate = new Date(dateString);
  
  // Set hours to 0 for date comparison
  today.setHours(0, 0, 0, 0);
  expenseDate.setHours(0, 0, 0, 0);
  
  return expenseDate >= today;
}

/**
 * Sort planned expenses by date (closest first)
 */
export function sortPlannedExpensesByDate(expenses: PlannedExpense[]): PlannedExpense[] {
  return [...expenses].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}