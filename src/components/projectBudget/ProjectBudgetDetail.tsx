import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { 
  Calendar, 
  Target, 
  TrendingUp, 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  CheckCircle2,
  ArrowLeft,
  DollarSign
} from 'lucide-react';
import { useBudgetStore } from '../../store/budgetStore';
import { ProjectBudget, ProjectBudgetStatus, ProjectBudgetCategory, AddContributionRequest } from '../../types/projectBudget';
import { formatCurrency, formatDate } from '../../lib/utils';
import { MonthlyAllocationModal } from './MonthlyAllocationModal';

interface ProjectBudgetDetailProps {
  budgetId: string;
  onEdit?: (budget: ProjectBudget) => void;
  onBack?: () => void;
  className?: string;
}

export const ProjectBudgetDetail: React.FC<ProjectBudgetDetailProps> = ({
  budgetId,
  onEdit,
  onBack,
  className
}) => {
  const {
    projectBudgets,
    isLoadingProjectBudgets,
    projectBudgetError,
    loadProjectBudgets,
    addContribution,
    pauseProjectBudget,
    resumeProjectBudget,
    completeProjectBudget,
    deleteProjectBudget
  } = useBudgetStore();

  const [showContributionForm, setShowContributionForm] = useState(false);
  const [contributionAmount, setContributionAmount] = useState('');
  const [contributionDescription, setContributionDescription] = useState('');
  const [isSubmittingContribution, setIsSubmittingContribution] = useState(false);

  const budget = projectBudgets.find(b => b.id === budgetId);

  useEffect(() => {
    if (!budget) {
      loadProjectBudgets();
    }
  }, [budget, loadProjectBudgets]);

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

  const handleStatusAction = async (action: 'pause' | 'resume' | 'complete') => {
    if (!budget) return;
    
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

  const handleAddContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!budget || !contributionAmount) return;

    const amount = parseFloat(contributionAmount);
    if (isNaN(amount) || amount <= 0) {
      return;
    }

    setIsSubmittingContribution(true);

    try {
      const contributionData: AddContributionRequest = {
        amount,
        description: contributionDescription.trim() || undefined
      };

      await addContribution(budget.id, contributionData);
      
      // Reset form
      setContributionAmount('');
      setContributionDescription('');
      setShowContributionForm(false);
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la contribution:', error);
    } finally {
      setIsSubmittingContribution(false);
    }
  };

  const handleDelete = async () => {
    if (!budget) return;
    
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce budget projet ? Cette action est irréversible.')) {
      try {
        await deleteProjectBudget(budget.id);
        onBack?.();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  if (isLoadingProjectBudgets && !budget) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (projectBudgetError) {
    return (
      <div className="text-center text-red-600 p-4">
        Erreur lors du chargement: {projectBudgetError}
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="text-center p-4">
        <p className="text-gray-600 mb-4">Budget projet non trouvé</p>
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la liste
        </Button>
      </div>
    );
  }

  const progressPercentage = getProgressPercentage(budget.current_amount, budget.target_amount);
  const remainingAmount = budget.target_amount - budget.current_amount;
  const isCompleted = budget.status === ProjectBudgetStatus.COMPLETED;
  const isPaused = budget.status === ProjectBudgetStatus.PAUSED;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Retour à la liste
        </Button>
        <div className="flex gap-2">
          {!isCompleted && (
            <>
              {isPaused ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusAction('resume')}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Reprendre
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusAction('pause')}
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Mettre en pause
                </Button>
              )}
              {progressPercentage >= 100 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusAction('complete')}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Marquer comme terminé
                </Button>
              )}
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit?.(budget)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </div>

      {/* Informations principales */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{budget.name}</CardTitle>
              <CardDescription className="text-lg mt-1">
                {getCategoryLabel(budget.category)}
              </CardDescription>
            </div>
            {getStatusBadge(budget.status)}
          </div>
          {budget.description && (
            <CardDescription className="mt-4 text-gray-700">
              {budget.description}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progression */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Progression</h3>
              <span className="text-2xl font-bold text-green-600">
                {progressPercentage.toFixed(1)}%
              </span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600">Économisé</p>
                <p className="text-xl font-semibold text-green-600">
                  {formatCurrency(budget.current_amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Objectif</p>
                <p className="text-xl font-semibold">
                  {formatCurrency(budget.target_amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Restant</p>
                <p className="text-xl font-semibold text-orange-600">
                  {formatCurrency(remainingAmount)}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Détails */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-600">Date de création:</span>
                  <span className="font-medium">{formatDate(new Date(budget.created_at))}</span>
                </div>
                {budget.target_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-600">Date objectif:</span>
                    <span className="font-medium">{formatDate(new Date(budget.target_date))}</span>
                  </div>
                )}
            </div>
            <div className="space-y-3">                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-600">Dernière mise à jour:</span>
                  <span className="font-medium">{formatDate(new Date(budget.updated_at))}</span>
                </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ajouter une contribution */}
      {!isCompleted && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Ajouter une contribution</CardTitle>
              <div className="flex gap-2">
                <MonthlyAllocationModal
                  projectBudget={budget}
                  trigger={
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Allocation mensuelle
                    </Button>
                  }
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowContributionForm(!showContributionForm)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {showContributionForm ? 'Annuler' : 'Nouvelle contribution'}
                </Button>
              </div>
            </div>
          </CardHeader>

          {showContributionForm && (
            <CardContent>
              <form onSubmit={handleAddContribution} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contributionAmount">Montant *</Label>
                    <Input
                      id="contributionAmount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={contributionAmount}
                      onChange={(e) => setContributionAmount(e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contributionDescription">Description (optionnel)</Label>
                    <Input
                      id="contributionDescription"
                      value={contributionDescription}
                      onChange={(e) => setContributionDescription(e.target.value)}
                      placeholder="Ex: Contribution mensuelle"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowContributionForm(false)}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmittingContribution || !contributionAmount}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    {isSubmittingContribution ? 'Ajout...' : 'Ajouter la contribution'}
                  </Button>
                </div>
              </form>
            </CardContent>
          )}
        </Card>
      )}

      {/* Historique des contributions */}
      {budget.contributions && budget.contributions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historique des contributions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {budget.contributions
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((contribution) => (
                  <div key={contribution.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{formatCurrency(contribution.amount)}</p>
                      {contribution.description && (
                        <p className="text-sm text-gray-600">{contribution.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {formatDate(new Date(contribution.created_at))}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
