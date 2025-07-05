import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IncomesService } from '../incomes/incomes.service';
import { ExpensesService } from '../expenses/expenses.service';
import { PlannedExpensesService } from '../planned-expenses/planned-expenses.service';
import { BalanceData, ProjectionData, AlertData, BalanceAdjustmentDto, MonthlyResetDto, MonthlyResetStatusDto } from './dto/balance.dto';
import { calculateMonthlyEquivalent } from '../common/frequency.utils';
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

  async calculateBalance(user_id: string, month?: string): Promise<BalanceData> {
    try {
      // Get user settings for margin calculation
      const user = await this.prisma.users.findUnique({
        where: { id: user_id },
        select: { margin_pct: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Get any balance adjustments
      const adjustments = await this.getBalanceAdjustments(user_id);
      const totalAdjustments = adjustments.reduce((sum, adj) => sum + adj.amount, 0);

      // Calculate totals using frequency-aware methods
      const totalIncome = await this.calculateMonthlyIncomes(user_id);
      const totalExpenses = await this.calculateMonthlyExpenses(user_id);
      
      // For planned expenses, only count unspent ones
      const plannedStats = await this.plannedExpensesService.getStatistics(user_id);
      const totalPlanned = plannedStats.unspent.amount;

      // Calculate current balance including adjustments
      const grossBalance = totalIncome - totalExpenses - totalPlanned + totalAdjustments;
      const marginAmount = (grossBalance * user.margin_pct) / 100;
      const currentBalance = grossBalance - marginAmount;

      // For projection, we consider the balance without planned expenses already spent
      const projectedBalance = currentBalance;

      const balanceData: BalanceData = {
        currentBalance: Math.round(currentBalance * 100) / 100,
        totalIncome: Math.round(totalIncome * 100) / 100,
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        totalPlanned: Math.round(totalPlanned * 100) / 100,
        projectedBalance: Math.round(projectedBalance * 100) / 100,
        marginAmount: Math.round(marginAmount * 100) / 100,
        adjustments: adjustments.map(adj => ({
          id: adj.id,
          amount: adj.amount,
          description: adj.description,
          date: adj.created_at.toISOString(),
          type: adj.type,
        })),
      };

      this.logger.log(`Balance calculated for user ${user_id}: ${currentBalance}€`);
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
      const currentBalance = await this.calculateBalance(user_id);
      let runningBalance = currentBalance.currentBalance;

      // Get recurring incomes and expenses
      const incomes = await this.incomesService.findAll(user_id);
      const expenses = await this.expensesService.findAll(user_id);
      const plannedExpenses = await this.plannedExpensesService.findAll(user_id, false); // Only unspent

      const today = new Date();

      for (let i = 0; i < days; i++) {
        const projectionDate = addDays(today, i);
        const dayOfMonth = projectionDate.getDate();
        
        const events = {
          incomes: [] as Array<{ label: string; amount: number }>,
          expenses: [] as Array<{ label: string; amount: number }>,
          plannedExpenses: [] as Array<{ label: string; amount: number }>,
        };

        // Check for recurring incomes on this day
        const dayIncomes = incomes.filter(income => income.dayOfMonth === dayOfMonth);
        for (const income of dayIncomes) {
          runningBalance += income.amount;
          events.incomes.push({ label: income.label, amount: income.amount });
        }

        // Check for recurring expenses on this day
        const dayExpenses = expenses.filter(expense => expense.dayOfMonth === dayOfMonth);
        for (const expense of dayExpenses) {
          runningBalance -= expense.amount;
          events.expenses.push({ label: expense.label, amount: expense.amount });
        }

        // Check for planned expenses on this day
        const dayPlannedExpenses = plannedExpenses.filter(expense => {
          const expenseDate = new Date(expense.date);
          return expenseDate.toDateString() === projectionDate.toDateString();
        });
        
        for (const expense of dayPlannedExpenses) {
          runningBalance -= expense.amount;
          events.plannedExpenses.push({ label: expense.label, amount: expense.amount });
        }

        projection.push({
          date: projectionDate.toISOString().split('T')[0],
          balance: Math.round(runningBalance * 100) / 100,
          day: i,
          events: Object.keys(events.incomes).length > 0 || 
                  Object.keys(events.expenses).length > 0 || 
                  Object.keys(events.plannedExpenses).length > 0 ? events : undefined,
        });
      }

      this.logger.log(`Calculated projection for ${days} days for user ${user_id}`);
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

  private async calculateMonthlyIncomes(user_id: string): Promise<number> {
    try {
      const incomes = await this.prisma.rec_incomes.findMany({
        where: { user_id },
      });

      return incomes.reduce((total, income) => {
        const frequency = (income as any).frequency || 'MONTHLY';
        return total + calculateMonthlyEquivalent(income.amount, frequency);
      }, 0);
    } catch (error) {
      this.logger.error('Error calculating monthly incomes:', error);
      return 0;
    }
  }

  private async calculateMonthlyExpenses(user_id: string): Promise<number> {
    try {
      const expenses = await this.prisma.rec_expenses.findMany({
        where: { user_id },
      });

      return expenses.reduce((total, expense) => {
        const frequency = (expense as any).frequency || 'MONTHLY';
        return total + calculateMonthlyEquivalent(expense.amount, frequency);
      }, 0);
    } catch (error) {
      this.logger.error('Error calculating monthly expenses:', error);
      return 0;
    }
  }
}
