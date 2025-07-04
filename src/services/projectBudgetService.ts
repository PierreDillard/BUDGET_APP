import { BaseApiService } from './baseApiService';
import type {
  ProjectBudget,
  CreateProjectBudgetRequest,
  UpdateProjectBudgetRequest,
  AddContributionRequest,
  BudgetContribution,
  ProjectBudgetStats
} from '../types/projectBudget';

export class ProjectBudgetService extends BaseApiService {
  private readonly basePath = '/project-budgets';

  async getProjectBudgets(): Promise<ProjectBudget[]> {
    const response = await this.get<ProjectBudget[]>(this.basePath);
    return response.data;
  }

  async getProjectBudget(id: string): Promise<ProjectBudget> {
    const response = await this.get<ProjectBudget>(`${this.basePath}/${id}`);
    return response.data;
  }

  async createProjectBudget(data: CreateProjectBudgetRequest): Promise<ProjectBudget> {
    // Convertir la date en string ISO si elle existe
    const serializedData = {
      ...data,
      target_date: data.target_date?.toISOString()
    };
    const response = await this.post<ProjectBudget>(this.basePath, serializedData);
    return response.data;
  }

  async updateProjectBudget(id: string, data: UpdateProjectBudgetRequest): Promise<ProjectBudget> {
    // Convertir la date en string ISO si elle existe
    const serializedData = {
      ...data,
      target_date: data.target_date?.toISOString()
    };
    const response = await this.put<ProjectBudget>(`${this.basePath}/${id}`, serializedData);
    return response.data;
  }

  async deleteProjectBudget(id: string): Promise<void> {
    await this.delete(`${this.basePath}/${id}`);
  }

  async addContribution(projectBudgetId: string, data: AddContributionRequest): Promise<BudgetContribution> {
    const response = await this.post<BudgetContribution>(
      `${this.basePath}/${projectBudgetId}/contributions`,
      data
    );
    return response.data;
  }

  async getContributions(projectBudgetId: string): Promise<BudgetContribution[]> {
    const response = await this.get<BudgetContribution[]>(
      `${this.basePath}/${projectBudgetId}/contributions`
    );
    return response.data;
  }

  async deleteContribution(projectBudgetId: string, contributionId: string): Promise<void> {
    await this.delete(`${this.basePath}/${projectBudgetId}/contributions/${contributionId}`);
  }

  async getProjectBudgetStats(): Promise<ProjectBudgetStats> {
    const response = await this.get<ProjectBudgetStats>(`${this.basePath}/stats`);
    return response.data;
  }

  async completeProjectBudget(id: string): Promise<ProjectBudget> {
    const response = await this.patch<ProjectBudget>(`${this.basePath}/${id}/complete`, {});
    return response.data;
  }

  async pauseProjectBudget(id: string): Promise<ProjectBudget> {
    const response = await this.patch<ProjectBudget>(`${this.basePath}/${id}/pause`, {});
    return response.data;
  }

  async resumeProjectBudget(id: string): Promise<ProjectBudget> {
    const response = await this.patch<ProjectBudget>(`${this.basePath}/${id}/resume`, {});
    return response.data;
  }

  async allocateMonthlyAmount(id: string, data: { amount: number; description?: string }): Promise<ProjectBudget> {
    const response = await this.post<ProjectBudget>(`${this.basePath}/${id}/monthly-allocation`, data);
    return response.data;
  }
}

export const projectBudgetService = new ProjectBudgetService();
