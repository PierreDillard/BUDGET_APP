// Re-export everything from the new modular structure for backward compatibility
export * from './index';

// Specific exports to maintain exact compatibility
export { apiService, TokenManager } from './index';
export type { LoginRequest, RegisterRequest, LoginResponse, BalanceAdjustmentRequest } from './index';
