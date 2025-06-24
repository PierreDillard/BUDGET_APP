import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlannedExpenseDto, UpdatePlannedExpenseDto, MarkAsSpentDto } from './dto/planned-expense.dto';
import { startOfMonth, endOfMonth, addMonths, isAfter, isBefore, parseISO } from 'date-fns';

@Injectable()
export class PlannedExpensesService {
  private readonly logger = new Logger(PlannedExpensesService.name);

  constructor(private prisma: PrismaService) {}

  async create(user_id: string, createPlannedExpenseDto: CreatePlannedExpenseDto) {
    try {
      // Validate that the date is not in the past
      const expenseDate = parseISO(createPlannedExpenseDto.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (isBefore(expenseDate, today)) {
        throw new BadRequestException('Cannot create planned expense for a past date');
      }

      const plannedExpense = await this.prisma.planned_expenses.create({
        data: {
          label: createPlannedExpenseDto.label,
          amount: createPlannedExpenseDto.amount,
          date: expenseDate,
          user_id: user_id,
          category: createPlannedExpenseDto.category || 'other',
          spent: false,
        },
      });

      this.logger.log(`Planned expense created: ${plannedExpense.label} for user ${user_id}`);
      return {
        id: plannedExpense.id,
        label: plannedExpense.label,
        amount: plannedExpense.amount,
        date: plannedExpense.date.toISOString(),
        category: plannedExpense.category,
        spent: plannedExpense.spent,
        userId: plannedExpense.user_id,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Error creating planned expense:', error);
      throw new Error('Failed to create planned expense');
    }
  }

  async findAll(user_id: string, spent?: boolean) {
    try {
      const where: any = { user_id: user_id };
      
      if (spent !== undefined) {
        where.spent = spent;
      }

      const plannedExpenses = await this.prisma.planned_expenses.findMany({
        where,
        orderBy: [
          { date: 'asc' },
          { amount: 'desc' },
        ],
      });

      return plannedExpenses.map(expense => ({
          id: expense.id,
          label: expense.label,
          amount: expense.amount,
          date: expense.date.toISOString(),
          category: expense.category,
          spent: expense.spent,
          userId: expense.user_id,
        }));
    } catch (error) {
      this.logger.error('Error fetching planned expenses:', error);
      throw new Error('Failed to fetch planned expenses');
    }
  }

  async findOne(user_id: string, id: string) {
    try {
      const plannedExpense = await this.prisma.planned_expenses.findFirst({
        where: {
          id,
          user_id: user_id,
        },
      });

      if (!plannedExpense) {
        throw new NotFoundException('Planned expense not found');
      }

      return {
        id: plannedExpense.id,
        label: plannedExpense.label,
        amount: plannedExpense.amount,
        date: plannedExpense.date.toISOString(),
        category: plannedExpense.category,
        spent: plannedExpense.spent,
        userId: plannedExpense.user_id,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error fetching planned expense:', error);
      throw new Error('Failed to fetch planned expense');
    }
  }

  async update(user_id: string, id: string, updatePlannedExpenseDto: UpdatePlannedExpenseDto) {
    try {
      // Check if planned expense exists and belongs to user
      await this.findOne(user_id, id);

      // If updating date, validate it's not in the past
      if (updatePlannedExpenseDto.date) {
        const expenseDate = parseISO(updatePlannedExpenseDto.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (isBefore(expenseDate, today)) {
          throw new BadRequestException('Cannot set planned expense date to a past date');
        }
      }

      const updateData = { ...updatePlannedExpenseDto };
      if (updateData.date) {
        updateData.date = parseISO(updateData.date) as any;
      }

      const updatedPlannedExpense = await this.prisma.planned_expenses.update({
        where: { id },
        data: {
          ...(updateData.label !== undefined && { label: updateData.label }),
          ...(updateData.amount !== undefined && { amount: updateData.amount }),
          ...(updateData.date !== undefined && { date: updateData.date }),
          ...(updateData.spent !== undefined && { spent: updateData.spent }),
          ...(updateData.category !== undefined && { category: updateData.category }),
        },
      });

      this.logger.log(`Planned expense updated: ${updatedPlannedExpense.label} for user ${user_id}`);
      return {
        id: updatedPlannedExpense.id,
        label: updatedPlannedExpense.label,
        amount: updatedPlannedExpense.amount,
        date: updatedPlannedExpense.date.toISOString(),
        category: updatedPlannedExpense.category,
        spent: updatedPlannedExpense.spent,
        userId: updatedPlannedExpense.user_id,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Error updating planned expense:', error);
      throw new Error('Failed to update planned expense');
    }
  }

  async remove(user_id: string, id: string) {
    try {
      // Check if planned expense exists and belongs to user
      const plannedExpense = await this.findOne(user_id, id);

      await this.prisma.planned_expenses.delete({
        where: { id },
      });

      this.logger.log(`Planned expense deleted: ${plannedExpense.label} for user ${user_id}`);
      return { message: 'Planned expense successfully deleted' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error deleting planned expense:', error);
      throw new Error('Failed to delete planned expense');
    }
  }

  async markAsSpent(user_id: string, id: string, markAsSpentDto: MarkAsSpentDto) {
    try {
      // Check if planned expense exists and belongs to user
      await this.findOne(user_id, id);

      const updatedPlannedExpense = await this.prisma.planned_expenses.update({
        where: { id },
        data: { spent: markAsSpentDto.spent },
      });

      this.logger.log(`Planned expense marked as ${markAsSpentDto.spent ? 'spent' : 'unspent'}: ${updatedPlannedExpense.label} for user ${user_id}`);
      return {
        id: updatedPlannedExpense.id,
        label: updatedPlannedExpense.label,
        amount: updatedPlannedExpense.amount,
        date: updatedPlannedExpense.date.toISOString(),
        category: updatedPlannedExpense.category,
        spent: updatedPlannedExpense.spent,
        userId: updatedPlannedExpense.user_id,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error marking planned expense as spent:', error);
      throw new Error('Failed to update planned expense status');
    }
  }

  async getStatistics(user_id: string) {
    try {
      const stats = await this.prisma.planned_expenses.aggregate({
        where: { user_id: user_id },
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
      });

      const spentStats = await this.prisma.planned_expenses.aggregate({
        where: { user_id: user_id, spent: true },
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
      });

      const unspentStats = await this.prisma.planned_expenses.aggregate({
        where: { user_id: user_id, spent: false },
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
      });

      return {
        total: {
          count: stats._count.id,
          amount: stats._sum.amount || 0,
        },
        spent: {
          count: spentStats._count.id,
          amount: spentStats._sum.amount || 0,
        },
        unspent: {
          count: unspentStats._count.id,
          amount: unspentStats._sum.amount || 0,
        },
      };
    } catch (error) {
      this.logger.error('Error fetching planned expenses statistics:', error);
      throw new Error('Failed to fetch planned expenses statistics');
    }
  }

  async getByCategory(user_id: string) {
    try {
      const plannedExpenses = await this.prisma.planned_expenses.groupBy({
        by: ['category'],
        where: { user_id: user_id },
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
        orderBy: {
          _sum: {
            amount: 'desc',
          },
        },
      });

      return plannedExpenses.map(expense => ({
        category: expense.category,
        totalAmount: expense._sum.amount || 0,
        count: expense._count.id,
      }));
    } catch (error) {
      this.logger.error('Error fetching planned expenses by category:', error);
      throw new Error('Failed to fetch planned expenses by category');
    }
  }

  async getUpcoming(user_id: string, days: number = 30) {
    try {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + days);

      const upcomingExpenses = await this.prisma.planned_expenses.findMany({
        where: {
          user_id: user_id,
          spent: false,
          date: {
            gte: today,
            lte: futureDate,
          },
        },
        orderBy: { date: 'asc' },
      });

      return upcomingExpenses.map(expense => ({
        ...expense,
        daysUntil: Math.ceil((expense.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
      }));
    } catch (error) {
      this.logger.error('Error fetching upcoming planned expenses:', error);
      throw new Error('Failed to fetch upcoming planned expenses');
    }
  }

  async getOverdue(user_id: string) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const overdueExpenses = await this.prisma.planned_expenses.findMany({
        where: {
          user_id: user_id,
          spent: false,
          date: {
            lt: today,
          },
        },
        orderBy: { date: 'asc' },
      });

      return overdueExpenses.map(expense => ({
        ...expense,
        daysPastDue: Math.ceil((today.getTime() - expense.date.getTime()) / (1000 * 60 * 60 * 24)),
      }));
    } catch (error) {
      this.logger.error('Error fetching overdue planned expenses:', error);
      throw new Error('Failed to fetch overdue planned expenses');
    }
  }

  async getMonthlyProjection(user_id: string, months: number = 6) {
    try {
      const today = new Date();
      const projections = [];

      for (let i = 0; i < months; i++) {
        const monthStart = startOfMonth(addMonths(today, i));
        const monthEnd = endOfMonth(addMonths(today, i));

        const monthlyExpenses = await this.prisma.planned_expenses.aggregate({
          where: {
            user_id: user_id,
            spent: false,
            date: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
          _sum: {
            amount: true,
          },
          _count: {
            id: true,
          },
        });

        projections.push({
          month: monthStart.toISOString().slice(0, 7), // YYYY-MM format
          count: monthlyExpenses._count.id,
          totalAmount: monthlyExpenses._sum.amount || 0,
        });
      }

      return projections;
    } catch (error) {
      this.logger.error('Error fetching monthly projection:', error);
      throw new Error('Failed to fetch monthly projection');
    }
  }
}