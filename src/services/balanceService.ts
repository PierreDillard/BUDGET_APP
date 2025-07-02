import type { Balance, BalanceProjection } from '../types';
import { BaseApiService } from './baseApiService';
import type { BalanceAdjustmentRequest } from './types';

export class BalanceService extends BaseApiService {
  async getBalance(): Promise<Balance> {
    return this.request<Balance>('/balance');
  }

  async getBalanceProjection(): Promise<BalanceProjection[]> {
    return this.request<BalanceProjection[]>('/balance/projection');
  }

  async adjustBalance(adjustment: BalanceAdjustmentRequest): Promise<Balance> {
    return this.request<Balance>('/balance/adjust', {
      method: 'POST',
      body: JSON.stringify(adjustment),
    });
  }

  async triggerMonthlyReset(): Promise<{ message: string; newBalance: Balance }> {
    return this.request<{ message: string; newBalance: Balance }>('/balance/monthly-reset', {
      method: 'POST',
    });
  }

  async getMonthlyResetStatus(): Promise<{ lastReset: string; nextReset: string }> {
    return this.request<{ lastReset: string; nextReset: string }>('/balance/reset-status');
  }
}
