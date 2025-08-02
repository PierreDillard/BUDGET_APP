import { projectBudgetService } from '../../services/projectBudgetService';
import type { ProjectBudgetState, ProjectBudgetActions, SliceCreator } from '../types';
import type {
  CreateProjectBudgetRequest,
  UpdateProjectBudgetRequest,
  AddContributionRequest
} from '../../types/projectBudget';
import { getActiveProjectBudgets } from '../../lib/projectBudget.utils';

export const createProjectBudgetSlice: SliceCreator<ProjectBudgetState & ProjectBudgetActions> = (set, get) => ({
  // Initial state
  projectBudgets: [],
  selectedProjectBudget: null,
  projectBudgetStats: null,
  isLoadingProjectBudgets: false,
  projectBudgetError: null,

  // Actions
  loadProjectBudgets: async () => {
    try {
      set((state) => ({ ...state, isLoadingProjectBudgets: true, projectBudgetError: null }));
      const allProjectBudgets = await projectBudgetService.getProjectBudgets();
      // Filtrer pour ne garder que les budgets actifs (pas d'échéance dépassée)
      const activeProjectBudgets = getActiveProjectBudgets(allProjectBudgets);
      set((state) => ({ ...state, projectBudgets: activeProjectBudgets, isLoadingProjectBudgets: false }));
    } catch (error) {
      set((state) => ({
        ...state,
        projectBudgetError: error instanceof Error ? error.message : 'Erreur lors du chargement des budgets',
        isLoadingProjectBudgets: false
      }));
    }
  },

  createProjectBudget: async (data: CreateProjectBudgetRequest) => {
    try {
      set((state) => ({ ...state, projectBudgetError: null }));
      const newProjectBudget = await projectBudgetService.createProjectBudget(data);
      set((state) => ({
        ...state,
        projectBudgets: [...state.projectBudgets, newProjectBudget]
      }));
      return newProjectBudget;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la création du budget';
      set((state) => ({ ...state, projectBudgetError: errorMessage }));
      throw error;
    }
  },

  updateProjectBudget: async (id: string, data: UpdateProjectBudgetRequest) => {
    try {
      set((state) => ({ ...state, projectBudgetError: null }));
      const updatedProjectBudget = await projectBudgetService.updateProjectBudget(id, data);
      set((state) => ({
        ...state,
        projectBudgets: state.projectBudgets.map(pb => 
          pb.id === id ? updatedProjectBudget : pb
        ),
        selectedProjectBudget: state.selectedProjectBudget?.id === id ? updatedProjectBudget : state.selectedProjectBudget
      }));
      return updatedProjectBudget;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la mise à jour du budget';
      set((state) => ({ ...state, projectBudgetError: errorMessage }));
      throw error;
    }
  },

  deleteProjectBudget: async (id: string) => {
    try {
      set((state) => ({ ...state, projectBudgetError: null }));
      await projectBudgetService.deleteProjectBudget(id);
      set((state) => ({
        ...state,
        projectBudgets: state.projectBudgets.filter(pb => pb.id !== id),
        selectedProjectBudget: state.selectedProjectBudget?.id === id ? null : state.selectedProjectBudget
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la suppression du budget';
      set((state) => ({ ...state, projectBudgetError: errorMessage }));
      throw error;
    }
  },

  addContribution: async (projectBudgetId: string, data: AddContributionRequest) => {
    try {
      set((state) => ({ ...state, projectBudgetError: null }));
      await projectBudgetService.addContribution(projectBudgetId, data);
      
      // Recharger le budget spécifique pour avoir les données à jour
      const updatedBudget = await projectBudgetService.getProjectBudget(projectBudgetId);
      set((state) => ({
        ...state,
        projectBudgets: state.projectBudgets.map(pb => 
          pb.id === projectBudgetId ? updatedBudget : pb
        ),
        selectedProjectBudget: state.selectedProjectBudget?.id === projectBudgetId ? updatedBudget : state.selectedProjectBudget
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'ajout de la contribution';
      set((state) => ({ ...state, projectBudgetError: errorMessage }));
      throw error;
    }
  },

  completeProjectBudget: async (id: string) => {
    try {
      set((state) => ({ ...state, projectBudgetError: null }));
      const completedBudget = await projectBudgetService.completeProjectBudget(id);
      set((state) => ({
        ...state,
        projectBudgets: state.projectBudgets.map(pb => 
          pb.id === id ? completedBudget : pb
        ),
        selectedProjectBudget: state.selectedProjectBudget?.id === id ? completedBudget : state.selectedProjectBudget
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la finalisation du budget';
      set((state) => ({ ...state, projectBudgetError: errorMessage }));
      throw error;
    }
  },

  pauseProjectBudget: async (id: string) => {
    try {
      set((state) => ({ ...state, projectBudgetError: null }));
      const pausedBudget = await projectBudgetService.pauseProjectBudget(id);
      set((state) => ({
        ...state,
        projectBudgets: state.projectBudgets.map(pb => 
          pb.id === id ? pausedBudget : pb
        ),
        selectedProjectBudget: state.selectedProjectBudget?.id === id ? pausedBudget : state.selectedProjectBudget
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la pause du budget';
      set((state) => ({ ...state, projectBudgetError: errorMessage }));
      throw error;
    }
  },

  resumeProjectBudget: async (id: string) => {
    try {
      set((state) => ({ ...state, projectBudgetError: null }));
      const resumedBudget = await projectBudgetService.resumeProjectBudget(id);
      set((state) => ({
        ...state,
        projectBudgets: state.projectBudgets.map(pb => 
          pb.id === id ? resumedBudget : pb
        ),
        selectedProjectBudget: state.selectedProjectBudget?.id === id ? resumedBudget : state.selectedProjectBudget
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la reprise du budget';
      set((state) => ({ ...state, projectBudgetError: errorMessage }));
      throw error;
    }
  },

  selectProjectBudget: (id: string | null) => {
    const projectBudget = id ? get().projectBudgets.find(pb => pb.id === id) || null : null;
    set((state) => ({ ...state, selectedProjectBudget: projectBudget }));
  },

  allocateMonthlyAmount: async (id: string, data: { amount: number; description?: string }) => {
    try {
      set((state) => ({ ...state, projectBudgetError: null }));
      const updatedBudget = await projectBudgetService.allocateMonthlyAmount(id, data);
      set((state) => ({
        ...state,
        projectBudgets: state.projectBudgets.map(pb => 
          pb.id === id ? updatedBudget : pb
        ),
        selectedProjectBudget: state.selectedProjectBudget?.id === id ? updatedBudget : state.selectedProjectBudget
      }));
      
      // Recharger le solde après l'allocation
      await get().loadBalance();
      
      return updatedBudget;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'allocation';
      set((state) => ({ ...state, projectBudgetError: errorMessage }));
      throw error;
    }
  },

  loadProjectBudgetStats: async () => {
    try {
      set((state) => ({ ...state, projectBudgetError: null }));
      const stats = await projectBudgetService.getProjectBudgetStats();
      set((state) => ({ ...state, projectBudgetStats: stats }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement des statistiques';
      set((state) => ({ ...state, projectBudgetError: errorMessage }));
    }
  },

  clearProjectBudgetError: () => {
    set((state) => ({ ...state, projectBudgetError: null }));
  }
});
