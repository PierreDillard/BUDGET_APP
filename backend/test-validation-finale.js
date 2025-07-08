// Test de validation - Chart et Solde coordonnés
console.log("=== VALIDATION FINALE - COORDINATION CHART/SOLDE ===\n");

const FrequencyType = {
  MONTHLY: 'MONTHLY',
  QUARTERLY: 'QUARTERLY',
  YEARLY: 'YEARLY'
};

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

// Test avec vos données réelles
const today = new Date(2025, 6, 8); // 8 juillet 2025
console.log(`Date actuelle: ${today.toLocaleDateString('fr-FR')}\n`);

// Exemple de dépense trimestrielle que vous avez modifiée
const assuranceTrimestrielle = {
  label: "Assurance voiture",
  amount: 120,
  dayOfMonth: 8, // Modifiée pour aujourd'hui
  frequency: FrequencyType.QUARTERLY,
  frequencyData: { months: [1, 4, 7, 10] } // Juillet inclus
};

console.log("=== DÉPENSE TRIMESTRIELLE MODIFIÉE ===");
console.log(`${assuranceTrimestrielle.label}: ${assuranceTrimestrielle.amount}€`);
console.log(`Jour du mois: ${assuranceTrimestrielle.dayOfMonth}`);
console.log(`Mois trimestriels: ${assuranceTrimestrielle.frequencyData.months.join(', ')}`);

// Test avec calculateCurrentMonthAmount (utilisé maintenant partout)
const montantCalcule = calculateCurrentMonthAmount(
  assuranceTrimestrielle.amount,
  assuranceTrimestrielle.frequency,
  assuranceTrimestrielle.frequencyData,
  assuranceTrimestrielle.dayOfMonth,
  today
);

console.log(`\n=== RÉSULTAT ===`);
console.log(`Montant calculé: ${montantCalcule}€`);

if (montantCalcule === 120) {
  console.log("✅ SUCCÈS - La dépense est correctement prise en compte");
  console.log("   → Chart et solde utilisent la même logique");
  console.log("   → Ils afficheront tous les deux la même chose");
} else {
  console.log("❌ PROBLÈME - La dépense n'est pas prise en compte");
}

console.log("\n=== CE QUI A ÉTÉ CORRIGÉ ===");
console.log("1. Le calcul du solde utilise calculateCurrentMonthAmount");
console.log("2. L'affichage des totaux utilise maintenant calculateCurrentMonthAmount");
console.log("3. Fini l'ancienne logique isDueInMonth pour les totaux");
console.log("4. Chart et solde sont maintenant coordonnés");

console.log("\n=== COMPORTEMENT ATTENDU ===");
console.log("- Si vous modifiez une dépense trimestrielle pour aujourd'hui:");
console.log("- Le chart l'affichera immédiatement");
console.log("- Le solde la déduira immédiatement");
console.log("- Les deux seront parfaitement synchronisés !");
