/**
 * Tests manuels pour les fonctions utilitaires des budgets projets
 * Ces tests peuvent être exécutés directement avec node/ts-node
 */

import type { ProjectBudget } from '../types/projectBudget';
import { ProjectBudgetStatus, ProjectBudgetCategory } from '../types/projectBudget';
import {
  getProjectBudgetDateStatus,
  getActiveProjectBudgets,
  getSpentProjectBudgets,
  calculateMonthlyBalance,
  shouldHideProjectBudget
} from '../lib/projectBudget.utils';

// Données de test
const mockCurrentDate = new Date('2025-07-12'); // 12 juillet 2025 (date actuelle)

const mockProjectBudgets: ProjectBudget[] = [
  {
    id: '1',
    user_id: 'user1',
    name: 'Voyage Madagascar',
    description: 'Voyage avec échéance passée',
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
  }
];

// Fonctions de test
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ Test échoué: ${message}`);
  }
  console.log(`✅ ${message}`);
}

function testGetProjectBudgetDateStatus() {
  console.log('\n=== Test getProjectBudgetDateStatus ===');
  
  // Mock de la date pour simuler le 12 juillet 2025
  const originalDateNow = Date.now;
  Date.now = () => mockCurrentDate.getTime();
  
  try {
    // Test 1: Échéance passée
    const pastDate = new Date('2025-07-08');
    const pastStatus = getProjectBudgetDateStatus(pastDate);
    assert(pastStatus === 'spent', 'Échéance passée devrait retourner "spent"');
    
    // Test 2: Échéance à venir
    const futureDate = new Date('2025-07-25');
    const futureStatus = getProjectBudgetDateStatus(futureDate);
    assert(futureStatus === 'upcoming', 'Échéance à venir devrait retourner "upcoming"');
    
    // Test 3: Pas d'échéance
    const noDateStatus = getProjectBudgetDateStatus(undefined);
    assert(noDateStatus === 'upcoming', 'Pas d\'échéance devrait retourner "upcoming"');
    
    // Test 4: Échéance aujourd'hui
    const todayStatus = getProjectBudgetDateStatus(mockCurrentDate);
    assert(todayStatus === 'upcoming', 'Échéance aujourd\'hui devrait retourner "upcoming"');
    
  } finally {
    Date.now = originalDateNow;
  }
}

function testGetActiveProjectBudgets() {
  console.log('\n=== Test getActiveProjectBudgets ===');
  
  const activeBudgets = getActiveProjectBudgets(mockProjectBudgets);
  
  assert(activeBudgets.length === 2, 'Devrait retourner 2 budgets actifs');
  assert(
    activeBudgets.some(b => b.name === 'Weekend etretat'), 
    'Devrait inclure le budget "Weekend etretat"'
  );
  assert(
    activeBudgets.some(b => b.name === 'Rénovation cuisine'), 
    'Devrait inclure le budget "Rénovation cuisine"'
  );
  assert(
    !activeBudgets.some(b => b.name === 'Voyage Madagascar'), 
    'Ne devrait pas inclure le budget "Voyage Madagascar" (expiré)'
  );
}

function testGetSpentProjectBudgets() {
  console.log('\n=== Test getSpentProjectBudgets ===');
  
  const spentBudgets = getSpentProjectBudgets(mockProjectBudgets);
  
  assert(spentBudgets.length === 1, 'Devrait retourner 1 budget dépensé');
  assert(
    spentBudgets[0].name === 'Voyage Madagascar', 
    'Le budget dépensé devrait être "Voyage Madagascar"'
  );
}

function testCalculateMonthlyBalance() {
  console.log('\n=== Test calculateMonthlyBalance ===');
  
  const monthlyIncome = 3000;
  const monthlyExpenses = 2000;
  const spentBudgets = getSpentProjectBudgets(mockProjectBudgets);
  
  const balance = calculateMonthlyBalance(monthlyIncome, monthlyExpenses, spentBudgets);
  
  // 3000 - 2000 - 1000 (Voyage Madagascar dépensé) = 0
  assert(balance === 0, 'Le solde devrait être 0 (3000 - 2000 - 1000)');
  
  // Test sans budgets dépensés
  const balanceWithoutSpent = calculateMonthlyBalance(monthlyIncome, monthlyExpenses, []);
  assert(balanceWithoutSpent === 1000, 'Le solde sans budgets dépensés devrait être 1000');
}

function testShouldHideProjectBudget() {
  console.log('\n=== Test shouldHideProjectBudget ===');
  
  const expiredBudget = mockProjectBudgets.find(b => b.name === 'Voyage Madagascar')!;
  const upcomingBudget = mockProjectBudgets.find(b => b.name === 'Weekend etretat')!;
  const noDeadlineBudget = mockProjectBudgets.find(b => b.name === 'Rénovation cuisine')!;
  
  assert(
    shouldHideProjectBudget(expiredBudget) === true, 
    'Budget expiré devrait être masqué'
  );
  assert(
    shouldHideProjectBudget(upcomingBudget) === false, 
    'Budget à venir ne devrait pas être masqué'
  );
  assert(
    shouldHideProjectBudget(noDeadlineBudget) === false, 
    'Budget sans échéance ne devrait pas être masqué'
  );
}

// Exécution des tests
function runTests() {
  console.log('🧪 Début des tests manuels pour les budgets projets\n');
  console.log(`📅 Date simulée: ${mockCurrentDate.toISOString().split('T')[0]}`);
  
  try {
    testGetProjectBudgetDateStatus();
    testGetActiveProjectBudgets();
    testGetSpentProjectBudgets();
    testCalculateMonthlyBalance();
    testShouldHideProjectBudget();
    
    console.log('\n🎉 Tous les tests sont passés avec succès !');
    console.log('\n📋 Résumé des fonctionnalités validées:');
    console.log('✅ Les budgets avec échéance dépassée sont marqués comme "dépensés"');
    console.log('✅ Les budgets dépensés disparaissent du dashboard (fonction de masquage)');
    console.log('✅ Les budgets à venir restent visibles');
    console.log('✅ Le calcul du solde mensuel prend en compte les budgets dépensés');
    console.log('✅ Les budgets sans échéance restent toujours actifs');
    
  } catch (error) {
    console.error('\n💥 Un test a échoué:', error.message);
    process.exit(1);
  }
}

// Point d'entrée
if (require.main === module) {
  runTests();
}

export { runTests };
