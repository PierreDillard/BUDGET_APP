// Utility functions for frequency calculations
export enum FrequencyType {
  ONE_TIME = 'ONE_TIME',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
}

export interface FrequencyData {
  months?: number[]; // For quarterly/yearly: which months (1-12)
  date?: string;     // For one-time: specific date
}

/**
 * Calculate monthly equivalent amount based on frequency
 * @deprecated Use isDueInCurrentMonth instead for accurate frequency handling
 */
export function calculateMonthlyEquivalent(amount: number, frequency: FrequencyType): number {
  switch (frequency) {
    case FrequencyType.ONE_TIME:
      return 0; // One-time amounts don't contribute to monthly calculations
    case FrequencyType.MONTHLY:
      return amount;
    case FrequencyType.QUARTERLY:
      return amount / 3; // Spread quarterly amount over 3 months
    case FrequencyType.YEARLY:
      return amount / 12; // Spread yearly amount over 12 months
    default:
      return amount;
  }
}

/**
 * Check if an income/expense is due in the current month
 */
export function isDueInCurrentMonth(
  frequency: FrequencyType,
  frequencyData: FrequencyData | null,
  today: Date = new Date()
): boolean {
  const currentMonth = today.getMonth() + 1; // 1-12
  const currentYear = today.getFullYear();
  
  return isDueInMonth(frequency, frequencyData, 1, currentMonth, currentYear);
}

/**
 * Get display frequency text
 */
export function getFrequencyDisplayText(frequency: FrequencyType, frequencyData?: FrequencyData): string {
  switch (frequency) {
    case FrequencyType.ONE_TIME:
      return frequencyData?.date ? `Le ${new Date(frequencyData.date).toLocaleDateString('fr-FR')}` : 'Ponctuel';
    case FrequencyType.MONTHLY:
      return 'Mensuel';
    case FrequencyType.QUARTERLY:
      if (frequencyData?.months) {
        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
        const months = frequencyData.months.map(m => monthNames[m - 1]).join(', ');
        return `Trimestriel (${months})`;
      }
      return 'Trimestriel';
    case FrequencyType.YEARLY:
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
 * Check if an income/expense is due in a given month/year
 */
export function isDueInMonth(
  frequency: FrequencyType,
  frequencyData: FrequencyData | null,
  dayOfMonth: number,
  month: number, // 1-12
  year: number
): boolean {
  const today = new Date();
  const targetDate = new Date(year, month - 1, dayOfMonth);

  switch (frequency) {
    case FrequencyType.ONE_TIME:
      if (!frequencyData?.date) return false;
      const oneTimeDate = new Date(frequencyData.date);
      return oneTimeDate.getFullYear() === year && 
             oneTimeDate.getMonth() + 1 === month;

    case FrequencyType.MONTHLY:
      return true; // Monthly items are due every month

    case FrequencyType.QUARTERLY:
      if (!frequencyData?.months) {
        // Default quarterly: Jan, Apr, Jul, Oct
        return [1, 4, 7, 10].includes(month);
      }
      return frequencyData.months.includes(month);

    case FrequencyType.YEARLY:
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
  frequencyData: FrequencyData | null,
  dayOfMonth: number
): Date | null {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  switch (frequency) {
    case FrequencyType.ONE_TIME:
      if (!frequencyData?.date) return null;
      const oneTimeDate = new Date(frequencyData.date);
      return oneTimeDate > today ? oneTimeDate : null;

    case FrequencyType.MONTHLY:
      // Next month if we've passed this month's due date, otherwise this month
      const thisMonthDue = new Date(currentYear, currentMonth - 1, dayOfMonth);
      if (thisMonthDue > today) {
        return thisMonthDue;
      }
      return new Date(currentYear, currentMonth, dayOfMonth);

    case FrequencyType.QUARTERLY:
      const quarterlyMonths = frequencyData?.months || [1, 4, 7, 10];
      for (const month of quarterlyMonths) {
        const dueDate = new Date(currentYear, month - 1, dayOfMonth);
        if (dueDate > today) {
          return dueDate;
        }
      }
      // If no due date this year, return first due date next year
      return new Date(currentYear + 1, quarterlyMonths[0] - 1, dayOfMonth);

    case FrequencyType.YEARLY:
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
