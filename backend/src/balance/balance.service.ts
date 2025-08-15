import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IncomesService } from '../incomes/incomes.service';
import { ExpensesService } from '../expenses/expenses.service';
import { PlannedExpensesService } from '../planned-expenses/planned-expenses.service';
import { BalanceData, ProjectionData, AlertData, BalanceAdjustmentDto, MonthlyResetDto, MonthlyResetStatusDto } from './dto/balance.dto';
import { calculateMonthlyEquivalent, isDueInMonth, isDueInCurrentMonth, FrequencyType, FrequencyData } from '../common/frequency.utils';
import { calculateCurrentMonthAmount } from '../common/frequency-occurrence.utils';
import { startOfMonth, endOfMonth, addDays, format, parseISO, isAfter, isBefore, differenceInDays, addMonths } from 'date-fns';

@Injectable()
export class BalanceService {
  private readonly logger = new Logger(BalanceService.name);

  constructor(
    private prisma: PrismaService,
    private incomesService: IncomesService,
    private expensesService: ExpensesService,
    private plannedExpensesService: PlannedExpensesService,
  ) {}

  /**
   * Convert string frequency to FrequencyType enum
   */
  private convertStringToFrequencyType(frequency: string | undefined): FrequencyType {
    switch (frequency) {
      case 'MONTHLY':
        return FrequencyType.MONTHLY;
      case 'QUARTERLY':
        return FrequencyType.QUARTERLY;
      case 'YEARLY':
        return FrequencyType.YEARLY;
      case 'ONE_TIME':
        return FrequencyType.ONE_TIME;
      default:
        return FrequencyType.MONTHLY;
    }
  }

  async calculateBalance(user_id: string, month?: string): Promise<BalanceData> {
    try {
      // Get user settings for margin calculation and initial balance
      const user = await this.prisma.users.findUnique({
        where: { id: user_id },
        select: { margin_pct: true, initial_balance: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const today = new Date();

      // Récupérer tous les revenus et dépenses
      const incomes = await this.incomesService.findAll(user_id);
      const expenses = await this.expensesService.findAll(user_id);
      const plannedExpenses = await this.plannedExpensesService.findAll(user_id, false);

      // Commencer avec le solde initial défini par l'utilisateur
      let currentBalance = user.initial_balance;

      // Ajouter tous les ajustements manuels (corrections, etc.)
      const adjustments = await this.getBalanceAdjustments(user_id);
      const manualAdjustments = adjustments.filter(adj => adj.type !== 'MONTHLY_RESET');
      currentBalance += manualAdjustments.reduce((sum, adj) => sum + adj.amount, 0);

      // Ajouter les revenus du mois en cours selon leur fréquence
      for (const income of incomes) {
        const frequency = this.convertStringToFrequencyType(income.frequency as string);
        const frequencyData = income.frequencyData as FrequencyData || null;
        
        const monthAmount = calculateCurrentMonthAmount(
          income.amount, 
          frequency, 
          frequencyData, 
          income.dayOfMonth, 
          today
        );
        currentBalance += monthAmount;
      }

      // Soustraire les dépenses du mois en cours selon leur fréquence
      for (const expense of expenses) {
        const frequency = this.convertStringToFrequencyType(expense.frequency as string);
        const frequencyData = expense.frequencyData as FrequencyData || null;
        
        const monthAmount = calculateCurrentMonthAmount(
          expense.amount, 
          frequency, 
          frequencyData, 
          expense.dayOfMonth, 
          today
        );
        currentBalance -= monthAmount;
      }

      // Soustraire les budgets ponctuels déjà passés
      const totalPlanned = plannedExpenses.reduce((sum, expense) => {
        const expenseDate = new Date(expense.date);
        if (expenseDate <= today) {
          currentBalance -= expense.amount;
        }
        return sum + expense.amount;
      }, 0);

      // Total des revenus et dépenses pour le mois en cours (pour affichage)
      // IMPORTANT: Utiliser la même logique que pour le calcul du solde (calculateCurrentMonthAmount)
      // pour garantir la cohérence entre l'affichage et le solde calculé
      let totalIncome = 0;
      let totalExpenses = 0;

      for (const income of incomes) {
        const frequency = this.convertStringToFrequencyType(income.frequency as string);
        const frequencyData = income.frequencyData as FrequencyData || null;
        
        const monthAmount = calculateCurrentMonthAmount(
          income.amount, 
          frequency, 
          frequencyData, 
          income.dayOfMonth, 
          today
        );
        totalIncome += monthAmount;
      }

      for (const expense of expenses) {
        const frequency = this.convertStringToFrequencyType(expense.frequency as string);
        const frequencyData = expense.frequencyData as FrequencyData || null;
        
        const monthAmount = calculateCurrentMonthAmount(
          expense.amount, 
          frequency, 
          frequencyData, 
          expense.dayOfMonth, 
          today
        );
        totalExpenses += monthAmount;
      }

      // Calculer la marge
      const marginAmount = (currentBalance * user.margin_pct) / 100;
      const finalBalance = currentBalance - marginAmount;

      const balanceData: BalanceData = {
        currentBalance: Math.round(finalBalance * 100) / 100,
        totalIncome: Math.round(totalIncome * 100) / 100,
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        totalPlanned: Math.round(totalPlanned * 100) / 100,
        projectedBalance: Math.round(finalBalance * 100) / 100,
        marginAmount: Math.round(marginAmount * 100) / 100,
        adjustments: adjustments.map(adj => ({
          id: adj.id,
          amount: adj.amount,
          description: adj.description,
          date: adj.created_at.toISOString(),
          type: adj.type,
        })),
      };

      this.logger.log(`Balance calculated for user ${user_id}: ${finalBalance}€ (initial: ${user.initial_balance}€, current: ${currentBalance}€)`);
      return balanceData;
    } catch (error) {
      this.logger.error('Error calculating balance:', error);
      throw new Error('Failed to calculate balance');
    }
  }

  async adjustBalance(user_id: string, adjustmentDto: BalanceAdjustmentDto): Promise<BalanceData> {
    try {
      // Convert lowercase type to uppercase for Prisma enum
      const normalizeAdjustmentType = (type?: string): 'MANUAL_ADJUSTMENT' | 'CORRECTION' | 'MONTHLY_RESET' => {
        if (!type) return 'MANUAL_ADJUSTMENT';
        
        switch (type.toLowerCase()) {
          case 'manual_adjustment':
            return 'MANUAL_ADJUSTMENT';
          case 'correction':
            return 'CORRECTION';
          case 'monthly_reset':
            return 'MONTHLY_RESET';
          default:
            // If it's already uppercase, return as is
            if (['MANUAL_ADJUSTMENT', 'CORRECTION', 'MONTHLY_RESET'].includes(type)) {
              return type as 'MANUAL_ADJUSTMENT' | 'CORRECTION' | 'MONTHLY_RESET';
            }
            return 'MANUAL_ADJUSTMENT';
        }
      };

      // Create balance adjustment record
      await this.prisma.balance_adjustments.create({
        data: {
          user_id: user_id,
          amount: adjustmentDto.amount,
          description: adjustmentDto.description,
          type: normalizeAdjustmentType(adjustmentDto.type),
        },
      });

      this.logger.log(`Balance adjusted for user ${user_id}: ${adjustmentDto.amount}€ - ${adjustmentDto.description}`);

      // Return updated balance
      return this.calculateBalance(user_id);
    } catch (error) {
      this.logger.error('Error adjusting balance:', error);
      throw new Error('Failed to adjust balance');
    }
  }

  async getBalanceAdjustments(user_id: string) {
    return this.prisma.balance_adjustments.findMany({
      where: { user_id: user_id },
      orderBy: { created_at: 'desc' },
      take: 50, // Limit to last 50 adjustments
    });
  }

  async getSummary(user_id: string) {
    try {
      const [balance, alerts] = await Promise.all([
        this.calculateBalance(user_id),
        this.getAlerts(user_id),
      ]);

      return {
        balance,
        alerts,
        calculatedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Error generating summary:', error);
      throw new Error('Failed to generate summary');
    }
  }

  async getAlerts(user_id: string): Promise<AlertData[]> {
    try {
      const alerts: AlertData[] = [];

      // Get current balance
      const currentBalance = await this.calculateBalance(user_id);

      // Alert if current balance is negative
      if (currentBalance.currentBalance < 0) {
        alerts.push({
          type: 'error',
          title: 'Solde négatif',
          message: `Votre solde actuel est de ${currentBalance.currentBalance}€. Vous devez réduire vos dépenses ou augmenter vos revenus.`,
          amount: currentBalance.currentBalance,
        });
      }

      this.logger.log(`Generated ${alerts.length} alerts for user ${user_id}`);
      return alerts;
    } catch (error) {
      this.logger.error('Error generating alerts:', error);
      throw new Error('Failed to generate alerts');
    }
  }

  async triggerMonthlyReset(user_id: string): Promise<MonthlyResetDto> {
    try {
      // Get user settings
      const user = await this.prisma.users.findUnique({
        where: { id: user_id },
        select: { 
          margin_pct: true, 
          month_start_day: true,
          currency: true
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Calculate previous balance
      const previousBalance = await this.calculateBalance(user_id);

      // Get monthly income and expenses for calculation
      const monthlyIncome = await this.incomesService.getTotalIncome(user_id);
      const monthlyExpenses = await this.expensesService.getTotalExpenses(user_id);
      const netChange = monthlyIncome - monthlyExpenses;

      // Record the reset
      await this.prisma.balance_adjustments.create({
        data: {
          user_id: user_id,
          amount: netChange,
          description: 'Réinitialisation mensuelle automatique',
          type: 'MONTHLY_RESET',
        },
      });

      // Calculate new balance
      const newBalance = await this.calculateBalance(user_id);

      const resetData: MonthlyResetDto = {
        message: 'Réinitialisation mensuelle effectuée avec succès',
        newBalance: newBalance,
        resetDate: new Date().toISOString(),
        previousBalance: previousBalance.currentBalance,
        monthlyIncome,
        monthlyExpenses,
        netChange,
        lastResetDate: new Date().toISOString(),
      };

      this.logger.log(`Monthly reset completed for user ${user_id}`);
      return resetData;
    } catch (error) {
      this.logger.error('Error triggering monthly reset:', error);
      throw new Error('Failed to trigger monthly reset');
    }
  }

  async getMonthlyResetStatus(user_id: string): Promise<MonthlyResetStatusDto> {
    try {
      // Get user settings
      const user = await this.prisma.users.findUnique({
        where: { id: user_id },
        select: { month_start_day: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Find last reset
      const lastReset = await this.prisma.balance_adjustments.findFirst({
        where: {
          user_id: user_id,
          type: 'MONTHLY_RESET',
        },
        orderBy: { created_at: 'desc' },
      });

      const today = new Date();
      const monthStartDay = user.month_start_day || 1;

      // Calculate next reset date
      let nextReset = new Date(today.getFullYear(), today.getMonth(), monthStartDay);
      if (today.getDate() >= monthStartDay) {
        nextReset = new Date(today.getFullYear(), today.getMonth() + 1, monthStartDay);
      }

      // Calculate days since last reset
      const daysSinceLastReset = lastReset 
        ? Math.floor((today.getTime() - lastReset.created_at.getTime()) / (1000 * 60 * 60 * 24))
        : 999; // Very high number if never reset

      // Check if reset is due (if more than 30 days since last reset or if today is past the monthly start day)
      const isResetDue = daysSinceLastReset > 30 || today.getDate() >= monthStartDay;

      const statusData: MonthlyResetStatusDto = {
        lastReset: lastReset ? lastReset.created_at.toISOString() : null,
        nextReset: nextReset.toISOString(),
        isResetDue,
        daysSinceLastReset,
        monthStartDay,
      };

      return statusData;
    } catch (error) {
      this.logger.error('Error getting monthly reset status:', error);
      throw new Error('Failed to get monthly reset status');
    }
  }

  async calculateProjection(user_id: string, days: number = 30): Promise<ProjectionData[]> {
    try {
      const projection: ProjectionData[] = [];
      const today = new Date();
      
      // Récupérer l'utilisateur pour avoir le solde initial
      const user = await this.prisma.users.findUnique({
        where: { id: user_id },
        select: { initial_balance: true },
      });

      if (!user) {
        throw new Error('User not found');
      }
      
      // Récupérer tous les revenus et dépenses
      const incomes = await this.incomesService.findAll(user_id);
      const expenses = await this.expensesService.findAll(user_id);
      const plannedExpenses = await this.plannedExpensesService.findAll(user_id, false);
      
      // Commencer avec le solde initial défini par l'utilisateur
      let baseBalance = user.initial_balance;

      // Ajouter tous les ajustements manuels (corrections, etc.)
      const adjustments = await this.getBalanceAdjustments(user_id);
      const manualAdjustments = adjustments.filter(adj => adj.type !== 'MONTHLY_RESET');
      baseBalance += manualAdjustments.reduce((sum, adj) => sum + adj.amount, 0);

      // Ajouter les revenus du mois jusqu'à aujourd'hui selon leur fréquence
      const currentMonth = today.getMonth() + 1; // 1-12
      const currentYear = today.getFullYear();

      for (const income of incomes) {
        const frequency = this.convertStringToFrequencyType(income.frequency as string);
        const frequencyData = income.frequencyData as FrequencyData || null;
        
        if (isDueInMonth(frequency, frequencyData, income.dayOfMonth, currentMonth, currentYear)) {
          if (income.dayOfMonth <= today.getDate()) {
            baseBalance += income.amount;
          }
        }
      }
      
      // Soustraire les dépenses du mois jusqu'à aujourd'hui selon leur fréquence
      for (const expense of expenses) {
        const frequency = this.convertStringToFrequencyType(expense.frequency as string);
        const frequencyData = expense.frequencyData as FrequencyData || null;
        
        if (isDueInMonth(frequency, frequencyData, expense.dayOfMonth, currentMonth, currentYear)) {
          if (expense.dayOfMonth <= today.getDate()) {
            baseBalance -= expense.amount;
          }
        }
      }
      
      // Soustraire les budgets ponctuels déjà passés
      for (const planned of plannedExpenses) {
        const plannedDate = new Date(planned.date);
        if (plannedDate <= today) {
          baseBalance -= planned.amount;
        }
      }

      let runningBalance = baseBalance;

      // Projection sur les jours suivants
      for (let i = 0; i < days; i++) {
        const projectionDate = addDays(today, i);
        const dayOfMonth = projectionDate.getDate();
        
        const events = {
          incomes: [] as Array<{ label: string; amount: number }>,
          expenses: [] as Array<{ label: string; amount: number }>,
          plannedExpenses: [] as Array<{ label: string; amount: number }>,
        };

        // Revenus récurrents pour ce jour (seulement si >= aujourd'hui)
        if (projectionDate >= today) {
          const projectionMonth = projectionDate.getMonth() + 1;
          const projectionYear = projectionDate.getFullYear();
          
          for (const income of incomes) {
            const frequency = this.convertStringToFrequencyType(income.frequency as string);
            const frequencyData = income.frequencyData as FrequencyData || null;
            
            if (isDueInMonth(frequency, frequencyData, income.dayOfMonth, projectionMonth, projectionYear)) {
              if (income.dayOfMonth === dayOfMonth) {
                runningBalance += income.amount;
                events.incomes.push({ label: income.label, amount: income.amount });
              }
            }
          }

          // Dépenses récurrentes pour ce jour (seulement si >= aujourd'hui)
          for (const expense of expenses) {
            const frequency = this.convertStringToFrequencyType(expense.frequency as string);
            const frequencyData = expense.frequencyData as FrequencyData || null;
            
            if (isDueInMonth(frequency, frequencyData, expense.dayOfMonth, projectionMonth, projectionYear)) {
              if (expense.dayOfMonth === dayOfMonth) {
                runningBalance -= expense.amount;
                events.expenses.push({ label: expense.label, amount: expense.amount });
              }
            }
          }

          // Budgets ponctuels pour ce jour
          const dayPlannedExpenses = plannedExpenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.toDateString() === projectionDate.toDateString();
          });
          
          for (const expense of dayPlannedExpenses) {
            runningBalance -= expense.amount;
            events.plannedExpenses.push({ label: expense.label, amount: expense.amount });
          }
        }

        projection.push({
          date: projectionDate.toISOString().split('T')[0],
          balance: Math.round(runningBalance * 100) / 100,
          day: i,
          events: events.incomes.length > 0 || events.expenses.length > 0 || events.plannedExpenses.length > 0 ? events : undefined,
        });
      }

      this.logger.log(`Calculated projection for ${days} days for user ${user_id} starting from balance: ${baseBalance}€`);
      return projection;
    } catch (error) {
      this.logger.error('Error calculating projection:', error);
      throw new Error('Failed to calculate projection');
    }
  }

  async getMonthlyTrends(user_id: string, months: number = 6): Promise<Array<{
    month: string;
    income: number;
    expenses: number;
    balance: number;
    planned: number;
  }>> {
    try {
      const trends = [];
      const today = new Date();

      for (let i = 0; i < months; i++) {
        const monthDate = addMonths(today, -i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);
        
        // Get monthly totals (simplified - in a real scenario you'd want historical data)
        const monthlyIncome = await this.incomesService.getTotalIncome(user_id);
        const monthlyExpenses = await this.expensesService.getTotalExpenses(user_id);
        
        // Get planned expenses for this month
        const monthPlanned = await this.prisma.planned_expenses.aggregate({
          where: {
            user_id: user_id,
            date: {
              gte: monthStart,
              lte: monthEnd,
            },
            spent: false,
          },
          _sum: {
            amount: true,
          },
        });

        const plannedAmount = monthPlanned._sum.amount || 0;
        const balance = monthlyIncome - monthlyExpenses - plannedAmount;

        trends.unshift({
          month: monthDate.toISOString().slice(0, 7), // YYYY-MM format
          income: Math.round(monthlyIncome * 100) / 100,
          expenses: Math.round(monthlyExpenses * 100) / 100,
          balance: Math.round(balance * 100) / 100,
          planned: Math.round(plannedAmount * 100) / 100,
        });
      }

      this.logger.log(`Generated trends for ${months} months for user ${user_id}`);
      return trends;
    } catch (error) {
      this.logger.error('Error generating monthly trends:', error);
      throw new Error('Failed to generate monthly trends');
    }
  }

}


