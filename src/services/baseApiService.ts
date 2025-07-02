import { API_BASE_URL } from './config';
import { TokenManager } from './tokenManager';

export abstract class BaseApiService {
  protected baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Méthode pour faire des requêtes HTTP avec gestion des erreurs et de l'authentification
  protected async request<T>(
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

  private async refreshTokens(): Promise<boolean> {
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
}
