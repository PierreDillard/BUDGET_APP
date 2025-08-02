import type { ProjectBudget } from '../types/projectBudget';

export type ProjectBudgetDateStatus = 'upcoming' | 'overdue' | 'spent';

/**
 * Détermine le statut temporel d'un budget projet basé sur sa date d'échéance
 * @param targetDate - Date d'échéance du budget projet (peut être Date, string, null ou undefined)
 * @returns 'upcoming' si à venir, 'spent' si échéance dépassée (automatiquement dépensé)
 */
export const getProjectBudgetDateStatus = (targetDate: Date | string | null | undefined): ProjectBudgetDateStatus => {
  if (!targetDate) {
    return 'upcoming'; // Pas d'échéance = toujours à venir
  }

  // Convertir en objet Date si c'est une chaîne
  const dateObj = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  
  // Vérifier que la date est valide
  if (isNaN(dateObj.getTime())) {
    return 'upcoming'; // Date invalide = considérer comme à venir
  }

  const today = new Date();
  const dueDateOnly = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  if (dueDateOnly < todayOnly) {
    return 'spent'; // Échéance dépassée = automatiquement dépensé
  } else {
    return 'upcoming'; // Échéance aujourd'hui ou future = à venir
  }
};

/**
 * Filtre les budgets projets actifs (à venir seulement)
 * Les budgets avec échéance dépassée sont considérés comme dépensés et ne doivent plus apparaître
 * @param projectBudgets - Liste des budgets projets
 * @returns Budgets projets actifs seulement
 */
export const getActiveProjectBudgets = (projectBudgets: ProjectBudget[]): ProjectBudget[] => {
  return projectBudgets.filter(budget => {
    const dateStatus = getProjectBudgetDateStatus(budget.target_date);
    return dateStatus === 'upcoming'; // Seuls les budgets à venir sont visibles
  });
};

/**
 * Filtre les budgets projets dépensés (échéance dépassée)
 * @param projectBudgets - Liste des budgets projets
 * @returns Budgets projets avec échéance dépassée
 */
export const getSpentProjectBudgets = (projectBudgets: ProjectBudget[]): ProjectBudget[] => {
  return projectBudgets.filter(budget => {
    const dateStatus = getProjectBudgetDateStatus(budget.target_date);
    return dateStatus === 'spent'; // Budgets avec échéance dépassée = dépensés
  });
};

/**
 * Calcule le solde mensuel en tenant compte des budgets projets dépensés
 * @param monthlyIncome - Revenus mensuels
 * @param monthlyExpenses - Dépenses mensuelles
 * @param spentProjectBudgets - Budgets projets dépensés (échéance dépassée)
 * @returns Solde mensuel ajusté
 */
export const calculateMonthlyBalance = (
  monthlyIncome: number, 
  monthlyExpenses: number, 
  spentProjectBudgets: ProjectBudget[]
): number => {
  const spentProjectAmount = spentProjectBudgets.reduce(
    (total, budget) => total + budget.target_amount, 
    0
  );
  
  return monthlyIncome - monthlyExpenses - spentProjectAmount;
};

/**
 * Vérifie si un budget projet doit être masqué du dashboard
 * @param budget - Budget projet à vérifier
 * @returns true si le budget doit être masqué
 */
export const shouldHideProjectBudget = (budget: ProjectBudget): boolean => {
  const dateStatus = getProjectBudgetDateStatus(budget.target_date);
  return dateStatus === 'spent';
};
