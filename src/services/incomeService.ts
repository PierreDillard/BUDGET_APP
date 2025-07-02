import type { RecIncome, CreateIncomeRequest } from '../types';
import { BaseApiService } from './baseApiService';

export class IncomeService extends BaseApiService {
  async getIncomes(): Promise<RecIncome[]> {
    return this.request<RecIncome[]>('/incomes');
  }

  async createIncome(income: CreateIncomeRequest): Promise<RecIncome> {
    return this.request<RecIncome>('/incomes', {
      method: 'POST',
      body: JSON.stringify(income),
    });
  }

  async updateIncome(id: string, income: Partial<CreateIncomeRequest>): Promise<RecIncome> {
    return this.request<RecIncome>(`/incomes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(income),
    });
  }

  async deleteIncome(id: string): Promise<void> {
    return this.request<void>(`/incomes/${id}`, {
      method: 'DELETE',
    });
  }
}
