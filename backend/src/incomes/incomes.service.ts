import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIncomeDto, UpdateIncomeDto } from './dto/income.dto';

@Injectable()
export class IncomesService {
  private readonly logger = new Logger(IncomesService.name);

  constructor(private prisma: PrismaService) {}

  async create(user_id: string, createIncomeDto: CreateIncomeDto) {
    try {
      const income = await this.prisma.rec_incomes.create({
        data: {
          label: createIncomeDto.label,
          amount: createIncomeDto.amount,
          day_of_month: createIncomeDto.dayOfMonth,
          category: createIncomeDto.category || 'salary',
          frequency: createIncomeDto.frequency || 'MONTHLY',
          frequency_data: createIncomeDto.frequencyData ? JSON.stringify(createIncomeDto.frequencyData) : null,
          user_id: user_id,
          updated_at: new Date(),
        } as any,
      });

      this.logger.log(`Income created: ${income.label} for user ${user_id}`);
      return {
        id: income.id,
        label: income.label,
        amount: income.amount,
        dayOfMonth: income.day_of_month,
        category: income.category,
        frequency: income.frequency as string,
        frequencyData: income.frequency_data as any,
        userId: income.user_id,
      };
    } catch (error) {
      this.logger.error('Error creating income:', error);
      throw new Error('Failed to create income');
    }
  }

  async findAll(user_id: string) {
    try {
      const incomes = await this.prisma.rec_incomes.findMany({
        where: { user_id: user_id },
        orderBy: [
          { day_of_month: 'asc' },
          { amount: 'desc' },
        ],
      });

      return incomes.map(income => ({
        id: income.id,
        label: income.label,
        amount: income.amount,
        dayOfMonth: income.day_of_month,
        category: income.category,
        frequency: (income as any).frequency,
        frequencyData: (income as any).frequency_data,
        userId: income.user_id,
      }));
    } catch (error) {
      this.logger.error('Error fetching incomes:', error);
      throw new Error('Failed to fetch incomes');
    }
  }

  async findOne(user_id: string, id: string) {
    try {
      const income = await this.prisma.rec_incomes.findFirst({
        where: {
          id,
          user_id: user_id,
        },
      });

      if (!income) {
        throw new NotFoundException('Income not found');
      }

      return {
        id: income.id,
        label: income.label,
        amount: income.amount,
        dayOfMonth: income.day_of_month,
        category: income.category,
        frequency: (income as any).frequency,
        frequencyData: (income as any).frequency_data,
        userId: income.user_id,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error fetching income:', error);
      throw new Error('Failed to fetch income');
    }
  }

  async update(user_id: string, id: string, updateIncomeDto: UpdateIncomeDto) {
    try {
      // Check if income exists and belongs to user
      await this.findOne(user_id, id);

      const updatedIncome = await this.prisma.rec_incomes.update({
        where: { id },
        data: {
          ...(updateIncomeDto.label !== undefined && { label: updateIncomeDto.label }),
          ...(updateIncomeDto.amount !== undefined && { amount: updateIncomeDto.amount }),
          ...(updateIncomeDto.dayOfMonth !== undefined && { day_of_month: updateIncomeDto.dayOfMonth }),
          ...(updateIncomeDto.category !== undefined && { category: updateIncomeDto.category }),
          ...(updateIncomeDto.frequency !== undefined && { frequency: updateIncomeDto.frequency }),
          ...(updateIncomeDto.frequencyData !== undefined && { frequency_data: JSON.stringify(updateIncomeDto.frequencyData) }),
          updated_at: new Date(),
        } as any,
      });

      this.logger.log(`Income updated: ${updatedIncome.label} for user ${user_id}`);
      return {
        id: updatedIncome.id,
        label: updatedIncome.label,
        amount: updatedIncome.amount,
        dayOfMonth: updatedIncome.day_of_month,
        category: updatedIncome.category,
        frequency: (updatedIncome as any).frequency,
        frequencyData: (updatedIncome as any).frequency_data,
        userId: updatedIncome.user_id,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error updating income:', error);
      throw new Error('Failed to update income');
    }
  }

  async remove(user_id: string, id: string) {
    try {
      // Check if income exists and belongs to user
      const income = await this.findOne(user_id, id);

      await this.prisma.rec_incomes.delete({
        where: { id },
      });

      this.logger.log(`Income deleted: ${income.label} for user ${user_id}`);
      return { message: 'Income successfully deleted' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error deleting income:', error);
      throw new Error('Failed to delete income');
    }
  }

  async getTotalIncome(user_id: string): Promise<number> {
    try {
      const result = await this.prisma.rec_incomes.aggregate({
        where: { user_id: user_id },
        _sum: {
          amount: true,
        },
      });

      return result._sum.amount || 0;
    } catch (error) {
      this.logger.error('Error calculating total income:', error);
      throw new Error('Failed to calculate total income');
    }
  }

  async getIncomesByCategory(user_id: string) {
    try {
      const incomes = await this.prisma.rec_incomes.groupBy({
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

      return incomes.map(income => ({
        category: income.category,
        totalAmount: income._sum.amount || 0,
        count: income._count.id,
      }));
    } catch (error) {
      this.logger.error('Error fetching incomes by category:', error);
      throw new Error('Failed to fetch incomes by category');
    }
  }

  async validateDayOfMonth(day_of_month: number, month?: number, year?: number): Promise<boolean> {
    // Basic validation
    if (day_of_month < 1 || day_of_month > 31) {
      return false;
    }

    // If month and year provided, check if day exists in that month
    if (month && year) {
      const daysInMonth = new Date(year, month, 0).getDate();
      return day_of_month <= daysInMonth;
    }

    // For general validation, ensure day is not greater than 28 (exists in all months)
    return day_of_month <= 28 || day_of_month <= 31;
  }
}