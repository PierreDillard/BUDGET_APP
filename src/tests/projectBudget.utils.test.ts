import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getProjectBudgetDateStatus,
  getActiveProjectBudgets,
  getSpentProjectBudgets,
  calculateMonthlyBalance,
  shouldHideProjectBudget
} from '../lib/projectBudget.utils';
import type { ProjectBudget } from '../types/projectBudget';
import { ProjectBudgetStatus, ProjectBudgetCategory } from '../types/projectBudget';

// Mock de la date actuelle pour les tests
const mockCurrentDate = new Date('2025-07-12'); // 12 juillet 2025

beforeEach(() => {
  // Mock Date pour avoir une date fixe dans les tests
  vi.setSystemTime(mockCurrentDate);
});

describe('ProjectBudget Utils', () => {
  const mockProjectBudgets: ProjectBudget[] = [
    {
      id: '1',
      user_id: 'user1',
      name: 'Voyage Madagascar', 
      description: 'Voyage passé',
      target_amount: 1000,
      current_amount: 500,
      category: ProjectBudgetCategory.TRAVEL,
      target_date: new Date('2025-07-08'), // Échéance passée (4 jours avant today)
      status: ProjectBudgetStatus.ACTIVE,
      created_at: new Date('2025-06-01'),
      updated_at: new Date('2025-06-01')
    },
    {
      id: '2',
      user_id: 'user1',
      name: 'Weekend etretat',
      description: 'Weekend à venir',
      target_amount: 200,
      current_amount: 100,
      category: ProjectBudgetCategory.TRAVEL,
      target_date: new Date('2025-07-25'), // Échéance à venir (13 jours après today)
      status: ProjectBudgetStatus.ACTIVE,
      created_at: new Date('2025-06-01'),
      updated_at: new Date('2025-06-01')
    },
    {
      id: '3',
      user_id: 'user1',
      name: 'Rénovation cuisine',
      description: 'Projet sans échéance',
      target_amount: 5000,
      current_amount: 1000,
      category: ProjectBudgetCategory.HOME_IMPROVEMENT,
      target_date: undefined, // Pas d'échéance
      status: ProjectBudgetStatus.ACTIVE,
      created_at: new Date('2025-06-01'),
      updated_at: new Date('2025-06-01')
    },
    {
      id: '4',
      user_id: 'user1',
      name: 'Échéance aujourd\'hui',
      description: 'Échéance le jour même',
      target_amount: 300,
      current_amount: 200,
      category: ProjectBudgetCategory.OTHER,
      target_date: new Date('2025-07-12'), // Échéance aujourd'hui
      status: ProjectBudgetStatus.ACTIVE,
      created_at: new Date('2025-06-01'),
      updated_at: new Date('2025-06-01')
    }
  ];

  describe('getProjectBudgetDateStatus', () => {
    it('devrait retourner "spent" pour une échéance passée', () => {
      const pastDate = new Date('2025-07-08'); // 4 jours avant today
      const status = getProjectBudgetDateStatus(pastDate);
      expect(status).toBe('spent');
    });

    it('devrait retourner "upcoming" pour une échéance à venir', () => {
      const futureDate = new Date('2025-07-25'); // 13 jours après today
      const status = getProjectBudgetDateStatus(futureDate);
      expect(status).toBe('upcoming');
    });

    it('devrait retourner "upcoming" pour une échéance aujourd\'hui', () => {
      const today = new Date('2025-07-12'); // Même jour que today
      const status = getProjectBudgetDateStatus(today);
      expect(status).toBe('upcoming');
    });

    it('devrait retourner "upcoming" pour une échéance null', () => {
      const status = getProjectBudgetDateStatus(null);
      expect(status).toBe('upcoming');
    });

    it('devrait gérer correctement les heures (comparer seulement les dates)', () => {
      const pastDateWithTime = new Date('2025-07-08T23:59:59'); // Passé avec heure tardive
      const futureDateWithTime = new Date('2025-07-25T00:00:01'); // Futur avec heure matinale
      
      expect(getProjectBudgetDateStatus(pastDateWithTime)).toBe('spent');
      expect(getProjectBudgetDateStatus(futureDateWithTime)).toBe('upcoming');
    });
  });

  describe('getActiveProjectBudgets', () => {
    it('devrait retourner seulement les budgets avec échéance à venir ou sans échéance', () => {
      const activeBudgets = getActiveProjectBudgets(mockProjectBudgets);
      
      expect(activeBudgets).toHaveLength(3);
      expect(activeBudgets.map(b => b.name)).toContain('Weekend etretat'); // Échéance future
      expect(activeBudgets.map(b => b.name)).toContain('Rénovation cuisine'); // Pas d'échéance
      expect(activeBudgets.map(b => b.name)).toContain('Échéance aujourd\'hui'); // Échéance aujourd'hui
      expect(activeBudgets.map(b => b.name)).not.toContain('Voyage Madagascar'); // Échéance passée
    });

    it('devrait retourner un tableau vide si aucun budget n\'est actif', () => {
      const allExpiredBudgets: ProjectBudget[] = [
        {
          ...mockProjectBudgets[0],
          target_date: new Date('2025-07-01') // Tous expirés
        }
      ];
      
      const activeBudgets = getActiveProjectBudgets(allExpiredBudgets);
      expect(activeBudgets).toHaveLength(0);
    });
  });

  describe('getSpentProjectBudgets', () => {
    it('devrait retourner seulement les budgets avec échéance dépassée', () => {
      const spentBudgets = getSpentProjectBudgets(mockProjectBudgets);
      
      expect(spentBudgets).toHaveLength(1);
      expect(spentBudgets[0].name).toBe('Voyage Madagascar');
    });

    it('devrait retourner un tableau vide si aucun budget n\'est expiré', () => {
      const allActiveBudgets = mockProjectBudgets.filter(b => b.name !== 'Voyage Madagascar');
      
      const spentBudgets = getSpentProjectBudgets(allActiveBudgets);
      expect(spentBudgets).toHaveLength(0);
    });
  });

  describe('calculateMonthlyBalance', () => {
    it('devrait déduire les budgets dépensés du solde mensuel', () => {
      const monthlyIncome = 3000;
      const monthlyExpenses = 2000;
      const spentBudgets = getSpentProjectBudgets(mockProjectBudgets);
      
      const balance = calculateMonthlyBalance(monthlyIncome, monthlyExpenses, spentBudgets);
      
      // 3000 - 2000 - 1000 (Voyage Madagascar dépensé) = 0
      expect(balance).toBe(0);
    });

    it('ne devrait pas déduire les budgets à venir du solde mensuel', () => {
      const monthlyIncome = 3000;
      const monthlyExpenses = 2000;
      
      const balance = calculateMonthlyBalance(monthlyIncome, monthlyExpenses, []);
      
      // 3000 - 2000 = 1000 (les budgets à venir ne sont pas déduits)
      expect(balance).toBe(1000);
    });

    it('devrait gérer des budgets multiples dépensés', () => {
      const monthlyIncome = 5000;
      const monthlyExpenses = 2000;
      const multipleBudgets: ProjectBudget[] = [
        { ...mockProjectBudgets[0], target_amount: 500 }, // Premier budget dépensé
        { ...mockProjectBudgets[0], id: '5', target_amount: 300 } // Deuxième budget dépensé
      ];
      
      const balance = calculateMonthlyBalance(monthlyIncome, monthlyExpenses, multipleBudgets);
      
      // 5000 - 2000 - 500 - 300 = 2200
      expect(balance).toBe(2200);
    });
  });

  describe('shouldHideProjectBudget', () => {
    it('devrait retourner true pour un budget avec échéance dépassée', () => {
      const expiredBudget = mockProjectBudgets.find(b => b.name === 'Voyage Madagascar')!;
      expect(shouldHideProjectBudget(expiredBudget)).toBe(true);
    });

    it('devrait retourner false pour un budget à venir', () => {
      const upcomingBudget = mockProjectBudgets.find(b => b.name === 'Weekend etretat')!;
      expect(shouldHideProjectBudget(upcomingBudget)).toBe(false);
    });

    it('devrait retourner false pour un budget sans échéance', () => {
      const noDeadlineBudget = mockProjectBudgets.find(b => b.name === 'Rénovation cuisine')!;
      expect(shouldHideProjectBudget(noDeadlineBudget)).toBe(false);
    });

    it('devrait retourner false pour un budget avec échéance aujourd\'hui', () => {
      const todayBudget = mockProjectBudgets.find(b => b.name === 'Échéance aujourd\'hui')!;
      expect(shouldHideProjectBudget(todayBudget)).toBe(false);
    });
  });
});
