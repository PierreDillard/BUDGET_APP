// Test avec calcul mensuel plus réaliste
console.log('=== TEST AVEC CALCUL MENSUEL RÉALISTE ===\n');

const FrequencyType = {
  MONTHLY: 'MONTHLY',
  QUARTERLY: 'QUARTERLY',
  YEARLY: 'YEARLY',
};

function calculateOccurredAmount(amount, frequency, frequencyData, dayOfMonth, today) {
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  switch (frequency) {
    case FrequencyType.MONTHLY:
      return dayOfMonth <= currentDay ? amount : 0;

    case FrequencyType.QUARTERLY:
      const quarterlyMonths = frequencyData?.months || [1, 4, 7, 10];
      let quarterlyTotal = 0;
      for (const month of quarterlyMonths) {
        if (month < currentMonth || (month === currentMonth && dayOfMonth <= currentDay)) {
          quarterlyTotal += amount;
        }
      }
      return quarterlyTotal;

    case FrequencyType.YEARLY:
      const yearlyMonths = frequencyData?.months || [1];
      let yearlyTotal = 0;
      for (const month of yearlyMonths) {
        if (month < currentMonth || (month === currentMonth && dayOfMonth <= currentDay)) {
          yearlyTotal += amount;
        }
      }
      return yearlyTotal;

    default:
      return 0;
  }
}

// Calculer le solde cumulé depuis janvier
function calculateCumulativeBalance(expenses, incomes, initialBalance, currentDate) {
  const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
  let balance = initialBalance;
  
  // Pour chaque mois depuis janvier jusqu'au mois actuel
  for (let month = 1; month <= currentDate.getMonth() + 1; month++) {
    const isCurrentMonth = month === currentDate.getMonth() + 1;
    const lastDayOfMonth = isCurrentMonth ? currentDate.getDate() : 31;
    
    console.log(`--- Mois ${month} ---`);
    
    // Revenus du mois
    incomes.forEach(income => {
      if (income.frequency === FrequencyType.MONTHLY && income.dayOfMonth <= lastDayOfMonth) {
        balance += income.amount;
        console.log(`✅ ${income.label}: +${income.amount}€`);
      }
    });
    
    // Dépenses du mois
    expenses.forEach(expense => {
      if (expense.frequency === FrequencyType.MONTHLY && expense.dayOfMonth <= lastDayOfMonth) {
        balance -= expense.amount;
        console.log(`❌ ${expense.label}: -${expense.amount}€`);
      } else if (expense.frequency === FrequencyType.QUARTERLY) {
        const quarterlyMonths = expense.frequencyData?.months || [1, 4, 7, 10];
        if (quarterlyMonths.includes(month) && expense.dayOfMonth <= lastDayOfMonth) {
          balance -= expense.amount;
          console.log(`❌ ${expense.label} (trimestriel): -${expense.amount}€`);
        }
      } else if (expense.frequency === FrequencyType.YEARLY) {
        const yearlyMonths = expense.frequencyData?.months || [1];
        if (yearlyMonths.includes(month) && expense.dayOfMonth <= lastDayOfMonth) {
          balance -= expense.amount;
          console.log(`❌ ${expense.label} (annuel): -${expense.amount}€`);
        }
      }
    });
    
    console.log(`💰 Solde fin de période: ${balance}€`);
    console.log('');
  }
  
  return balance;
}

const userBudget = {
  initialBalance: 1000,
  incomes: [
    {
      label: 'Salaire',
      amount: 2500,
      dayOfMonth: 5,
      frequency: FrequencyType.MONTHLY,
      frequencyData: null
    }
  ],
  expenses: [
    {
      label: 'Loyer',
      amount: 800,
      dayOfMonth: 1,
      frequency: FrequencyType.MONTHLY,
      frequencyData: null
    },
    {
      label: 'Assurance Auto',
      amount: 120,
      dayOfMonth: 15,
      frequency: FrequencyType.QUARTERLY,
      frequencyData: { months: [1, 4, 7, 10] }
    },
    {
      label: 'Taxe Foncière',
      amount: 600,
      dayOfMonth: 20,
      frequency: FrequencyType.YEARLY,
      frequencyData: { months: [10] }
    }
  ]
};

// Test aujourd'hui (8 juillet 2025)
const today = new Date(2025, 6, 8); // 8 juillet 2025
console.log(`Test pour le ${today.toLocaleDateString('fr-FR')}`);
console.log('');

const finalBalance = calculateCumulativeBalance(
  userBudget.expenses, 
  userBudget.incomes, 
  userBudget.initialBalance, 
  today
);

console.log('=== RÉSUMÉ ===');
console.log(`Solde initial: ${userBudget.initialBalance}€`);
console.log(`Solde au ${today.toLocaleDateString('fr-FR')}: ${finalBalance}€`);

// Comparaison avec la fonction calculateOccurredAmount
console.log('\n=== VÉRIFICATION AVEC calculateOccurredAmount ===');
let totalIncome = userBudget.incomes.reduce((sum, income) => {
  const occurred = calculateOccurredAmount(income.amount, income.frequency, income.frequencyData, income.dayOfMonth, today);
  console.log(`${income.label}: ${occurred}€`);
  return sum + occurred;
}, 0);

let totalExpenses = userBudget.expenses.reduce((sum, expense) => {
  const occurred = calculateOccurredAmount(expense.amount, expense.frequency, expense.frequencyData, expense.dayOfMonth, today);
  console.log(`${expense.label}: ${occurred}€`);
  return sum + occurred;
}, 0);

const calculatedBalance = userBudget.initialBalance + totalIncome - totalExpenses;
console.log(`Solde calculé: ${userBudget.initialBalance} + ${totalIncome} - ${totalExpenses} = ${calculatedBalance}€`);

if (calculatedBalance === finalBalance) {
  console.log('✅ Les deux méthodes de calcul sont cohérentes !');
} else {
  console.log('❌ Différence entre les méthodes de calcul');
}
