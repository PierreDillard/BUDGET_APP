import { apiService } from '../../services/api';
import type { PlannedExpenseState, PlannedExpenseActions, SliceCreator } from '../types';
import type { PlannedExpense, CreatePlannedExpenseRequest } from '../../types';

export const createPlannedExpenseSlice: SliceCreator<PlannedExpenseState & PlannedExpenseActions> = (set, get) => ({
  // Initial state
  plannedExpenses: [],

  // Actions
  setPlannedExpenses: (plannedExpenses: PlannedExpense[]) => 
    set((state) => ({ ...state, plannedExpenses })),

  addPlannedExpense: async (expense: CreatePlannedExpenseRequest) => {
    try {
      set((state) => ({ ...state, isLoading: true }));
      const newExpense = await apiService.createPlannedExpense(expense);
      set((state) => ({
        ...state,
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
      set((state) => ({ 
        ...state,
        error: error instanceof Error ? error.message : 'Erreur lors de l\'ajout du budget',
        isLoading: false 
      }));
      throw error;
    }
  },

  updatePlannedExpense: async (id: string, updatedExpense: Partial<CreatePlannedExpenseRequest>) => {
    try {
      set((state) => ({ ...state, isLoading: true }));
      const expense = await apiService.updatePlannedExpense(id, updatedExpense);
      set((state) => ({
        ...state,
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
      set((state) => ({ 
        ...state,
        error: error instanceof Error ? error.message : 'Erreur lors de la modification du budget',
        isLoading: false 
      }));
      throw error;
    }
  },

  removePlannedExpense: async (id: string) => {
    try {
      set((state) => ({ ...state, isLoading: true }));
      await apiService.deletePlannedExpense(id);
      set((state) => ({
        ...state,
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
      set((state) => ({ 
        ...state,
        error: error instanceof Error ? error.message : 'Erreur lors de la suppression du budget',
        isLoading: false 
      }));
      throw error;
    }
  },

  markPlannedExpenseAsSpent: async (id: string) => {
    try {
      set((state) => ({ ...state, isLoading: true }));
      const expense = await apiService.markPlannedExpenseAsSpent(id);
      set((state) => ({
        ...state,
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
      set((state) => ({ 
        ...state,
        error: error instanceof Error ? error.message : 'Erreur lors du marquage du budget',
        isLoading: false 
      }));
      throw error;
    }
  },
});
