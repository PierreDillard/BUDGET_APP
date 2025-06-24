import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiService, TokenManager } from '../services/api';
import type { 
  User, 
  RecIncome, 
  RecExpense, 
  PlannedExpense, 
  Balance, 
  BalanceProjection,
  Alert,
  LoginRequest,
  RegisterRequest,
  CreateIncomeRequest,
  CreateExpenseRequest,
  CreatePlannedExpenseRequest,
  BalanceAdjustmentRequest
} from '../types';

interface BudgetStore {
  // User state
  user: User | null;
  isAuthenticated: boolean;
  
  // Data state
  incomes: RecIncome[];
  expenses: RecExpense[];
  plannedExpenses: PlannedExpense[];
  balance: Balance | null;
  projection: BalanceProjection[];
  alerts: Alert[];
  
  // UI state
  currentTab: string;
  isLoading: boolean;
  error: string | null;
  
  // Auth actions
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  
  // Data actions
  loadAllData: () => Promise<void>;
  setUser: (user: User | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setIncomes: (incomes: RecIncome[]) => void;
  setExpenses: (expenses: RecExpense[]) => void;
  setPlannedExpenses: (plannedExpenses: PlannedExpense[]) => void;
  setBalance: (balance: Balance) => void;
  setProjection: (projection: BalanceProjection[]) => void;
  setAlerts: (alerts: Alert[]) => void;
  setCurrentTab: (tab: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // CRUD actions with API
  addIncome: (income: CreateIncomeRequest) => Promise<void>;
  updateIncome: (id: string, income: Partial<CreateIncomeRequest>) => Promise<void>;
  removeIncome: (id: string) => Promise<void>;
  
  addExpense: (expense: CreateExpenseRequest) => Promise<void>;
  updateExpense: (id: string, expense: Partial<CreateExpenseRequest>) => Promise<void>;
  removeExpense: (id: string) => Promise<void>;
  
  addPlannedExpense: (expense: CreatePlannedExpenseRequest) => Promise<void>;
  updatePlannedExpense: (id: string, expense: Partial<CreatePlannedExpenseRequest>) => Promise<void>;
  removePlannedExpense: (id: string) => Promise<void>;
  markPlannedExpenseAsSpent: (id: string) => Promise<void>;
  
  // Balance actions
  loadBalance: () => Promise<void>;
  loadProjection: () => Promise<void>;
  adjustBalance: (adjustment: BalanceAdjustmentRequest) => Promise<void>;
  
  // Monthly reset
  triggerMonthlyReset: () => Promise<void>;
  
  // Profile management
  updateProfile: (updates: Partial<User>) => Promise<void>;
  
  // Utility actions
  calculateBalance: () => void;
  clearData: () => void;
  addAlert: (alert: Alert) => void;
  removeAlert: (index: number) => void;
}

export const useBudgetStore = create<BudgetStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: TokenManager.isAuthenticated(),
      incomes: [],
      expenses: [],
      plannedExpenses: [],
      balance: null,
      projection: [],
      alerts: [],
      currentTab: 'dashboard',
      isLoading: false,
      error: null,
      
      // Auth actions
      login: async (credentials: LoginRequest) => {
        try {
          set({ isLoading: true, error: null });
          const response = await apiService.login(credentials);
          set({ 
            user: response.user, 
            isAuthenticated: true,
            isLoading: false 
          });
          
          // Charger toutes les données après connexion
          await get().loadAllData();
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erreur de connexion',
            isLoading: false 
          });
          throw error;
        }
      },

      register: async (userData: RegisterRequest) => {
        try {
          set({ isLoading: true, error: null });
          const response = await apiService.register(userData);
          set({ 
            user: response.user, 
            isAuthenticated: true,
            isLoading: false 
          });
          
          // Charger toutes les données après inscription
          await get().loadAllData();
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erreur d\'inscription',
            isLoading: false 
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          await apiService.logout();
        } finally {
          set({ 
            user: null, 
            isAuthenticated: false,
            incomes: [],
            expenses: [],
            plannedExpenses: [],
            balance: null,
            projection: [],
            alerts: [],
            error: null
          });
        }
      },

      checkAuth: async () => {
        if (!TokenManager.isAuthenticated()) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        try {
          const user = await apiService.getCurrentUser();
          set({ user, isAuthenticated: true });
          await get().loadAllData();
        } catch (error) {
          console.error('Échec de vérification de l\'authentification:', error);
          TokenManager.clearTokens();
          set({ isAuthenticated: false, user: null });
        }
      },

      // Data loading
      loadAllData: async () => {
        if (!get().isAuthenticated) return;

        try {
          set({ isLoading: true });
          const [incomes, expenses, plannedExpenses, balance, projection] = await Promise.all([
            apiService.getIncomes(),
            apiService.getExpenses(),
            apiService.getPlannedExpenses(),
            apiService.getBalance(),
            apiService.getBalanceProjection()
          ]);

          set({
            incomes,
            expenses,
            plannedExpenses,
            balance,
            projection,
            isLoading: false
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erreur de chargement des données',
            isLoading: false 
          });
        }
      },
      
      // Basic setters
      setUser: (user) => set({ user }),
      setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
      setIncomes: (incomes) => set({ incomes }),
      setExpenses: (expenses) => set({ expenses }),
      setPlannedExpenses: (plannedExpenses) => set({ plannedExpenses }),
      setBalance: (balance) => set({ balance }),
      setProjection: (projection) => set({ projection }),
      setAlerts: (alerts) => set({ alerts }),
      setCurrentTab: (tab) => set({ currentTab: tab }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      
      // CRUD actions with API integration
      addIncome: async (income: CreateIncomeRequest) => {
        try {
          set({ isLoading: true });
          const newIncome = await apiService.createIncome(income);
          set((state) => ({ 
            incomes: [...state.incomes, newIncome],
            isLoading: false
          }));
          await get().loadBalance();
          get().addAlert({
            type: 'info',
            title: 'Revenus',
            message: 'Revenu ajouté avec succès'
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erreur lors de l\'ajout du revenu',
            isLoading: false 
          });
          throw error;
        }
      },
      
      updateIncome: async (id: string, updatedIncome: Partial<CreateIncomeRequest>) => {
        try {
          set({ isLoading: true });
          const income = await apiService.updateIncome(id, updatedIncome);
          set((state) => ({
            incomes: state.incomes.map((i) => i.id === id ? income : i),
            isLoading: false
          }));
          await get().loadBalance();
          get().addAlert({
            type: 'info',
            title: 'Revenus',
            message: 'Revenu modifié avec succès'
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erreur lors de la modification du revenu',
            isLoading: false 
          });
          throw error;
        }
      },
      
      removeIncome: async (id: string) => {
        try {
          set({ isLoading: true });
          await apiService.deleteIncome(id);
          set((state) => ({
            incomes: state.incomes.filter((income) => income.id !== id),
            isLoading: false
          }));
          await get().loadBalance();
          get().addAlert({
            type: 'info',
            title: 'Revenus',
            message: 'Revenu supprimé avec succès'
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erreur lors de la suppression du revenu',
            isLoading: false 
          });
          throw error;
        }
      },
      
      addExpense: async (expense: CreateExpenseRequest) => {
        try {
          set({ isLoading: true });
          const newExpense = await apiService.createExpense(expense);
          set((state) => ({
            expenses: [...state.expenses, newExpense],
            isLoading: false
          }));
          await get().loadBalance();
          get().addAlert({
            type: 'info',
            title: 'Dépenses',
            message: 'Dépense ajoutée avec succès'
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erreur lors de l\'ajout de la dépense',
            isLoading: false 
          });
          throw error;
        }
      },
      
      updateExpense: async (id: string, updatedExpense: Partial<CreateExpenseRequest>) => {
        try {
          set({ isLoading: true });
          const expense = await apiService.updateExpense(id, updatedExpense);
          set((state) => ({
            expenses: state.expenses.map((e) => e.id === id ? expense : e),
            isLoading: false
          }));
          await get().loadBalance();
          get().addAlert({
            type: 'info',
            title: 'Dépenses',
            message: 'Dépense modifiée avec succès'
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erreur lors de la modification de la dépense',
            isLoading: false 
          });
          throw error;
        }
      },
      
      removeExpense: async (id: string) => {
        try {
          set({ isLoading: true });
          await apiService.deleteExpense(id);
          set((state) => ({
            expenses: state.expenses.filter((expense) => expense.id !== id),
            isLoading: false
          }));
          await get().loadBalance();
          get().addAlert({
            type: 'info',
            title: 'Dépenses',
            message: 'Dépense supprimée avec succès'
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erreur lors de la suppression de la dépense',
            isLoading: false 
          });
          throw error;
        }
      },
      
      addPlannedExpense: async (expense: CreatePlannedExpenseRequest) => {
        try {
          set({ isLoading: true });
          const newExpense = await apiService.createPlannedExpense(expense);
          set((state) => ({
            plannedExpenses: [...state.plannedExpenses, newExpense],
            isLoading: false
          }));
          await get().loadBalance();
          get().addAlert({
            type: 'info',
            title: 'Budgets ponctuels',
            message: 'Budget ajouté avec succès'
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erreur lors de l\'ajout du budget',
            isLoading: false 
          });
          throw error;
        }
      },
      
      updatePlannedExpense: async (id: string, updatedExpense: Partial<CreatePlannedExpenseRequest>) => {
        try {
          set({ isLoading: true });
          const expense = await apiService.updatePlannedExpense(id, updatedExpense);
          set((state) => ({
            plannedExpenses: state.plannedExpenses.map((e) => e.id === id ? expense : e),
            isLoading: false
          }));
          await get().loadBalance();
          get().addAlert({
            type: 'info',
            title: 'Budgets ponctuels',
            message: 'Budget modifié avec succès'
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erreur lors de la modification du budget',
            isLoading: false 
          });
          throw error;
        }
      },
      
      removePlannedExpense: async (id: string) => {
        try {
          set({ isLoading: true });
          await apiService.deletePlannedExpense(id);
          set((state) => ({
            plannedExpenses: state.plannedExpenses.filter((expense) => expense.id !== id),
            isLoading: false
          }));
          await get().loadBalance();
          get().addAlert({
            type: 'info',
            title: 'Budgets ponctuels',
            message: 'Budget supprimé avec succès'
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erreur lors de la suppression du budget',
            isLoading: false 
          });
          throw error;
        }
      },

      markPlannedExpenseAsSpent: async (id: string) => {
        try {
          set({ isLoading: true });
          const expense = await apiService.markPlannedExpenseAsSpent(id);
          set((state) => ({
            plannedExpenses: state.plannedExpenses.map((e) => e.id === id ? expense : e),
            isLoading: false
          }));
          await get().loadBalance();
          get().addAlert({
            type: 'info',
            title: 'Budgets ponctuels',
            message: 'Budget marqué comme dépensé'
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erreur lors du marquage du budget',
            isLoading: false 
          });
          throw error;
        }
      },

      // Balance actions
      loadBalance: async () => {
        try {
          const balance = await apiService.getBalance();
          set({ balance });
        } catch (error) {
          console.error('Erreur lors du chargement du solde:', error);
        }
      },

      loadProjection: async () => {
        try {
          const projection = await apiService.getBalanceProjection();
          set({ projection });
        } catch (error) {
          console.error('Erreur lors du chargement de la projection:', error);
        }
      },

      adjustBalance: async (adjustment: BalanceAdjustmentRequest) => {
        try {
          set({ isLoading: true });
          const newBalance = await apiService.adjustBalance(adjustment);
          set({ balance: newBalance, isLoading: false });
          get().addAlert({
            type: 'info',
            title: 'Solde ajusté',
            message: `Solde ${adjustment.amount >= 0 ? 'augmenté' : 'diminué'} de ${Math.abs(adjustment.amount)}€`
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erreur lors de l\'ajustement du solde',
            isLoading: false 
          });
          throw error;
        }
      },

      // Monthly reset
      triggerMonthlyReset: async () => {
        try {
          set({ isLoading: true });
          const result = await apiService.triggerMonthlyReset();
          set({ balance: result.newBalance, isLoading: false });
          get().addAlert({
            type: 'info',
            title: 'Réinitialisation mensuelle',
            message: 'Budget réinitialisé pour le nouveau mois'
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erreur lors de la réinitialisation',
            isLoading: false 
          });
          throw error;
        }
      },

      // Profile management
      updateProfile: async (updates: Partial<User>) => {
        try {
          set({ isLoading: true });
          const updatedUser = await apiService.updateUserProfile(updates);
          set({ user: updatedUser, isLoading: false });
          get().addAlert({
            type: 'info',
            title: 'Profil',
            message: 'Profil mis à jour avec succès'
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour du profil',
            isLoading: false 
          });
          throw error;
        }
      },
      
      // Utility actions (fallback calculations for offline mode)
      calculateBalance: () => {
        const state = get();
        const totalIncome = state.incomes.reduce((sum, income) => sum + income.amount, 0);
        const totalExpenses = state.expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const totalPlanned = state.plannedExpenses
          .filter(expense => !expense.spent)
          .reduce((sum, expense) => sum + expense.amount, 0);
        
        const currentBalance = totalIncome - totalExpenses - totalPlanned;
        
        set({
          balance: {
            currentBalance,
            totalIncome,
            totalExpenses,
            totalPlanned,
            projectedBalance: currentBalance,
          },
        });
      },
      
      clearData: () =>
        set({
          incomes: [],
          expenses: [],
          plannedExpenses: [],
          balance: null,
          projection: [],
          alerts: [],
          error: null,
        }),

      addAlert: (alert: Alert) =>
        set((state) => ({
          alerts: [...state.alerts, alert]
        })),

      removeAlert: (index: number) =>
        set((state) => ({
          alerts: state.alerts.filter((_, i) => i !== index)
        })),
    }),
    {
      name: 'budget-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        currentTab: state.currentTab,
        // On ne persiste pas les données dans le localStorage car elles viennent du backend
      }),
    }
  )
);
