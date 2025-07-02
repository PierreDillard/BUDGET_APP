import { apiService } from '../../services/api';
import type { IncomeState, IncomeActions, SliceCreator } from '../types';
import type { RecIncome, CreateIncomeRequest } from '../../types';

export const createIncomeSlice: SliceCreator<IncomeState & IncomeActions> = (set, get) => ({
  // Initial state
  incomes: [],

  // Actions
  setIncomes: (incomes: RecIncome[]) => set((state) => ({ ...state, incomes })),

  addIncome: async (income: CreateIncomeRequest) => {
    try {
      set((state) => ({ ...state, isLoading: true }));
      const newIncome = await apiService.createIncome(income);
      set((state) => ({ 
        ...state,
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
      set((state) => ({ 
        ...state,
        error: error instanceof Error ? error.message : 'Erreur lors de l\'ajout du revenu',
        isLoading: false 
      }));
      throw error;
    }
  },

  updateIncome: async (id: string, updatedIncome: Partial<CreateIncomeRequest>) => {
    try {
      set((state) => ({ ...state, isLoading: true }));
      const income = await apiService.updateIncome(id, updatedIncome);
      set((state) => ({
        ...state,
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
      set((state) => ({ 
        ...state,
        error: error instanceof Error ? error.message : 'Erreur lors de la modification du revenu',
        isLoading: false 
      }));
      throw error;
    }
  },

  removeIncome: async (id: string) => {
    try {
      set((state) => ({ ...state, isLoading: true }));
      await apiService.deleteIncome(id);
      set((state) => ({
        ...state,
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
      set((state) => ({ 
        ...state,
        error: error instanceof Error ? error.message : 'Erreur lors de la suppression du revenu',
        isLoading: false 
      }));
      throw error;
    }
  },
});
