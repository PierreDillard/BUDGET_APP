import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto, UpdateExpenseDto } from './dto/expense.dto';

@Injectable()
export class ExpensesService {
  private readonly logger = new Logger(ExpensesService.name);

  constructor(private prisma: PrismaService) {}

  async create(createExpenseDto: CreateExpenseDto, user_id: string): Promise<any> {
    try {
      const expense = await this.prisma.rec_expenses.create({
        data: {
          label: createExpenseDto.label,
          amount: createExpenseDto.amount,
          day_of_month: createExpenseDto.dayOfMonth,
          category: createExpenseDto.category || 'other',
          user_id: user_id,
          updated_at: new Date(),
          ...(createExpenseDto.frequency && { frequency: createExpenseDto.frequency }),
          ...(createExpenseDto.frequencyData && { frequency_data: createExpenseDto.frequencyData }),
        } as any,
      });

      this.logger.log(`Expense created: ${expense.label} - ${expense.amount}€`);
      return {
        id: expense.id,
        label: expense.label,
        amount: expense.amount,
        dayOfMonth: expense.day_of_month,
        category: expense.category,
        frequency: (expense as any).frequency || 'MONTHLY',
        frequencyData: (expense as any).frequency_data || null,
        userId: expense.user_id,
      };
    } catch (error) {
      this.logger.error('Error creating expense:', error);
      throw new Error('Failed to create expense');
    }
  }

  async findAll(user_id: string, filters?: { category?: string }): Promise<any[]> {
    try {
      const expenses = await this.prisma.rec_expenses.findMany({
        where: {
          user_id: user_id,
          ...(filters?.category && { category: filters.category }),
        },
        orderBy: {
          day_of_month: 'asc',
        },
      });

      this.logger.log(`Found ${expenses.length} expenses for user ${user_id}`);
      return expenses.map(expense => ({
        id: expense.id,
        label: expense.label,
        amount: expense.amount,
        dayOfMonth: expense.day_of_month,
        category: expense.category,
        frequency: (expense as any).frequency || 'MONTHLY',
        frequencyData: (expense as any).frequency_data || null,
        userId: expense.user_id,
      }));
    } catch (error) {
      this.logger.error('Error finding expenses:', error);
      throw new Error('Failed to find expenses');
    }
  }

  async findOne(id: string, user_id: string): Promise<any> {
    try {
      const expense = await this.prisma.rec_expenses.findFirst({
        where: {
          id,
          user_id: user_id,
        },
      });

      if (!expense) {
        throw new NotFoundException('Expense not found');
      }

      return {
        id: expense.id,
        label: expense.label,
        amount: expense.amount,
        dayOfMonth: expense.day_of_month,
        category: expense.category,
        frequency: (expense as any).frequency || 'MONTHLY',
        frequencyData: (expense as any).frequency_data || null,
        userId: expense.user_id,
      };
    } catch (error) {
      this.logger.error('Error finding expense:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error('Failed to find expense');
    }
  }

  async update(id: string, updateExpenseDto: UpdateExpenseDto, user_id: string): Promise<any> {
    try {
      const updatedExpense = await this.prisma.rec_expenses.update({
        where: {
          id,
        },
        data: {
          ...(updateExpenseDto.label !== undefined && { label: updateExpenseDto.label }),
          ...(updateExpenseDto.amount !== undefined && { amount: updateExpenseDto.amount }),
          ...(updateExpenseDto.dayOfMonth !== undefined && { day_of_month: updateExpenseDto.dayOfMonth }),
          ...(updateExpenseDto.category !== undefined && { category: updateExpenseDto.category }),
          ...(updateExpenseDto.frequency !== undefined && { frequency: updateExpenseDto.frequency }),
          ...(updateExpenseDto.frequencyData !== undefined && { frequency_data: updateExpenseDto.frequencyData }),
          updated_at: new Date(),
        } as any,
      });

      this.logger.log(`Expense updated: ${updatedExpense.label} - ${updatedExpense.amount}€`);
      return {
        id: updatedExpense.id,
        label: updatedExpense.label,
        amount: updatedExpense.amount,
        dayOfMonth: updatedExpense.day_of_month,
        category: updatedExpense.category,
        frequency: (updatedExpense as any).frequency || 'MONTHLY',
        frequencyData: (updatedExpense as any).frequency_data || null,
        userId: updatedExpense.user_id,
      };
    } catch (error) {
      this.logger.error('Error updating expense:', error);
      throw new Error('Failed to update expense');
    }
  }

  async remove(user_id: string, id: string) {
    try {
      const expense = await this.findOne(id, user_id);

      await this.prisma.rec_expenses.delete({
        where: {
          id,
        },
      });

   this.logger.log(`Expense deleted: ${expense.label} for user ${user_id}`);
      return { message: 'Expense successfully deleted' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error deleting expense:', error);
      throw new Error('Failed to delete expense');
    }
  }

  async getTotalExpenses(user_id: string): Promise<number> {
    try {
      const result = await this.prisma.rec_expenses.aggregate({
        where: {
          user_id: user_id,
        },
        _sum: {
          amount: true,
        },
      });

      const total = result._sum.amount || 0;
      this.logger.log(`Total expenses for user ${user_id}: ${total}€`);
      return total;
    } catch (error) {
      this.logger.error('Error calculating total expenses:', error);
      throw new Error('Failed to calculate total expenses');
    }
  }

  async getExpensesByCategory(user_id: string) {
    try {
      const expenses = await this.prisma.rec_expenses.groupBy({
        by: ['category'],
        where: {
          user_id: user_id,
        },
        _sum: {
          amount: true,
        },
        _count: {
          _all: true,
        },
      });

      const result = expenses.map(expense => ({
        category: expense.category,
        total: expense._sum.amount || 0,
        count: expense._count._all,
      }));

      this.logger.log(`Expenses by category for user ${user_id}: ${result.length} categories`);
      return result;
    } catch (error) {
      this.logger.error('Error getting expenses by category:', error);
      throw new Error('Failed to get expenses by category');
    }
  }

  async getExpensesByDayOfMonth(user_id: string) {
    try {
      const expenses = await this.prisma.rec_expenses.findMany({
        where: {
          user_id: user_id,
        },
        orderBy: {
          day_of_month: 'asc',
        },
      });

      this.logger.log(`Found ${expenses.length} expenses by day of month for user ${user_id}`);
      return expenses.map(expense => ({
        id: expense.id,
        label: expense.label,
        amount: expense.amount,
        dayOfMonth: expense.day_of_month,
        category: expense.category,
        userId: expense.user_id,
      }));
    } catch (error) {
      this.logger.error('Error getting expenses by day of month:', error);
      throw new Error('Failed to get expenses by day of month');
    }
  }

  async getUpcomingExpenses(user_id: string, days: number = 7): Promise<any[]> {
    try {
      const currentDate = new Date();
      const currentDay = currentDate.getDate();
      const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
      
      // Get all expenses for the user
      const expenses = await this.prisma.rec_expenses.findMany({
        where: {
          user_id: user_id,
        },
        orderBy: {
          day_of_month: 'asc',
        },
      });

      // Filter expenses that are upcoming within the specified days
      const upcomingExpenses = expenses.filter(expense => {
        let daysDiff;
        
        if (expense.day_of_month >= currentDay) {
          // Expense is later this month
          daysDiff = expense.day_of_month - currentDay;
        } else {
          // Expense is next month
          daysDiff = (daysInMonth - currentDay) + expense.day_of_month;
        }
        
        return daysDiff <= days;
      });

      this.logger.log(`Found ${upcomingExpenses.length} upcoming expenses for user ${user_id} in next ${days} days`);
      
      return upcomingExpenses.map(expense => ({
        id: expense.id,
        label: expense.label,
        amount: expense.amount,
        dayOfMonth: expense.day_of_month,
        category: expense.category,
        userId: expense.user_id,
      }));
    } catch (error) {
      this.logger.error('Error getting upcoming expenses:', error);
      throw new Error('Failed to get upcoming expenses');
    }
  }
}