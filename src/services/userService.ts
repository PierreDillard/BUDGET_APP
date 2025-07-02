import type { User } from '../types';
import { BaseApiService } from './baseApiService';

export class UserService extends BaseApiService {
  async updateUserProfile(updates: Partial<User>): Promise<User> {
    return this.request<User>('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/health');
  }
}
