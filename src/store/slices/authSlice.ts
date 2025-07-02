import { apiService, TokenManager } from '../../services/api';
import type { AuthState, AuthActions, SliceCreator } from '../types';
import type { LoginRequest, RegisterRequest, User } from '../../types';

export const createAuthSlice: SliceCreator<AuthState & AuthActions> = (set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: TokenManager.isAuthenticated(),

  // Actions
  login: async (credentials: LoginRequest) => {
    try {
      set((state) => ({ ...state, isLoading: true, error: null }));
      const response = await apiService.login(credentials);
      set((state) => ({ 
        ...state,
        user: response.user, 
        isAuthenticated: true,
        isLoading: false 
      }));
      
      // Load all data after login
      await get().loadAllData();
    } catch (error) {
      set((state) => ({ 
        ...state,
        error: error instanceof Error ? error.message : 'Erreur de connexion',
        isLoading: false 
      }));
      throw error;
    }
  },

  register: async (userData: RegisterRequest) => {
    try {
      set((state) => ({ ...state, isLoading: true, error: null }));
      const response = await apiService.register(userData);
      set((state) => ({ 
        ...state,
        user: response.user, 
        isAuthenticated: true,
        isLoading: false 
      }));
      
      // Load all data after registration
      await get().loadAllData();
    } catch (error) {
      set((state) => ({ 
        ...state,
        error: error instanceof Error ? error.message : 'Erreur d\'inscription',
        isLoading: false 
      }));
      throw error;
    }
  },

  logout: async () => {
    try {
      await apiService.logout();
    } finally {
      set((state) => ({ 
        ...state,
        user: null, 
        isAuthenticated: false,
        incomes: [],
        expenses: [],
        plannedExpenses: [],
        balance: null,
        projection: [],
        alerts: [],
        error: null
      }));
    }
  },

  checkAuth: async () => {
    if (!TokenManager.isAuthenticated()) {
      set((state) => ({ ...state, isAuthenticated: false, user: null }));
      return;
    }

    try {
      const user = await apiService.getCurrentUser();
      set((state) => ({ ...state, user, isAuthenticated: true }));
      await get().loadAllData();
    } catch (error) {
      console.error('Échec de vérification de l\'authentification:', error);
      TokenManager.clearTokens();
      set((state) => ({ ...state, isAuthenticated: false, user: null }));
    }
  },

  setUser: (user: User | null) => set((state) => ({ ...state, user })),
  
  setAuthenticated: (authenticated: boolean) => 
    set((state) => ({ ...state, isAuthenticated: authenticated })),

  updateProfile: async (updates: Partial<User>) => {
    try {
      set((state) => ({ ...state, isLoading: true }));
      const updatedUser = await apiService.updateUserProfile(updates);
      set((state) => ({ ...state, user: updatedUser, isLoading: false }));
      get().addAlert({
        type: 'info',
        title: 'Profil',
        message: 'Profil mis à jour avec succès'
      });
    } catch (error) {
      set((state) => ({ 
        ...state,
        error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour du profil',
        isLoading: false 
      }));
      throw error;
    }
  },
});
