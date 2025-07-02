// Exemple d'utilisation des services modulaires
// Ce fichier montre comment utiliser la nouvelle structure

import { 
  authService, 
  incomeService, 
  expenseService, 
  balanceService,
  TokenManager 
} from './index';

// Exemple d'utilisation des services spécialisés
export async function exampleUsage() {
  try {
    // Authentification
    const loginResult = await authService.login({
      email: 'user@example.com',
      password: 'password'
    });
    
    console.log('Utilisateur connecté:', loginResult.user);

    // Vérification du statut d'authentification
    if (TokenManager.isAuthenticated()) {
      // Récupération des données
      const [incomes, expenses, balance] = await Promise.all([
        incomeService.getIncomes(),
        expenseService.getExpenses(),
        balanceService.getBalance()
      ]);

      console.log('Revenus:', incomes);
      console.log('Dépenses:', expenses);
      console.log('Solde:', balance);
    }

  } catch (error) {
    console.error('Erreur:', error);
  }
}

// Exemple d'utilisation avec le service principal (pour compatibilité)
import { apiService } from './api';

export async function legacyUsage() {
  try {
    // Cette méthode continue de fonctionner exactement comme avant
    const incomes = await apiService.getIncomes();
    const balance = await apiService.getBalance();
    
    console.log('Revenus (legacy):', incomes);
    console.log('Solde (legacy):', balance);
  } catch (error) {
    console.error('Erreur legacy:', error);
  }
}
