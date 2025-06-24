import type { 
  User, 
  RecIncome, 
  RecExpense, 
  PlannedExpense, 
  Balance,
  BalanceProjection,
  CreateIncomeRequest,
  CreateExpenseRequest,
  CreatePlannedExpenseRequest
} from '../types';





// Configuration de l'API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  currency?: string;
  monthStartDay?: number;
  marginPct?: number;
}

interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface BalanceAdjustmentRequest {
  amount: number;
  description: string;
}

// Gestion des tokens
class TokenManager {
  private static readonly ACCESS_TOKEN_KEY = 'budget_access_token';
  private static readonly REFRESH_TOKEN_KEY = 'budget_refresh_token';

  static getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static setTokens(tokens: AuthTokens): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
  }

  static clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  static isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}

// Service API principal
class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Méthode pour faire des requêtes HTTP avec gestion des erreurs et de l'authentification
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const accessToken = TokenManager.getAccessToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Si le token a expiré, essayer de le rafraîchir
      if (response.status === 401 && accessToken) {
        const refreshed = await this.refreshTokens();
        if (refreshed) {
          // Refaire la requête avec le nouveau token
          headers.Authorization = `Bearer ${TokenManager.getAccessToken()}`;
          const retryResponse = await fetch(url, {
            ...options,
            headers,
          });
          return this.handleResponse<T>(retryResponse);
        } else {
          // Échec du refresh, déconnecter l'utilisateur
          TokenManager.clearTokens();
          throw new Error('Session expirée, veuillez vous reconnecter');
        }
      }

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error(`Erreur lors de la requête ${endpoint}:`, error);
      throw error;
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `Erreur ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        console.log('Données d\'erreur:', errorData);
        console.log('Message d\'erreur:', errorData.message);
        console.log('Trace de la pile:', response);
        errorMessage = errorData.message || errorMessage;
      } catch {
        // Ignorer les erreurs de parsing JSON
      }
      
      throw new Error(errorMessage);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    return response.text() as unknown as T;
  }

  // === AUTHENTIFICATION ===

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

  async refreshTokens(): Promise<boolean> {
    try {
      const refreshToken = TokenManager.getRefreshToken();
      if (!refreshToken) return false;

      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return false;

      const tokens = await response.json();
      TokenManager.setTokens(tokens);
      return true;
    } catch {
      return false;
    }
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  // === GESTION DES REVENUS ===

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

  // === GESTION DES DÉPENSES ===

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

  // === GESTION DES BUDGETS PONCTUELS ===

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

  // === CALCULS DE SOLDE ===

  async getBalance(): Promise<Balance> {
    return this.request<Balance>('/balance');
  }

  async getBalanceProjection(): Promise<BalanceProjection[]> {
    return this.request<BalanceProjection[]>('/balance/projection');
  }

  // === MODIFICATION DIRECTE DU SOLDE ===
  
  async adjustBalance(adjustment: BalanceAdjustmentRequest): Promise<Balance> {
    return this.request<Balance>('/balance/adjust', {
      method: 'POST',
      body: JSON.stringify(adjustment),
    });
  }

  // === GESTION DU PROFIL UTILISATEUR ===

  async updateUserProfile(updates: Partial<User>): Promise<User> {
    return this.request<User>('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // === RÉINITIALISATION MENSUELLE ===

  async triggerMonthlyReset(): Promise<{ message: string; newBalance: Balance }> {
    return this.request<{ message: string; newBalance: Balance }>('/balance/monthly-reset', {
      method: 'POST',
    });
  }

  async getMonthlyResetStatus(): Promise<{ lastReset: string; nextReset: string }> {
    return this.request<{ lastReset: string; nextReset: string }>('/balance/reset-status');
  }

  // === HEALTH CHECK ===

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/health');
  }
}

// Instance globale du service API
export const apiService = new ApiService();

// Export du gestionnaire de tokens pour un usage externe si nécessaire
export { TokenManager };

// Types pour les réponses d'API
export type { LoginRequest, RegisterRequest, LoginResponse, BalanceAdjustmentRequest };
