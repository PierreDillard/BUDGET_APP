import { apiService } from '../../services/api';
import type { BalanceState, BalanceActions, SliceCreator } from '../types';
import type { Balance, BalanceProjection, BalanceAdjustmentRequest } from '../../types';

export const createBalanceSlice: SliceCreator<BalanceState & BalanceActions> = (set, get) => ({
  // Initial state
  balance: null,
  projection: [],

  // Actions
  setBalance: (balance: Balance) => set((state) => ({ ...state, balance })),
  
  setProjection: (projection: BalanceProjection[]) => set((state) => ({ ...state, projection })),

  loadBalance: async () => {
    try {
      const balance = await apiService.getBalance();
      set((state) => ({ ...state, balance }));
    } catch (error) {
      console.error('Erreur lors du chargement du solde:', error);
    }
  },

  loadProjection: async () => {
    try {
      const projection = await apiService.getBalanceProjection();
      set((state) => ({ ...state, projection }));
    } catch (error) {
      console.error('Erreur lors du chargement de la projection:', error);
    }
  },

  adjustBalance: async (adjustment: BalanceAdjustmentRequest) => {
    try {
      set((state) => ({ ...state, isLoading: true }));
      const newBalance = await apiService.adjustBalance(adjustment);
      set((state) => ({ ...state, balance: newBalance, isLoading: false }));
      get().addAlert({
        type: 'info',
        title: 'Solde ajusté',
        message: `Solde ${adjustment.amount >= 0 ? 'augmenté' : 'diminué'} de ${Math.abs(adjustment.amount)}€`
      });
    } catch (error) {
      set((state) => ({ 
        ...state,
        error: error instanceof Error ? error.message : 'Erreur lors de l\'ajustement du solde',
        isLoading: false 
      }));
      throw error;
    }
  },

  triggerMonthlyReset: async () => {
    try {
      set((state) => ({ ...state, isLoading: true }));
      const result = await apiService.triggerMonthlyReset();
      set((state) => ({ ...state, balance: result.newBalance, isLoading: false }));
      get().addAlert({
        type: 'info',
        title: 'Réinitialisation mensuelle',
        message: 'Budget réinitialisé pour le nouveau mois'
      });
    } catch (error) {
      set((state) => ({ 
        ...state,
        error: error instanceof Error ? error.message : 'Erreur lors de la réinitialisation',
        isLoading: false 
      }));
      throw error;
    }
  },

  // Utility action (fallback calculation for offline mode)
  calculateBalance: () => {
    const state = get();
    const totalIncome = state.incomes.reduce((sum, income) => sum + income.amount, 0);
    const totalExpenses = state.expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalPlanned = state.plannedExpenses
      .filter(expense => !expense.spent)
      .reduce((sum, expense) => sum + expense.amount, 0);
    
    const currentBalance = totalIncome - totalExpenses - totalPlanned;
    
    set((state) => ({
      ...state,
      balance: {
        currentBalance,
        totalIncome,
        totalExpenses,
        totalPlanned,
        projectedBalance: currentBalance,
      },
    }));
  },

  setDirectBalance: async (amount: number) => {
    try {
      set((state) => ({ ...state, isLoading: true }));
      const adjustment = {
        amount: amount - (get().balance?.currentBalance || 0),
        description: 'Ajustement direct du solde'
      };
      const newBalance = await apiService.adjustBalance(adjustment);
      set((state) => ({ ...state, balance: newBalance, isLoading: false }));
      get().addAlert({
        type: 'info',
        title: 'Solde modifié',
        message: `Solde défini à ${amount.toFixed(2)}€`
      });
    } catch (error) {
      set((state) => ({ 
        ...state,
        error: error instanceof Error ? error.message : 'Erreur lors de la modification du solde',
        isLoading: false 
      }));
      throw error;
    }
  },
});
