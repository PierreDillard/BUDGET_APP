import { FrequencyType, FrequencyData } from './frequency.utils';

/**
 * Vérifier si une dépense/revenu a déjà été dû cette année (pour les fréquences non-mensuelles)
 * ou ce mois (pour les fréquences mensuelles)
 */
export function hasAlreadyOccurredThisYear(
  frequency: FrequencyType,
  frequencyData: FrequencyData | null,
  dayOfMonth: number,
  today: Date = new Date()
): boolean {
  const currentMonth = today.getMonth() + 1; // 1-12
  const currentYear = today.getFullYear();
  const currentDay = today.getDate();

  switch (frequency) {
    case FrequencyType.ONE_TIME:
      if (!frequencyData?.date) return false;
      const oneTimeDate = new Date(frequencyData.date);
      return oneTimeDate <= today;

    case FrequencyType.MONTHLY:
      // Pour les dépenses mensuelles, vérifier seulement ce mois-ci
      return dayOfMonth <= currentDay;

    case FrequencyType.QUARTERLY:
      const quarterlyMonths = frequencyData?.months || [1, 4, 7, 10];
      // Vérifier tous les mois trimestriels déjà passés cette année
      for (const month of quarterlyMonths) {
        if (month < currentMonth || (month === currentMonth && dayOfMonth <= currentDay)) {
          return true;
        }
      }
      return false;

    case FrequencyType.YEARLY:
      const yearlyMonths = frequencyData?.months || [1];
      // Vérifier tous les mois annuels déjà passés cette année
      for (const month of yearlyMonths) {
        if (month < currentMonth || (month === currentMonth && dayOfMonth <= currentDay)) {
          return true;
        }
      }
      return false;

    default:
      return false;
  }
}

/**
 * Calculer le montant pour le mois en cours uniquement (logique non-cumulative)
 * Chaque mois est traité indépendamment - pas de cumul depuis le début de l'année
 */
export function calculateCurrentMonthAmount(
  amount: number,
  frequency: FrequencyType,
  frequencyData: FrequencyData | null,
  dayOfMonth: number,
  today: Date = new Date()
): number {
  const currentMonth = today.getMonth() + 1; // 1-12
  const currentYear = today.getFullYear();
  const currentDay = today.getDate();

  switch (frequency) {
    case FrequencyType.ONE_TIME:
      if (!frequencyData?.date) return 0;
      const oneTimeDate = new Date(frequencyData.date);
      const isCurrentMonth = oneTimeDate.getFullYear() === currentYear && 
                            oneTimeDate.getMonth() + 1 === currentMonth;
      // UNIQUEMENT si l'événement unique a lieu ce mois ET est déjà passé
      return isCurrentMonth && oneTimeDate.getDate() <= currentDay ? amount : 0;

    case FrequencyType.MONTHLY:
      // UNIQUEMENT si le jour du mois est déjà passé ce mois-ci
      return dayOfMonth <= currentDay ? amount : 0;

    case FrequencyType.QUARTERLY:
      const quarterlyMonths = frequencyData?.months || [1, 4, 7, 10];
      // UNIQUEMENT si c'est un mois trimestriel ET le jour est déjà passé
      if (quarterlyMonths.includes(currentMonth)) {
        return dayOfMonth <= currentDay ? amount : 0;
      }
      return 0;

    case FrequencyType.YEARLY:
      const yearlyMonths = frequencyData?.months || [1];
      // UNIQUEMENT si c'est un mois annuel ET le jour est déjà passé
      if (yearlyMonths.includes(currentMonth)) {
        return dayOfMonth <= currentDay ? amount : 0;
      }
      return 0;

    default:
      return 0;
  }
}
