// Exemple de test pour vérifier la nouvelle logique de fréquence
// Ce fichier peut être utilisé pour valider manuellement le comportement

import { isDueInMonth, FrequencyType } from '../common/frequency.utils';

// Test d'une dépense trimestrielle due en janvier, avril, juillet, octobre
const quarterlyExpense = {
  frequency: FrequencyType.QUARTERLY,
  frequencyData: { months: [1, 4, 7, 10] }, // jan, avr, jul, oct
  dayOfMonth: 15,
  amount: 150 // 150€ tous les trimestres
};

// Test pour différents mois
console.log('=== Test dépense trimestrielle (150€ les 15 jan/avr/jul/oct) ===');

const testMonths = [
  { month: 1, name: 'Janvier' },
  { month: 2, name: 'Février' }, 
  { month: 3, name: 'Mars' },
  { month: 4, name: 'Avril' },
  { month: 5, name: 'Mai' },
  { month: 6, name: 'Juin' },
  { month: 7, name: 'Juillet' },
  { month: 8, name: 'Août' },
  { month: 9, name: 'Septembre' },
  { month: 10, name: 'Octobre' },
  { month: 11, name: 'Novembre' },
  { month: 12, name: 'Décembre' }
];

testMonths.forEach(({ month, name }) => {
  const isDue = isDueInMonth(
    quarterlyExpense.frequency,
    quarterlyExpense.frequencyData,
    quarterlyExpense.dayOfMonth,
    month,
    2025
  );
  
  console.log(`${name}: ${isDue ? '✅ DUE (150€ à déduire)' : '❌ PAS DUE (0€)'}`);
});

console.log('\n=== Résultat attendu ===');
console.log('Seulement janvier, avril, juillet et octobre devraient être "DUE"');
console.log('Les autres mois ne devraient PAS déduire la dépense');

// Test d'une dépense mensuelle pour comparaison
console.log('\n=== Test dépense mensuelle (50€ le 10 de chaque mois) ===');
const monthlyExpense = {
  frequency: FrequencyType.MONTHLY,
  frequencyData: null,
  dayOfMonth: 10,
  amount: 50
};

testMonths.forEach(({ month, name }) => {
  const isDue = isDueInMonth(
    monthlyExpense.frequency,
    monthlyExpense.frequencyData,
    monthlyExpense.dayOfMonth,
    month,
    2025
  );
  
  console.log(`${name}: ${isDue ? '✅ DUE (50€ à déduire)' : '❌ PAS DUE'}`);
});

console.log('\n=== Résultat attendu ===');
console.log('Tous les mois devraient être "DUE" pour une dépense mensuelle');
