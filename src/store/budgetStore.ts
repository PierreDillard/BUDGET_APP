import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiService } from '../services/api';
import type { BudgetStore } from './types';
import {
  createAuthSlice,
  createIncomeSlice,
  createExpenseSlice,
  createPlannedExpenseSlice,
  createBalanceSlice,
  createUISlice,
  createUnexpectedExpenseSlice
} from './slices';

export const useBudgetStore = create<BudgetStore>()(
  persist(
    (set, get) => ({
      // Combine all slices
      ...createAuthSlice(set, get),
      ...createIncomeSlice(set, get),
      ...createExpenseSlice(set, get),
      ...createPlannedExpenseSlice(set, get),
      ...createBalanceSlice(set, get),
      ...createUISlice(set, get),
      ...createUnexpectedExpenseSlice(set, get),

      // Global actions that need to coordinate between slices
      loadAllData: async () => {
        if (!get().isAuthenticated) return;

        try {
          set((state) => ({ ...state, isLoading: true }));
          const [incomes, expenses, plannedExpenses, balance, projection] = await Promise.all([
            apiService.getIncomes(),
            apiService.getExpenses(),
            apiService.getPlannedExpenses(),
            apiService.getBalance(),
            apiService.getBalanceProjection()
          ]);

          set((state) => ({
            ...state,
            incomes,
            expenses,
            plannedExpenses,
            balance,
            projection,
            isLoading: false
          }));
        } catch (error) {
          set((state) => ({ 
            ...state,
            error: error instanceof Error ? error.message : 'Erreur de chargement des données',
            isLoading: false 
          }));
        }
      },

      clearData: () =>
        set((state) => ({
          ...state,
          incomes: [],
          expenses: [],
          plannedExpenses: [],
          balance: null,
          projection: [],
          alerts: [],
          error: null,
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