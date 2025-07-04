import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CalendarIcon, Save, X } from 'lucide-react';
import { useBudgetStore } from '../../store/budgetStore';
import { ProjectBudget, ProjectBudgetCategory, CreateProjectBudgetRequest, UpdateProjectBudgetRequest } from '../../types/projectBudget';
import { formatDate } from '../../lib/utils';
import { cn } from '../../lib/utils';

interface ProjectBudgetFormProps {
  budget?: ProjectBudget;
  onSave?: (budget: ProjectBudget) => void;
  onCancel?: () => void;
  className?: string;
}

export const ProjectBudgetForm: React.FC<ProjectBudgetFormProps> = ({
  budget,
  onSave,
  onCancel,
  className
}) => {
  const {
    createProjectBudget,
    updateProjectBudget,
    isLoadingProjectBudgets,
    projectBudgetError
  } = useBudgetStore();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    target_amount: '',
    category: ProjectBudgetCategory.OTHER,
    target_date: undefined as Date | undefined
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (budget) {
      setFormData({
        name: budget.name,
        description: budget.description || '',
        target_amount: budget.target_amount.toString(),
        category: budget.category,
        target_date: budget.target_date ? new Date(budget.target_date) : undefined
      });
    }
  }, [budget]);

  const categoryOptions = [
    { value: ProjectBudgetCategory.ELECTRONICS, label: 'Électronique' },
    { value: ProjectBudgetCategory.TRAVEL, label: 'Voyage' },
    { value: ProjectBudgetCategory.HOME_IMPROVEMENT, label: 'Amélioration maison' },
    { value: ProjectBudgetCategory.VEHICLE, label: 'Véhicule' },
    { value: ProjectBudgetCategory.EDUCATION, label: 'Éducation' },
    { value: ProjectBudgetCategory.EMERGENCY_FUND, label: 'Fonds d\'urgence' },
    { value: ProjectBudgetCategory.INVESTMENT, label: 'Investissement' },
    { value: ProjectBudgetCategory.OTHER, label: 'Autre' }
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    }

    if (!formData.target_amount) {
      newErrors.target_amount = 'Le montant objectif est requis';
    } else {
      const amount = parseFloat(formData.target_amount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.target_amount = 'Le montant doit être un nombre positif';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const target_amount = parseFloat(formData.target_amount);

      if (budget) {
        // Mode édition
        const updateData: UpdateProjectBudgetRequest = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          target_amount,
          category: formData.category,
          target_date: formData.target_date
        };
        
        const updatedBudget = await updateProjectBudget(budget.id, updateData);
        onSave?.(updatedBudget);
      } else {
        // Mode création
        const createData: CreateProjectBudgetRequest = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          target_amount,
          category: formData.category,
          target_date: formData.target_date
        };
        
        const newBudget = await createProjectBudget(createData);
        onSave?.(newBudget);
      }

      // Reset form if creating
      if (!budget) {
        setFormData({
          name: '',
          description: '',
          target_amount: '',
          category: ProjectBudgetCategory.OTHER,
          target_date: undefined
        });
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | Date | ProjectBudgetCategory | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  return (
    <Card className={cn("w-full max-w-2xl mx-auto", className)}>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>
            {budget ? 'Modifier le budget projet' : 'Créer un nouveau budget projet'}
          </CardTitle>
          <CardDescription>
            {budget 
              ? 'Modifiez les détails de votre budget projet'
              : 'Créez un budget pour économiser en vue d\'un achat ou projet spécifique'
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {projectBudgetError && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
              {projectBudgetError}
            </div>
          )}

          {/* Nom */}
          <div className="space-y-2">
            <Label htmlFor="name">Nom du projet *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Ex: Nouveau laptop, Vacances en Italie..."
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Décrivez votre projet..."
              rows={3}
            />
          </div>

          {/* Montant objectif */}
          <div className="space-y-2">
            <Label htmlFor="targetAmount">Montant objectif *</Label>
            <Input
              id="targetAmount"
              type="number"
              step="0.01"
              min="0.01"
              value={formData.target_amount}
              onChange={(e) => handleInputChange('target_amount', e.target.value)}
              placeholder="0.00"
              className={errors.target_amount ? 'border-red-500' : ''}
            />
            {errors.target_amount && (
              <p className="text-red-500 text-sm">{errors.target_amount}</p>
            )}
          </div>

          {/* Catégorie */}
          <div className="space-y-2">
            <Label htmlFor="category">Catégorie</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleInputChange('category', value as ProjectBudgetCategory)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date objectif */}
          <div className="space-y-2">
            <Label>Date objectif (optionnel)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.target_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.target_date ? (
                    formatDate(formData.target_date)
                  ) : (
                    <span>Choisir une date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.target_date}
                  onSelect={(date: Date | undefined) => handleInputChange('target_date', date)}
                  disabled={(date: Date) => date < new Date()}
                  initialFocus
                />
                {formData.target_date && (
                  <div className="p-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleInputChange('target_date', undefined)}
                      className="w-full"
                    >
                      Supprimer la date
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4 mr-2" />
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isLoadingProjectBudgets}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting 
              ? 'Sauvegarde...' 
              : budget 
                ? 'Mettre à jour' 
                : 'Créer le projet'
            }
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
