import type { User } from '../types';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

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

export interface BalanceAdjustmentRequest {
  amount: number;
  description: string;
}
