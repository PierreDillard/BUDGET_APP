import type { RecExpense, CreateExpenseRequest } from '../types';
import { BaseApiService } from './baseApiService';

export class ExpenseService extends BaseApiService {
  async getExpenses(): Promise<RecExpense[]> {
    return this.request<RecExpense[]>('/expenses');
  }

  async createExpense(expense: CreateExpenseRequest): Promise<RecExpense> {
    return this.request<RecExpense>('/expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    });
  }

  async updateExpense(id: string, expense: Partial<CreateExpenseRequest>): Promise<RecExpense> {
    return this.request<RecExpense>(`/expenses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(expense),
    });
  }

  async deleteExpense(id: string): Promise<void> {
    return this.request<void>(`/expenses/${id}`, {
      method: 'DELETE',
    });
  }
}
