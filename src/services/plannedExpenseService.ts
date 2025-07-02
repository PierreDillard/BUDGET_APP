import type { PlannedExpense, CreatePlannedExpenseRequest } from '../types';
import { BaseApiService } from './baseApiService';

export class PlannedExpenseService extends BaseApiService {
  async getPlannedExpenses(): Promise<PlannedExpense[]> {
    return this.request<PlannedExpense[]>('/planned');
  }

  async createPlannedExpense(expense: CreatePlannedExpenseRequest): Promise<PlannedExpense> {
    return this.request<PlannedExpense>('/planned', {
      method: 'POST',
      body: JSON.stringify(expense),
    });
  }

  async updatePlannedExpense(id: string, expense: Partial<CreatePlannedExpenseRequest>): Promise<PlannedExpense> {
    return this.request<PlannedExpense>(`/planned/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(expense),
    });
  }

  async deletePlannedExpense(id: string): Promise<void> {
    return this.request<void>(`/planned/${id}`, {
      method: 'DELETE',
    });
  }

  async markPlannedExpenseAsSpent(id: string): Promise<PlannedExpense> {
    return this.request<PlannedExpense>(`/planned/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ spent: true }),
    });
  }
}
