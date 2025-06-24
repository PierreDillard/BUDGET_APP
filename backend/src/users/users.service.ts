import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        currency: true,
        month_start_day: true,
        margin_pct: true,
        notification: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Transform database response to camelCase for frontend
    return {
      id: user.id,
      email: user.email,
      currency: user.currency,
      monthStartDay: user.month_start_day,
      marginPct: user.margin_pct,
      notification: user.notification,
      createdAt: user.created_at.toISOString(),
      updatedAt: user.updated_at.toISOString(),
    };
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      // Check if user exists
      await this.findById(id);

      // Transform camelCase properties to snake_case for database
      const dbData: any = { ...updateUserDto };
      if (updateUserDto.monthStartDay !== undefined) {
        dbData.month_start_day = updateUserDto.monthStartDay;
        delete dbData.monthStartDay;
      }
      if (updateUserDto.marginPct !== undefined) {
        dbData.margin_pct = updateUserDto.marginPct;
        delete dbData.marginPct;
      }

      const updatedUser = await this.prisma.users.update({
        where: { id },
        data: dbData,
        select: {
          id: true,
          email: true,
          currency: true,
          month_start_day: true,
          margin_pct: true,
          notification: true,
          created_at: true,
          updated_at: true,
        },
      });

      this.logger.log(`User profile updated: ${updatedUser.email}`);

      // Transform database response to camelCase for frontend
      return {
        id: updatedUser.id,
        email: updatedUser.email,
        currency: updatedUser.currency,
        monthStartDay: updatedUser.month_start_day,
        marginPct: updatedUser.margin_pct,
        notification: updatedUser.notification,
        createdAt: updatedUser.created_at.toISOString(),
        updatedAt: updatedUser.updated_at.toISOString(),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error updating user profile:', error);
      throw new Error('Failed to update user profile');
    }
  }

  async delete(id: string) {
    try {
      // Check if user exists
      await this.findById(id);

      // Delete user (cascade will handle related records)
      await this.prisma.users.delete({
        where: { id },
      });

      this.logger.log(`User account deleted: ${id}`);

      return { message: 'User account successfully deleted' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error deleting user account:', error);
      throw new Error('Failed to delete user account');
    }
  }

  async getUserStats(id: string) {
    try {
      // Check if user exists
      await this.findById(id);

      const stats = await this.prisma.users.findUnique({
        where: { id },
        select: {
          _count: {
            select: {
              rec_incomes: true,
              rec_expenses: true,
              planned_expenses: true,
            },
          },
          rec_incomes: {
            select: {
              amount: true,
            },
          },
          rec_expenses: {
            select: {
              amount: true,
            },
          },
          planned_expenses: {
            select: {
              amount: true,
              spent: true,
            },
          },
        },
      });

      const totalIncome = stats.rec_incomes.reduce((sum, income) => sum + income.amount, 0);
      const totalExpenses = stats.rec_expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const totalPlanned = stats.planned_expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const totalSpent = stats.planned_expenses
        .filter(expense => expense.spent)
        .reduce((sum, expense) => sum + expense.amount, 0);

      return {
        counts: stats._count,
        totals: {
          monthlyIncome: totalIncome,
          monthlyExpenses: totalExpenses,
          totalPlanned,
          totalSpent,
          monthlyBalance: totalIncome - totalExpenses,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error getting user stats:', error);
      throw new Error('Failed to get user statistics');
    }
  }
}