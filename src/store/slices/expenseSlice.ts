import { apiService } from '../../services/api';
import type { ExpenseState, ExpenseActions, SliceCreator } from '../types';
import type { RecExpense, CreateExpenseRequest } from '../../types';

export const createExpenseSlice: SliceCreator<ExpenseState & ExpenseActions> = (set, get) => ({
  // Initial state
  expenses: [],

  // Actions
  setExpenses: (expenses: RecExpense[]) => set((state) => ({ ...state, expenses })),

  addExpense: async (expense: CreateExpenseRequest) => {
    try {
      set((state) => ({ ...state, isLoading: true }));
      const newExpense = await apiService.createExpense(expense);
      set((state) => ({
        ...state,
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
      set((state) => ({ 
        ...state,
        error: error instanceof Error ? error.message : 'Erreur lors de l\'ajout de la dépense',
        isLoading: false 
      }));
      throw error;
    }
  },

  updateExpense: async (id: string, updatedExpense: Partial<CreateExpenseRequest>) => {
    try {
      set((state) => ({ ...state, isLoading: true }));
      const expense = await apiService.updateExpense(id, updatedExpense);
      set((state) => ({
        ...state,
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
      set((state) => ({ 
        ...state,
        error: error instanceof Error ? error.message : 'Erreur lors de la modification de la dépense',
        isLoading: false 
      }));
      throw error;
    }
  },

  removeExpense: async (id: string) => {
    try {
      set((state) => ({ ...state, isLoading: true }));
      await apiService.deleteExpense(id);
      set((state) => ({
        ...state,
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
      set((state) => ({ 
        ...state,
        error: error instanceof Error ? error.message : 'Erreur lors de la suppression de la dépense',
        isLoading: false 
      }));
      throw error;
    }
  },
});
