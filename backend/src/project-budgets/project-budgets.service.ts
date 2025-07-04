import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectBudgetDto, UpdateProjectBudgetDto, AddContributionDto, MonthlyAllocationDto } from './project-budgets.dto';

@Injectable()
export class ProjectBudgetsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.project_budgets.findMany({
      where: { user_id: userId },
      include: {
        contributions: {
          orderBy: { created_at: 'desc' }
        }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async findOne(id: string, userId: string) {
    const projectBudget = await this.prisma.project_budgets.findFirst({
      where: { id, user_id: userId },
      include: {
        contributions: {
          orderBy: { created_at: 'desc' }
        }
      }
    });

    if (!projectBudget) {
      throw new NotFoundException('Budget de projet non trouvé');
    }

    return projectBudget;
  }

  async create(userId: string, createProjectBudgetDto: CreateProjectBudgetDto) {
    const { target_date, ...data } = createProjectBudgetDto;
    
    return this.prisma.project_budgets.create({
      data: {
        ...data,
        target_date: target_date ? new Date(target_date) : null,
        user_id: userId,
        current_amount: 0,
        status: 'ACTIVE'
      },
      include: {
        contributions: true
      }
    });
  }

  async update(id: string, userId: string, updateProjectBudgetDto: UpdateProjectBudgetDto) {
    // Vérifier que le budget existe et appartient à l'utilisateur
    await this.findOne(id, userId);

    const { target_date, ...data } = updateProjectBudgetDto;

    return this.prisma.project_budgets.update({
      where: { id },
      data: {
        ...data,
        target_date: target_date ? new Date(target_date) : undefined
      },
      include: {
        contributions: {
          orderBy: { created_at: 'desc' }
        }
      }
    });
  }

  async remove(id: string, userId: string) {
    // Vérifier que le budget existe et appartient à l'utilisateur
    await this.findOne(id, userId);

    return this.prisma.project_budgets.delete({
      where: { id }
    });
  }

  async addContribution(id: string, userId: string, addContributionDto: AddContributionDto) {
    // Vérifier que le budget existe et appartient à l'utilisateur
    const projectBudget = await this.findOne(id, userId);

    // Ajouter la contribution
    await this.prisma.budget_contributions.create({
      data: {
        ...addContributionDto,
        project_budget_id: id,
        user_id: userId
      }
    });

    // Mettre à jour le montant actuel du budget
    const newCurrentAmount = projectBudget.current_amount + addContributionDto.amount;
    
    return this.prisma.project_budgets.update({
      where: { id },
      data: {
        current_amount: newCurrentAmount,
        status: newCurrentAmount >= projectBudget.target_amount ? 'COMPLETED' : projectBudget.status
      },
      include: {
        contributions: {
          orderBy: { created_at: 'desc' }
        }
      }
    });
  }

  async complete(id: string, userId: string) {
    // Vérifier que le budget existe et appartient à l'utilisateur
    await this.findOne(id, userId);

    return this.prisma.project_budgets.update({
      where: { id },
      data: { status: 'COMPLETED' },
      include: {
        contributions: {
          orderBy: { created_at: 'desc' }
        }
      }
    });
  }

  async pause(id: string, userId: string) {
    // Vérifier que le budget existe et appartient à l'utilisateur
    await this.findOne(id, userId);

    return this.prisma.project_budgets.update({
      where: { id },
      data: { status: 'PAUSED' },
      include: {
        contributions: {
          orderBy: { created_at: 'desc' }
        }
      }
    });
  }

  async resume(id: string, userId: string) {
    // Vérifier que le budget existe et appartient à l'utilisateur
    await this.findOne(id, userId);

    return this.prisma.project_budgets.update({
      where: { id },
      data: { status: 'ACTIVE' },
      include: {
        contributions: {
          orderBy: { created_at: 'desc' }
        }
      }
    });
  }

  async getStats(userId: string) {
    const budgets = await this.prisma.project_budgets.findMany({
      where: { user_id: userId },
      include: {
        contributions: true
      }
    });

    const totalBudgets = budgets.length;
    const activeBudgets = budgets.filter(b => b.status === 'ACTIVE').length;
    const completedBudgets = budgets.filter(b => b.status === 'COMPLETED').length;
    const pausedBudgets = budgets.filter(b => b.status === 'PAUSED').length;
    
    const totalTargetAmount = budgets.reduce((sum, b) => sum + b.target_amount, 0);
    const totalCurrentAmount = budgets.reduce((sum, b) => sum + b.current_amount, 0);
    const totalContributions = budgets.reduce((sum, b) => sum + b.contributions.length, 0);

    return {
      totalBudgets,
      activeBudgets,
      completedBudgets,
      pausedBudgets,
      totalTargetAmount,
      totalCurrentAmount,
      totalContributions,
      completionRate: totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0
    };
  }

  async allocateMonthlyAmount(projectBudgetId: string, userId: string, monthlyAllocationDto: MonthlyAllocationDto) {
    // Vérifier que le projet budget existe et appartient à l'utilisateur
    const projectBudget = await this.findOne(projectBudgetId, userId);

    // Calculer le solde actuel de l'utilisateur en récupérant toutes ses données
    const [recIncomes, recExpenses, plannedExpenses, balanceAdjustments] = await Promise.all([
      this.prisma.rec_incomes.findMany({ where: { user_id: userId } }),
      this.prisma.rec_expenses.findMany({ where: { user_id: userId } }),
      this.prisma.planned_expenses.findMany({ where: { user_id: userId, spent: false } }),
      this.prisma.balance_adjustments.findMany({ where: { user_id: userId } })
    ]);

    const totalIncome = recIncomes.reduce((sum, income) => sum + income.amount, 0);
    const totalExpenses = recExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalPlanned = plannedExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalAdjustments = balanceAdjustments.reduce((sum, adj) => sum + adj.amount, 0);

    const currentBalance = totalIncome - totalExpenses - totalPlanned + totalAdjustments;
    const { amount } = monthlyAllocationDto;

    // Vérifier que l'allocation ne rendra pas le solde négatif
    if (currentBalance - amount < 0) {
      throw new Error(
        `Allocation impossible. Votre solde actuel est de ${currentBalance.toFixed(2)}€. ` +
        `Allouer ${amount.toFixed(2)}€ rendrait votre solde négatif de ${(currentBalance - amount).toFixed(2)}€.`
      );
    }

    // Transaction pour s'assurer de la cohérence
    return this.prisma.$transaction(async (prisma) => {
      // Créer un ajustement de balance négatif (déduction)
      await prisma.balance_adjustments.create({
        data: {
          user_id: userId,
          amount: -amount, // Montant négatif pour déduire du solde
          description: monthlyAllocationDto.description || `Allocation mensuelle pour ${projectBudget.name}`,
          type: 'MANUAL_ADJUSTMENT'
        }
      });

      // Ajouter une contribution au projet budget
      await prisma.budget_contributions.create({
        data: {
          project_budget_id: projectBudgetId,
          user_id: userId,
          amount,
          description: monthlyAllocationDto.description || `Allocation mensuelle`
        }
      });

      // Mettre à jour le montant actuel du projet budget
      const updatedProjectBudget = await prisma.project_budgets.update({
        where: { id: projectBudgetId },
        data: {
          current_amount: {
            increment: amount
          }
        },
        include: {
          contributions: {
            orderBy: { created_at: 'desc' }
          }
        }
      });

      return updatedProjectBudget;
    });
  }
}
