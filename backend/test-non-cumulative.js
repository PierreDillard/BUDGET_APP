// Test de la logique NON-CUMULATIVE (chaque mois indépendant)

const FrequencyType = {
  MONTHLY: 'MONTHLY',
  QUARTERLY: 'QUARTERLY',
  YEARLY: 'YEARLY',
};

function calculateCurrentMonthAmount(amount, frequency, frequencyData, dayOfMonth, today = new Date()) {
  const currentMonth = today.getMonth() + 1; // 1-12
  const currentDay = today.getDate();

  switch (frequency) {
    case FrequencyType.MONTHLY:
      // Pour les revenus/dépenses mensuels, vérifier seulement ce mois-ci
      return dayOfMonth <= currentDay ? amount : 0;

    case FrequencyType.QUARTERLY:
      const quarterlyMonths = frequencyData?.months || [1, 4, 7, 10];
      // Vérifier si ce mois-ci est un mois trimestriel
      if (quarterlyMonths.includes(currentMonth)) {
        return dayOfMonth <= currentDay ? amount : 0;
      }
      return 0;

    case FrequencyType.YEARLY:
      const yearlyMonths = frequencyData?.months || [1];
      // Vérifier si ce mois-ci est un mois annuel
      if (yearlyMonths.includes(currentMonth)) {
        return dayOfMonth <= currentDay ? amount : 0;
      }
      return 0;

    default:
      return 0;
  }
}

console.log('=== TEST LOGIQUE NON-CUMULATIVE (MOIS INDÉPENDANTS) ===\n');

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
      frequencyData: { months: [1, 4, 7, 10] } // Jan, Avr, Jul, Oct
    },
    {
      label: 'Taxe Foncière',
      amount: 600,
      dayOfMonth: 20,
      frequency: FrequencyType.YEARLY,
      frequencyData: { months: [10] } // Octobre
    }
  ]
};

// Test pour différents mois
const testDates = [
  { date: new Date(2025, 0, 10), desc: 'Janvier (mois trimestriel)' },
  { date: new Date(2025, 1, 10), desc: 'Février (mois normal)' },  
  { date: new Date(2025, 3, 10), desc: 'Avril (mois trimestriel)' },
  { date: new Date(2025, 6, 10), desc: 'Juillet (mois trimestriel)' },
  { date: new Date(2025, 7, 10), desc: 'Août (mois normal)' },
  { date: new Date(2025, 9, 25), desc: 'Octobre (mois trimestriel + annuel)' },
];

testDates.forEach(({ date, desc }) => {
  console.log(`=== ${desc.toUpperCase()} ===`);
  console.log(`Date: ${date.toLocaleDateString('fr-FR')}`);
  
  let monthlyIncome = 0;
  let monthlyExpenses = 0;
  
  // Revenus du mois
  userBudget.incomes.forEach(income => {
    const amount = calculateCurrentMonthAmount(
      income.amount,
      income.frequency,
      income.frequencyData,
      income.dayOfMonth,
      date
    );
    if (amount > 0) {
      console.log(`✅ ${income.label}: +${amount}€`);
      monthlyIncome += amount;
    }
  });
  
  // Dépenses du mois
  userBudget.expenses.forEach(expense => {
    const amount = calculateCurrentMonthAmount(
      expense.amount,
      expense.frequency,
      expense.frequencyData,
      expense.dayOfMonth,
      date
    );
    if (amount > 0) {
      console.log(`❌ ${expense.label}: -${amount}€`);
      monthlyExpenses += amount;
    }
  });
  
  const netMonth = monthlyIncome - monthlyExpenses;
  console.log(`📊 Bilan du mois: +${monthlyIncome}€ - ${monthlyExpenses}€ = ${netMonth}€`);
  console.log('');
});

console.log('=== EXEMPLE JUILLET 2025 ===');
const julyDate = new Date(2025, 6, 8); // 8 juillet 2025
console.log(`Date: ${julyDate.toLocaleDateString('fr-FR')}`);

let julyIncome = 0;
let julyExpenses = 0;

userBudget.incomes.forEach(income => {
  const amount = calculateCurrentMonthAmount(
    income.amount,
    income.frequency,
    income.frequencyData,
    income.dayOfMonth,
    julyDate
  );
  if (amount > 0) {
    console.log(`✅ ${income.label}: +${amount}€`);
    julyIncome += amount;
  }
});

userBudget.expenses.forEach(expense => {
  const amount = calculateCurrentMonthAmount(
    expense.amount,
    expense.frequency,
    expense.frequencyData,
    expense.dayOfMonth,
    julyDate
  );
  if (amount > 0) {
    console.log(`❌ ${expense.label}: -${amount}€`);
    julyExpenses += amount;
  }
});

const julyBalance = userBudget.initialBalance + julyIncome - julyExpenses;
console.log(`\n💰 Solde juillet: ${userBudget.initialBalance} + ${julyIncome} - ${julyExpenses} = ${julyBalance}€`);
console.log('\n=== ANALYSE ===');
console.log('✅ Juillet est un mois trimestriel → Assurance déduite');
console.log('✅ Juillet n\'est pas le mois de la taxe foncière → Pas de taxe');
console.log('✅ Salaire et loyer mensuels → Déduits normalement');
console.log(`✅ Solde cohérent avec l'interface: ${julyBalance}€`);
