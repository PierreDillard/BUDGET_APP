// Test final de coordination entre le chart et le solde mensuel
console.log("=== TEST FINAL DE COORDINATION CHART/SOLDE ===\n");

const FrequencyType = {
  MONTHLY: 'MONTHLY',
  QUARTERLY: 'QUARTERLY',
  YEARLY: 'YEARLY'
};

// Fonction calculateCurrentMonthAmount (maintenant utilisée partout)
function calculateCurrentMonthAmount(amount, frequency, frequencyData, dayOfMonth, today = new Date()) {
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  switch (frequency) {
    case FrequencyType.MONTHLY:
      return dayOfMonth <= currentDay ? amount : 0;

    case FrequencyType.QUARTERLY:
      const quarterlyMonths = frequencyData?.months || [1, 4, 7, 10];
      if (quarterlyMonths.includes(currentMonth)) {
        return dayOfMonth <= currentDay ? amount : 0;
      }
      return 0;

    case FrequencyType.YEARLY:
      const yearlyMonths = frequencyData?.months || [1];
      if (yearlyMonths.includes(currentMonth)) {
        return dayOfMonth <= currentDay ? amount : 0;
      }
      return 0;

    default:
      return 0;
  }
}

// Simulation du calcul de solde (comme dans balance.service.ts)
function simulerCalculSolde(revenus, depenses, soldeInitial, today) {
  let soldeActuel = soldeInitial;
  let totalRevenus = 0;
  let totalDepenses = 0;

  console.log("=== CALCUL DU SOLDE ===");
  console.log(`Solde initial: ${soldeInitial}€\n`);

  console.log("REVENUS DU MOIS (déjà reçus):");
  for (const revenu of revenus) {
    const montant = calculateCurrentMonthAmount(
      revenu.amount,
      revenu.frequency,
      revenu.frequencyData,
      revenu.dayOfMonth,
      today
    );
    
    if (montant > 0) {
      console.log(`  + ${revenu.label}: ${montant}€ (dû le ${revenu.dayOfMonth})`);
      soldeActuel += montant;
      totalRevenus += montant;
    } else {
      console.log(`  - ${revenu.label}: 0€ (dû le ${revenu.dayOfMonth}, pas encore passé)`);
    }
  }

  console.log("\nDÉPENSES DU MOIS (déjà déduites):");
  for (const depense of depenses) {
    const montant = calculateCurrentMonthAmount(
      depense.amount,
      depense.frequency,
      depense.frequencyData,
      depense.dayOfMonth,
      today
    );
    
    if (montant > 0) {
      console.log(`  - ${depense.label}: ${montant}€ (dû le ${depense.dayOfMonth})`);
      soldeActuel -= montant;
      totalDepenses += montant;
    } else {
      console.log(`  - ${depense.label}: 0€ (dû le ${depense.dayOfMonth}, pas encore passé)`);
    }
  }

  console.log(`\nTOTAL REVENUS REÇUS: ${totalRevenus}€`);
  console.log(`TOTAL DÉPENSES DÉDUITES: ${totalDepenses}€`);
  console.log(`SOLDE ACTUEL: ${soldeActuel}€\n`);

  return {
    soldeActuel,
    totalRevenus,
    totalDepenses
  };
}

// Simulation de la projection chart
function simulerProjectionChart(revenus, depenses, soldeInitial, today, joursProjection = 7) {
  console.log("=== PROJECTION CHART (7 prochains jours) ===");
  
  let soldeRunning = soldeInitial;
  const projection = [];

  // Calculer d'abord les revenus/dépenses déjà passés ce mois
  for (const revenu of revenus) {
    const montant = calculateCurrentMonthAmount(
      revenu.amount,
      revenu.frequency,
      revenu.frequencyData,
      revenu.dayOfMonth,
      today
    );
    soldeRunning += montant;
  }

  for (const depense of depenses) {
    const montant = calculateCurrentMonthAmount(
      depense.amount,
      depense.frequency,
      depense.frequencyData,
      depense.dayOfMonth,
      today
    );
    soldeRunning -= montant;
  }

  console.log(`Solde de base (incluant transactions passées): ${soldeRunning}€\n`);

  // Projeter les prochains jours
  for (let i = 0; i < joursProjection; i++) {
    const dateProjection = new Date(today);
    dateProjection.setDate(today.getDate() + i);
    
    const jour = dateProjection.getDate();
    const mois = dateProjection.getMonth() + 1;
    let evenements = [];

    // Vérifier les revenus pour ce jour
    for (const revenu of revenus) {
      const quarterlyMonths = revenu.frequencyData?.months || [1, 4, 7, 10];
      const yearlyMonths = revenu.frequencyData?.months || [1];
      
      let estDu = false;
      if (revenu.frequency === FrequencyType.MONTHLY) {
        estDu = revenu.dayOfMonth === jour;
      } else if (revenu.frequency === FrequencyType.QUARTERLY) {
        estDu = quarterlyMonths.includes(mois) && revenu.dayOfMonth === jour;
      } else if (revenu.frequency === FrequencyType.YEARLY) {
        estDu = yearlyMonths.includes(mois) && revenu.dayOfMonth === jour;
      }

      if (estDu && dateProjection >= today) {
        soldeRunning += revenu.amount;
        evenements.push(`+${revenu.label}: ${revenu.amount}€`);
      }
    }

    // Vérifier les dépenses pour ce jour
    for (const depense of depenses) {
      const quarterlyMonths = depense.frequencyData?.months || [1, 4, 7, 10];
      const yearlyMonths = depense.frequencyData?.months || [1];
      
      let estDu = false;
      if (depense.frequency === FrequencyType.MONTHLY) {
        estDu = depense.dayOfMonth === jour;
      } else if (depense.frequency === FrequencyType.QUARTERLY) {
        estDu = quarterlyMonths.includes(mois) && depense.dayOfMonth === jour;
      } else if (depense.frequency === FrequencyType.YEARLY) {
        estDu = yearlyMonths.includes(mois) && depense.dayOfMonth === jour;
      }

      if (estDu && dateProjection >= today) {
        soldeRunning -= depense.amount;
        evenements.push(`-${depense.label}: ${depense.amount}€`);
      }
    }

    const status = i === 0 ? " (AUJOURD'HUI)" : "";
    console.log(`${dateProjection.toLocaleDateString('fr-FR')}${status}: ${soldeRunning}€`);
    if (evenements.length > 0) {
      console.log(`  Événements: ${evenements.join(', ')}`);
    }

    projection.push({
      date: dateProjection.toLocaleDateString('fr-FR'),
      solde: soldeRunning,
      evenements
    });
  }

  return projection;
}

// Configuration de test réaliste
const budgetTest = {
  soldeInitial: 1000,
  revenus: [
    {
      label: "Salaire",
      amount: 2500,
      dayOfMonth: 1,
      frequency: FrequencyType.MONTHLY,
      frequencyData: null
    },
    {
      label: "Prime trimestrielle",
      amount: 500,
      dayOfMonth: 15,
      frequency: FrequencyType.QUARTERLY,
      frequencyData: { months: [1, 4, 7, 10] } // Juillet inclus
    }
  ],
  depenses: [
    {
      label: "Loyer",
      amount: 800,
      dayOfMonth: 5,
      frequency: FrequencyType.MONTHLY,
      frequencyData: null
    },
    {
      label: "Assurance voiture",
      amount: 120,
      dayOfMonth: 8, // AUJOURD'HUI !
      frequency: FrequencyType.QUARTERLY,
      frequencyData: { months: [1, 4, 7, 10] } // Juillet inclus
    },
    {
      label: "Électricité",
      amount: 80,
      dayOfMonth: 15,
      frequency: FrequencyType.MONTHLY,
      frequencyData: null
    }
  ]
};

// Test avec la date actuelle (8 juillet 2025)
const today = new Date(2025, 6, 8); // 8 juillet 2025
console.log(`TEST AU ${today.toLocaleDateString('fr-FR')} (8 juillet 2025)\n`);

// 1. Calcul du solde
const resultatsBalance = simulerCalculSolde(
  budgetTest.revenus,
  budgetTest.depenses,
  budgetTest.soldeInitial,
  today
);

// 2. Projection du chart
const projection = simulerProjectionChart(
  budgetTest.revenus,
  budgetTest.depenses,
  budgetTest.soldeInitial,
  today
);

// 3. Vérification de cohérence
console.log("\n=== VÉRIFICATION DE COHÉRENCE ===");
const soldeChart = projection[0].solde; // Solde d'aujourd'hui dans le chart
const soldeBalance = resultatsBalance.soldeActuel;

console.log(`Solde calculé par la balance: ${soldeBalance}€`);
console.log(`Solde affiché dans le chart: ${soldeChart}€`);

if (Math.abs(soldeChart - soldeBalance) < 0.01) {
  console.log("✅ SUCCÈS - Chart et solde sont parfaitement coordonnés !");
} else {
  console.log("❌ PROBLÈME - Il y a encore une différence");
  console.log(`Écart: ${Math.abs(soldeChart - soldeBalance)}€`);
}

console.log("\n=== RÉSUMÉ ATTENDU ===");
console.log("Au 8 juillet 2025:");
console.log("- Salaire reçu le 1er juillet: +2500€");
console.log("- Loyer payé le 5 juillet: -800€");
console.log("- Assurance voiture payée le 8 juillet: -120€");
console.log("- Prime trimestrielle et électricité pas encore dues");
console.log(`- Solde attendu: 1000 + 2500 - 800 - 120 = 2580€`);
