import type { User } from '../types';
import { BaseApiService } from './baseApiService';
import { TokenManager } from './tokenManager';
import type { LoginRequest, RegisterRequest, LoginResponse } from './types';

export class AuthService extends BaseApiService {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    TokenManager.setTokens({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    });

    return response;
  }

  async register(userData: RegisterRequest): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    TokenManager.setTokens({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    });

    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', {
        method: 'POST',
      });
    } finally {
      TokenManager.clearTokens();
    }
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/me');
  }
}
