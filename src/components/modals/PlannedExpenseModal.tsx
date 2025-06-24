import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Loader2, Target } from "lucide-react";
import { useBudgetStore } from "@/store/budgetStore";
import type { PlannedExpense, CreatePlannedExpenseRequest } from "@/types";

interface PlannedExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: PlannedExpense;
  mode: 'add' | 'edit';
}

const defaultCategories = [
  { value: 'travel', label: 'Voyage' },
  { value: 'equipment', label: 'Équipement' },
  { value: 'clothing', label: 'Vêtements' },
  { value: 'electronics', label: 'Électronique' },
  { value: 'home', label: 'Maison' },
  { value: 'health', label: 'Santé' },
  { value: 'education', label: 'Formation' },
  { value: 'gift', label: 'Cadeau' },
  { value: 'other', label: 'Autre' },
];

export function PlannedExpenseModal({ open, onOpenChange, expense, mode }: PlannedExpenseModalProps) {
  const { addPlannedExpense, updatePlannedExpense, isLoading, user } = useBudgetStore();
  
  const [formData, setFormData] = useState<CreatePlannedExpenseRequest>({
    label: '',
    amount: 0,
    date: '',
    category: 'other',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens/closes or expense changes
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && expense) {
        setFormData({
          label: expense.label,
          amount: expense.amount,
          date: new Date(expense.date).toISOString().split('T')[0], // Format YYYY-MM-DD
          category: expense.category || 'other',
        });
      } else {
        // Default to tomorrow for new planned expenses
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        setFormData({
          label: '',
          amount: 0,
          date: tomorrow.toISOString().split('T')[0],
          category: 'other',
        });
      }
      setErrors({});
    }
  }, [open, mode, expense]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.label.trim()) {
      newErrors.label = 'Le nom de la dépense est requis';
    } else if (formData.label.trim().length < 2) {
      newErrors.label = 'Le nom doit contenir au moins 2 caractères';
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Le montant doit être supérieur à 0';
    } else if (formData.amount > 100000) {
      newErrors.amount = 'Le montant ne peut pas dépasser 100 000';
    }

    if (!formData.date) {
      newErrors.date = 'La date est requise';
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Allow past dates for editing, but warn for new expenses
      if (mode === 'add' && selectedDate < today) {
        newErrors.date = 'La date ne peut pas être dans le passé';
      }
      
      // Check if date is too far in the future (2 years)
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 2);
      if (selectedDate > maxDate) {
        newErrors.date = 'La date ne peut pas être plus de 2 ans dans le futur';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (mode === 'edit' && expense) {
        await updatePlannedExpense(expense.id, formData);
      } else {
        await addPlannedExpense(formData);
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof CreatePlannedExpenseRequest, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getDaysFromNow = (dateString: string) => {
    if (!dateString) return 0;
    const targetDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const currencySymbol = user?.currency === 'USD' ? '$' : user?.currency === 'GBP' ? '£' : '€';
  const daysFromNow = getDaysFromNow(formData.date);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md backdrop-blur-lg bg-white/95 border border-white/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            {mode === 'edit' ? 'Modifier le budget' : 'Planifier une dépense'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom de la dépense */}
          <div className="space-y-2">
            <Label htmlFor="label">Nom de la dépense</Label>
            <Input
              id="label"
              type="text"
              placeholder="Ex: Voyage à Paris, Nouveau laptop..."
              value={formData.label}
              onChange={(e) => handleChange('label', e.target.value)}
              className={errors.label ? 'border-red-500' : ''}
              disabled={isSubmitting}
            />
            {errors.label && (
              <p className="text-sm text-red-600">{errors.label}</p>
            )}
          </div>

          {/* Montant */}
          <div className="space-y-2">
            <Label htmlFor="amount">Montant ({currencySymbol})</Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                max="100000"
                placeholder="0.00"
                value={formData.amount || ''}
                onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
                className={errors.amount ? 'border-red-500' : ''}
                disabled={isSubmitting}
              />
              <span className="absolute right-3 top-2.5 text-gray-500 text-sm">
                {currencySymbol}
              </span>
            </div>
            {errors.amount && (
              <p className="text-sm text-red-600">{errors.amount}</p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date prévue</Label>
            <div className="relative">
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className={errors.date ? 'border-red-500' : ''}
                disabled={isSubmitting}
                min={new Date().toISOString().split('T')[0]} // Today minimum for new expenses
              />
              <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
            {errors.date && (
              <p className="text-sm text-red-600">{errors.date}</p>
            )}
            {formData.date && !errors.date && (
              <p className="text-xs text-gray-500">
                {formatDate(formData.date)}
                {daysFromNow >= 0 && (
                  <span className="ml-2">
                    ({daysFromNow === 0 ? "Aujourd'hui" : 
                      daysFromNow === 1 ? "Demain" : 
                      `Dans ${daysFromNow} jours`})
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Catégorie */}
          <div className="space-y-2">
            <Label htmlFor="category">Catégorie</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => handleChange('category', value)}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {defaultCategories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Aperçu */}
          {formData.label && formData.amount > 0 && formData.date && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Aperçu :</strong> {formData.label} - {formData.amount.toFixed(2)} {currencySymbol}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Prévu pour le {formatDate(formData.date)}
                {daysFromNow >= 0 && daysFromNow <= 30 && (
                  <span className="ml-2 font-medium">
                    ({daysFromNow === 0 ? "Aujourd'hui !" : 
                      daysFromNow === 1 ? "Demain !" : 
                      `Dans ${daysFromNow} jour${daysFromNow > 1 ? 's' : ''}`})
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Warning for past dates in edit mode */}
          {mode === 'edit' && formData.date && getDaysFromNow(formData.date) < 0 && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800">
                <strong>Note :</strong> Cette dépense était prévue dans le passé.
              </p>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {mode === 'edit' ? 'Modification...' : 'Planification...'}
                </>
              ) : (
                mode === 'edit' ? 'Modifier' : 'Planifier'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
