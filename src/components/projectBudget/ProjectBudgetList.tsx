import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Plus, Calendar, Pause, Play, CheckCircle2, DollarSign } from 'lucide-react';
import { useBudgetStore } from '../../store/budgetStore';
import { ProjectBudget, ProjectBudgetStatus, ProjectBudgetCategory } from '../../types/projectBudget';
import { formatCurrency, formatDate } from '../../lib/utils';
import { MonthlyAllocationModal } from './MonthlyAllocationModal';
import { shouldHideProjectBudget } from '../../lib/projectBudget.utils';

interface ProjectBudgetListProps {
  onCreateNew?: () => void;
  onEdit?: (budget: ProjectBudget) => void;
  onView?: (budget: ProjectBudget) => void;
}

export const ProjectBudgetList: React.FC<ProjectBudgetListProps> = ({
  onCreateNew,
  onEdit,
  onView
}) => {
  const {
    projectBudgets,
    projectBudgetStats,
    isLoadingProjectBudgets,
    projectBudgetError,
    loadProjectBudgets,
    loadProjectBudgetStats,
    pauseProjectBudget,
    resumeProjectBudget,
    completeProjectBudget
  } = useBudgetStore();

  const [filter, setFilter] = useState<ProjectBudgetStatus | 'ALL'>('ALL');

  useEffect(() => {
    loadProjectBudgets();
    loadProjectBudgetStats();
  }, [loadProjectBudgets, loadProjectBudgetStats]);

  const getStatusBadge = (status: ProjectBudgetStatus) => {
    const variants = {
      [ProjectBudgetStatus.ACTIVE]: 'default',
      [ProjectBudgetStatus.COMPLETED]: 'secondary',
      [ProjectBudgetStatus.PAUSED]: 'outline',
      [ProjectBudgetStatus.CANCELLED]: 'destructive'
    } as const;

    const labels = {
      [ProjectBudgetStatus.ACTIVE]: 'Actif',
      [ProjectBudgetStatus.COMPLETED]: 'Terminé',
      [ProjectBudgetStatus.PAUSED]: 'En pause',
      [ProjectBudgetStatus.CANCELLED]: 'Annulé'
    };

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const getCategoryLabel = (category: ProjectBudgetCategory) => {
    const labels = {
      [ProjectBudgetCategory.ELECTRONICS]: 'Électronique',
      [ProjectBudgetCategory.TRAVEL]: 'Voyage',
      [ProjectBudgetCategory.HOME_IMPROVEMENT]: 'Amélioration maison',
      [ProjectBudgetCategory.VEHICLE]: 'Véhicule',
      [ProjectBudgetCategory.EDUCATION]: 'Éducation',
      [ProjectBudgetCategory.EMERGENCY_FUND]: 'Fonds d\'urgence',
      [ProjectBudgetCategory.INVESTMENT]: 'Investissement',
      [ProjectBudgetCategory.OTHER]: 'Autre'
    };
    return labels[category];
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const handleStatusAction = async (budget: ProjectBudget, action: 'pause' | 'resume' | 'complete') => {
    try {
      switch (action) {
        case 'pause':
          await pauseProjectBudget(budget.id);
          break;
        case 'resume':
          await resumeProjectBudget(budget.id);
          break;
        case 'complete':
          await completeProjectBudget(budget.id);
          break;
      }
    } catch (error) {
      console.error(`Erreur lors de l'action ${action}:`, error);
    }
  };

  const filteredBudgets = filter === 'ALL' 
    ? projectBudgets.filter(budget => !shouldHideProjectBudget(budget)) // Masquer les budgets expirés
    : projectBudgets.filter(budget => budget.status === filter && !shouldHideProjectBudget(budget));

  if (isLoadingProjectBudgets) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (projectBudgetError) {
    return (
      <div className="text-center text-red-600 p-4">
        Erreur lors du chargement des budgets projet: {projectBudgetError}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      {projectBudgetStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium bg-white/40 hover:bg-white/60 transition-colors duration-200 ">Total Projets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-white/40 hover:bg-white/60 transition-colors duration-200 ">{projectBudgetStats.totalBudgets}</div>
            </CardContent> 
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium bg-white/40 hover:bg-white/60 transition-colors duration-200 ">Montant Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-white/40 hover:bg-white/60 transition-colors duration-200 ">{formatCurrency(projectBudgetStats.totalTargetAmount)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium bg-white/40 hover:bg-white/60 transition-colors duration-200 ">Économisé</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(projectBudgetStats.totalCurrentAmount)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium bg-white/40 hover:bg-white/60 transition-colors duration-200 ">Terminés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projectBudgetStats.completedBudgets}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtres et actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-2 flex-wrap text-black">
          <Button
            variant={filter === 'ALL' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('ALL')}
          >
            Tous
          </Button>
          <Button
            variant={filter === ProjectBudgetStatus.ACTIVE ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(ProjectBudgetStatus.ACTIVE)}
          >
            Actifs
          </Button>
          <Button
            variant={filter === ProjectBudgetStatus.COMPLETED ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(ProjectBudgetStatus.COMPLETED)}
          >
            Terminés
          </Button>
          <Button
            variant={filter === ProjectBudgetStatus.PAUSED ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(ProjectBudgetStatus.PAUSED)}
          >
            En pause
          </Button>
        </div>
        <Button onClick={onCreateNew} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nouveau Projet
        </Button>
      </div>

      {/* Liste des budgets */}
      {filteredBudgets.length === 0 ? (
        <Card className="text-center p-8">
          <CardContent>
            <div className="text-gray-500 mb-4">
              {filter === 'ALL' ? 'Aucun budget projet trouvé' : `Aucun budget ${filter.toLowerCase()} trouvé`}
            </div>
            <Button onClick={onCreateNew} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Créer votre premier budget projet
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBudgets.map((budget) => {
            const progressPercentage = getProgressPercentage(budget.current_amount, budget.target_amount);
            const isCompleted = budget.status === ProjectBudgetStatus.COMPLETED;
            const isPaused = budget.status === ProjectBudgetStatus.PAUSED;

            return (
              <Card key={budget.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{budget.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {getCategoryLabel(budget.category)}
                      </CardDescription>
                    </div>
                    {getStatusBadge(budget.status)}
                  </div>
                  {budget.description && (
                    <CardDescription className="text-sm text-gray-600">
                      {budget.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progression</span>
                      <span className="font-medium">{progressPercentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{formatCurrency(budget.current_amount)}</span>
                      <span>{formatCurrency(budget.target_amount)}</span>
                    </div>
                  </div>

                  {/* Date cible */}
                  {budget.target_date && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Objectif: {formatDate(new Date(budget.target_date))}</span>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="flex justify-between">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onView?.(budget)}
                    >
                      Voir projet
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit?.(budget)}
                    >
                      Modifier
                    </Button>
                  </div>
                  <div className="flex gap-1">
                    {!isCompleted && (
                      <>
                        <MonthlyAllocationModal
                          projectBudget={budget}
                          trigger={
                            <Button variant="ghost" size="sm" title="Allocation mensuelle">
                              <DollarSign className="h-4 w-4" />
                            </Button>
                          }
                        />
                        {isPaused ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusAction(budget, 'resume')}
                            title="Reprendre"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusAction(budget, 'pause')}
                            title="Mettre en pause"
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                        )}
                        {progressPercentage >= 100 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusAction(budget, 'complete')}
                            title="Marquer comme terminé"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
