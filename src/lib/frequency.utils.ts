// Utility functions for frequency calculations
import type { FrequencyType, FrequencyData } from '@/types';

/**
 * Calculate monthly equivalent amount based on frequency
 */
export function calculateMonthlyEquivalent(amount: number, frequency: FrequencyType): number {
  switch (frequency) {
    case 'ONE_TIME':
      return 0; // One-time amounts don't contribute to monthly calculations
    case 'MONTHLY':
      return amount;
    case 'QUARTERLY':
      return amount / 3; // Spread quarterly amount over 3 months
    case 'YEARLY':
      return amount / 12; // Spread yearly amount over 12 months
    default:
      return amount;
  }
}

/**
 * Get display frequency text in French
 */
export function getFrequencyDisplayText(frequency: FrequencyType, frequencyData?: FrequencyData): string {
  switch (frequency) {
    case 'ONE_TIME':
      return frequencyData?.date ? `Le ${new Date(frequencyData.date).toLocaleDateString('fr-FR')}` : 'Ponctuel';
    case 'MONTHLY':
      return 'Mensuel';
    case 'QUARTERLY':
      if (frequencyData?.months) {
        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
        const months = frequencyData.months.map(m => monthNames[m - 1]).join(', ');
        return `Trimestriel (${months})`;
      }
      return 'Trimestriel';
    case 'YEARLY':
      if (frequencyData?.months && frequencyData.months.length > 0) {
        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
        const month = monthNames[frequencyData.months[0] - 1];
        return `Annuel (${month})`;
      }
      return 'Annuel';
    default:
      return 'Inconnu';
  }
}

/**
 * Get frequency options for form select
 */
export const FREQUENCY_OPTIONS = [
  { value: 'MONTHLY', label: 'Mensuel' },
  { value: 'QUARTERLY', label: 'Trimestriel' },
  { value: 'YEARLY', label: 'Annuel' },
  { value: 'ONE_TIME', label: 'Ponctuel' },
] as const;

/**
 * Get quarterly month options
 */
export const QUARTERLY_MONTH_OPTIONS = [
  { value: [1, 4, 7, 10], label: 'Jan, Avr, Jul, Oct (traditionnel)' },
  { value: [2, 5, 8, 11], label: 'Fév, Mai, Aoû, Nov' },
  { value: [3, 6, 9, 12], label: 'Mar, Jun, Sep, Déc' },
];

/**
 * Get month options for yearly frequency
 */
export const YEARLY_MONTH_OPTIONS = [
  { value: 1, label: 'Janvier' },
  { value: 2, label: 'Février' },
  { value: 3, label: 'Mars' },
  { value: 4, label: 'Avril' },
  { value: 5, label: 'Mai' },
  { value: 6, label: 'Juin' },
  { value: 7, label: 'Juillet' },
  { value: 8, label: 'Août' },
  { value: 9, label: 'Septembre' },
  { value: 10, label: 'Octobre' },
  { value: 11, label: 'Novembre' },
  { value: 12, label: 'Décembre' },
];

/**
 * Check if an income/expense is due in a given month/year
 */
export function isDueInMonth(
  frequency: FrequencyType,
  frequencyData: FrequencyData | null | undefined,
  month: number, // 1-12
  year: number
): boolean {

  
  switch (frequency) {
    case 'ONE_TIME':
      if (!frequencyData?.date) return false;
      const oneTimeDate = new Date(frequencyData.date);
      return oneTimeDate.getFullYear() === year && 
             oneTimeDate.getMonth() + 1 === month;

    case 'MONTHLY':
      return true; // Monthly items are due every month

    case 'QUARTERLY':
      if (!frequencyData?.months) {
        // Default quarterly: Jan, Apr, Jul, Oct
        return [1, 4, 7, 10].includes(month);
      }
      return frequencyData.months.includes(month);

    case 'YEARLY':
      if (!frequencyData?.months) {
        // Default yearly: January
        return month === 1;
      }
      return frequencyData.months.includes(month);

    default:
      return false;
  }
}

/**
 * Get next due date for an income/expense
 */
export function getNextDueDate(
  frequency: FrequencyType,
  frequencyData: FrequencyData | null | undefined,
  dayOfMonth: number
): Date | null {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  switch (frequency) {
    case 'ONE_TIME':
      if (!frequencyData?.date) return null;
      const oneTimeDate = new Date(frequencyData.date);
      return oneTimeDate > today ? oneTimeDate : null;

    case 'MONTHLY':
      // Next month if we've passed this month's due date, otherwise this month
      const thisMonthDue = new Date(currentYear, currentMonth - 1, dayOfMonth);
      if (thisMonthDue > today) {
        return thisMonthDue;
      }
      return new Date(currentYear, currentMonth, dayOfMonth);

    case 'QUARTERLY':
      const quarterlyMonths = frequencyData?.months || [1, 4, 7, 10];
      for (const month of quarterlyMonths) {
        const dueDate = new Date(currentYear, month - 1, dayOfMonth);
        if (dueDate > today) {
          return dueDate;
        }
      }
      // If no due date this year, return first due date next year
      return new Date(currentYear + 1, quarterlyMonths[0] - 1, dayOfMonth);

    case 'YEARLY':
      const yearlyMonths = frequencyData?.months || [1];
      for (const month of yearlyMonths) {
        const dueDate = new Date(currentYear, month - 1, dayOfMonth);
        if (dueDate > today) {
          return dueDate;
        }
      }
      // If no due date this year, return first due date next year
      return new Date(currentYear + 1, yearlyMonths[0] - 1, dayOfMonth);

    default:
      return null;
  }
}
