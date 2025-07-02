import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUnexpectedExpenseDto, UpdateUnexpectedExpenseDto } from './dto';
import { startOfMonth, endOfMonth, addMonths, isAfter, isBefore, parseISO, subDays } from 'date-fns';

@Injectable()
export class UnexpectedExpensesService {
  private readonly logger = new Logger(UnexpectedExpensesService.name);

  constructor(private prisma: PrismaService) {}

  async create(user_id: string, createUnexpectedExpenseDto: CreateUnexpectedExpenseDto) {
    try {
      // Validate that the date is not in the future (unexpected expenses are past events)
      const expenseDate = parseISO(createUnexpectedExpenseDto.date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      if (isAfter(expenseDate, today)) {
        throw new BadRequestException('Cannot create unexpected expense for a future date');
      }

      const unexpectedExpense = await this.prisma.unexpected_expenses.create({
        data: {
          label: createUnexpectedExpenseDto.label,
          amount: createUnexpectedExpenseDto.amount,
          date: expenseDate,
          user_id: user_id,
          category: createUnexpectedExpenseDto.category || 'other',
          description: createUnexpectedExpenseDto.description,
        },
      });

      this.logger.log(`Unexpected expense created: ${unexpectedExpense.label} for user ${user_id}`);
      return {
        id: unexpectedExpense.id,
        label: unexpectedExpense.label,
        amount: unexpectedExpense.amount,
        date: unexpectedExpense.date.toISOString(),
        category: unexpectedExpense.category,
        description: unexpectedExpense.description,
        userId: unexpectedExpense.user_id,
        createdAt: unexpectedExpense.created_at.toISOString(),
        updatedAt: unexpectedExpense.updated_at.toISOString(),
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Error creating unexpected expense:', error);
      throw new Error('Failed to create unexpected expense');
    }
  }

  async findAll(user_id: string, year?: number) {
    try {
      const whereClause: any = { user_id };
      
      if (year) {
        whereClause.date = {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`),
        };
      }

      const unexpectedExpenses = await this.prisma.unexpected_expenses.findMany({
        where: whereClause,
        orderBy: { date: 'desc' },
      });

      return unexpectedExpenses.map(expense => ({
        id: expense.id,
        label: expense.label,
        amount: expense.amount,
        date: expense.date.toISOString(),
        category: expense.category,
        description: expense.description,
        userId: expense.user_id,
        createdAt: expense.created_at.toISOString(),
        updatedAt: expense.updated_at.toISOString(),
      }));
    } catch (error) {
      this.logger.error('Error fetching unexpected expenses:', error);
      throw new Error('Failed to fetch unexpected expenses');
    }
  }

  async findOne(user_id: string, id: string) {
    try {
      const unexpectedExpense = await this.prisma.unexpected_expenses.findFirst({
        where: { id, user_id },
      });

      if (!unexpectedExpense) {
        throw new NotFoundException('Unexpected expense not found');
      }

      return {
        id: unexpectedExpense.id,
        label: unexpectedExpense.label,
        amount: unexpectedExpense.amount,
        date: unexpectedExpense.date.toISOString(),
        category: unexpectedExpense.category,
        description: unexpectedExpense.description,
        userId: unexpectedExpense.user_id,
        createdAt: unexpectedExpense.created_at.toISOString(),
        updatedAt: unexpectedExpense.updated_at.toISOString(),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error fetching unexpected expense:', error);
      throw new Error('Failed to fetch unexpected expense');
    }
  }

  async update(user_id: string, id: string, updateUnexpectedExpenseDto: UpdateUnexpectedExpenseDto) {
    try {
      // Check if the expense exists and belongs to the user
      const existingExpense = await this.prisma.unexpected_expenses.findFirst({
        where: { id, user_id },
      });

      if (!existingExpense) {
        throw new NotFoundException('Unexpected expense not found');
      }

      // Validate date if provided
      if (updateUnexpectedExpenseDto.date) {
        const expenseDate = parseISO(updateUnexpectedExpenseDto.date);
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        if (isAfter(expenseDate, today)) {
          throw new BadRequestException('Cannot set unexpected expense date to future');
        }
      }

      const updatedExpense = await this.prisma.unexpected_expenses.update({
        where: { id },
        data: {
          ...(updateUnexpectedExpenseDto.label && { label: updateUnexpectedExpenseDto.label }),
          ...(updateUnexpectedExpenseDto.amount && { amount: updateUnexpectedExpenseDto.amount }),
          ...(updateUnexpectedExpenseDto.date && { date: parseISO(updateUnexpectedExpenseDto.date) }),
          ...(updateUnexpectedExpenseDto.category && { category: updateUnexpectedExpenseDto.category }),
          ...(updateUnexpectedExpenseDto.description !== undefined && { description: updateUnexpectedExpenseDto.description }),
        },
      });

      this.logger.log(`Unexpected expense updated: ${updatedExpense.label} for user ${user_id}`);
      return {
        id: updatedExpense.id,
        label: updatedExpense.label,
        amount: updatedExpense.amount,
        date: updatedExpense.date.toISOString(),
        category: updatedExpense.category,
        description: updatedExpense.description,
        userId: updatedExpense.user_id,
        createdAt: updatedExpense.created_at.toISOString(),
        updatedAt: updatedExpense.updated_at.toISOString(),
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Error updating unexpected expense:', error);
      throw new Error('Failed to update unexpected expense');
    }
  }

  async remove(user_id: string, id: string) {
    try {
      // Check if the expense exists and belongs to the user
      const existingExpense = await this.prisma.unexpected_expenses.findFirst({
        where: { id, user_id },
      });

      if (!existingExpense) {
        throw new NotFoundException('Unexpected expense not found');
      }

      await this.prisma.unexpected_expenses.delete({
        where: { id },
      });

      this.logger.log(`Unexpected expense deleted: ${existingExpense.label} for user ${user_id}`);
      return { message: 'Unexpected expense successfully deleted' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error deleting unexpected expense:', error);
      throw new Error('Failed to delete unexpected expense');
    }
  }

  async getStatistics(user_id: string, year?: number) {
    try {
      const whereClause: any = { user_id };
      
      if (year) {
        whereClause.date = {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`),
        };
      }

      const result = await this.prisma.unexpected_expenses.aggregate({
        where: whereClause,
        _count: true,
        _sum: { amount: true },
        _avg: { amount: true },
      });

      return {
        total: {
          count: result._count,
          amount: result._sum.amount || 0,
        },
        average: result._avg.amount || 0,
      };
    } catch (error) {
      this.logger.error('Error getting unexpected expenses statistics:', error);
      throw new Error('Failed to get statistics');
    }
  }

  async getByCategory(user_id: string, year?: number) {
    try {
      const whereClause: any = { user_id };
      
      if (year) {
        whereClause.date = {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`),
        };
      }

      const result = await this.prisma.unexpected_expenses.groupBy({
        by: ['category'],
        where: whereClause,
        _count: true,
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
      });

      return result.map(group => ({
        category: group.category,
        totalAmount: group._sum.amount || 0,
        count: group._count,
      }));
    } catch (error) {
      this.logger.error('Error getting unexpected expenses by category:', error);
      throw new Error('Failed to get expenses by category');
    }
  }

  async getRecent(user_id: string, days: number = 30) {
    try {
      const fromDate = subDays(new Date(), days);

      const unexpectedExpenses = await this.prisma.unexpected_expenses.findMany({
        where: {
          user_id,
          date: {
            gte: fromDate,
          },
        },
        orderBy: { date: 'desc' },
        take: 10,
      });

      return unexpectedExpenses.map(expense => ({
        id: expense.id,
        label: expense.label,
        amount: expense.amount,
        date: expense.date.toISOString(),
        category: expense.category,
        description: expense.description,
      }));
    } catch (error) {
      this.logger.error('Error getting recent unexpected expenses:', error);
      throw new Error('Failed to get recent expenses');
    }
  }

  async getMonthlyData(user_id: string, months: number = 12) {
    try {
      const fromDate = subDays(startOfMonth(new Date()), (months - 1) * 30);

      const expenses = await this.prisma.unexpected_expenses.findMany({
        where: {
          user_id,
          date: {
            gte: fromDate,
          },
        },
        orderBy: { date: 'asc' },
      });

      // Group by month
      const monthlyData = new Map<string, { count: number; totalAmount: number }>();

      expenses.forEach(expense => {
        const monthKey = expense.date.toISOString().slice(0, 7); // YYYY-MM
        const existing = monthlyData.get(monthKey) || { count: 0, totalAmount: 0 };
        
        monthlyData.set(monthKey, {
          count: existing.count + 1,
          totalAmount: existing.totalAmount + expense.amount,
        });
      });

      return Array.from(monthlyData.entries()).map(([month, data]) => ({
        month,
        count: data.count,
        totalAmount: data.totalAmount,
      }));
    } catch (error) {
      this.logger.error('Error getting monthly unexpected expenses data:', error);
      throw new Error('Failed to get monthly data');
    }
  }
}