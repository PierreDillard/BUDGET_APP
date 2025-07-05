import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Euro, Loader2 } from "lucide-react";
import { useBudgetStore } from "@/store/budgetStore";
import { FREQUENCY_OPTIONS, QUARTERLY_MONTH_OPTIONS, YEARLY_MONTH_OPTIONS, getFrequencyDisplayText } from "@/lib/frequency.utils";
import type { RecExpense, CreateExpenseRequest, FrequencyType, FrequencyData } from "@/types";

interface ExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: RecExpense;
  mode: 'add' | 'edit';
}

const defaultCategories = [
  { value: 'rent', label: 'Loyer' },
  { value: 'utilities', label: 'Charges' },
  { value: 'insurance', label: 'Assurance' },
  { value: 'food', label: 'Alimentation' },
  { value: 'transport', label: 'Transport' },
  { value: 'health', label: 'Santé' },
  { value: 'subscription', label: 'Abonnement' },
  { value: 'other', label: 'Autre' },
];

export function ExpenseModal({ open, onOpenChange, expense, mode }: ExpenseModalProps) {
  const { addExpense, updateExpense, isLoading, user } = useBudgetStore();
  
  const [formData, setFormData] = useState<CreateExpenseRequest>({
    label: '',
    amount: 0,
    dayOfMonth: 1,
    category: 'other',
    frequency: 'MONTHLY',
    frequencyData: undefined,
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
          dayOfMonth: expense.dayOfMonth,
          category: expense.category || 'other',
          frequency: expense.frequency || 'MONTHLY',
          frequencyData: expense.frequencyData,
        });
      } else {
        setFormData({
          label: '',
          amount: 0,
          dayOfMonth: 1,
          category: 'other',
          frequency: 'MONTHLY',
          frequencyData: undefined,
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
    } else if (formData.amount > 1000000) {
      newErrors.amount = 'Le montant ne peut pas dépasser 1 000 000';
    }

    if (formData.dayOfMonth < 1 || formData.dayOfMonth > 28) {
      newErrors.dayOfMonth = 'Le jour doit être entre 1 et 28';
    }

    // Validation spécifique selon la fréquence
    if (formData.frequency === 'ONE_TIME' && !formData.frequencyData?.date) {
      newErrors.frequencyData = 'La date est requise pour une dépense ponctuelle';
    }

    if (formData.frequency === 'QUARTERLY' && (!formData.frequencyData?.months || formData.frequencyData.months.length === 0)) {
      newErrors.frequencyData = 'Les mois sont requis pour une dépense trimestrielle';
    }

    if (formData.frequency === 'YEARLY' && (!formData.frequencyData?.months || formData.frequencyData.months.length === 0)) {
      newErrors.frequencyData = 'Le mois est requis pour une dépense annuelle';
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
        await updateExpense(expense.id, formData);
      } else {
        await addExpense(formData);
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof CreateExpenseRequest, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFrequencyChange = (frequency: FrequencyType) => {
    setFormData(prev => ({
      ...prev,
      frequency,
      frequencyData: frequency === 'MONTHLY' ? undefined : prev.frequencyData
    }));
    
    if (errors.frequency || errors.frequencyData) {
      setErrors(prev => ({ ...prev, frequency: '', frequencyData: '' }));
    }
  };

  const handleFrequencyDataChange = (data: Partial<FrequencyData>) => {
    setFormData(prev => ({
      ...prev,
      frequencyData: { ...prev.frequencyData, ...data }
    }));
    
    if (errors.frequencyData) {
      setErrors(prev => ({ ...prev, frequencyData: '' }));
    }
  };

  const currencySymbol = user?.currency === 'USD' ? '$' : user?.currency === 'GBP' ? '£' : '€';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md backdrop-blur-lg bg-white/95 border border-white/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Euro className="h-5 w-5 text-red-600" />
            {mode === 'edit' ? 'Modifier la dépense' : 'Ajouter une dépense'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom de la dépense */}
          <div className="space-y-2">
            <Label htmlFor="label">Nom de la dépense</Label>
            <Input
              id="label"
              type="text"
              placeholder="Ex: Loyer, Électricité, ..."
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
                max="1000000"
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

          {/* Fréquence */}
          <div className="space-y-2">
            <Label htmlFor="frequency">Fréquence</Label>
            <Select 
              value={formData.frequency} 
              onValueChange={handleFrequencyChange}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une fréquence" />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.frequency && (
              <p className="text-sm text-red-600">{errors.frequency}</p>
            )}
          </div>

          {/* Jour du mois ou date spécifique */}
          {formData.frequency === 'ONE_TIME' ? (
            <div className="space-y-2">
              <Label htmlFor="oneTimeDate">Date de la dépense ponctuelle</Label>
              <Input
                id="oneTimeDate"
                type="date"
                value={formData.frequencyData?.date || ''}
                onChange={(e) => handleFrequencyDataChange({ date: e.target.value })}
                className={errors.frequencyData ? 'border-red-500' : ''}
                disabled={isSubmitting}
              />
              {errors.frequencyData && (
                <p className="text-sm text-red-600">{errors.frequencyData}</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="dayOfMonth">Jour d'échéance</Label>
              <Select 
                value={formData.dayOfMonth.toString()} 
                onValueChange={(value) => handleChange('dayOfMonth', parseInt(value))}
                disabled={isSubmitting}
              >
                <SelectTrigger className={errors.dayOfMonth ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Sélectionner un jour" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      Le {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.dayOfMonth && (
                <p className="text-sm text-red-600">{errors.dayOfMonth}</p>
              )}
            </div>
          )}

          {/* Détails de fréquence trimestrielle */}
          {formData.frequency === 'QUARTERLY' && (
            <div className="space-y-2">
              <Label htmlFor="quarterlyMonths">Mois trimestriels</Label>
              <Select 
                value={JSON.stringify(formData.frequencyData?.months || [1, 4, 7, 10])} 
                onValueChange={(value) => handleFrequencyDataChange({ months: JSON.parse(value) })}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner les mois" />
                </SelectTrigger>
                <SelectContent>
                  {QUARTERLY_MONTH_OPTIONS.map((option, index) => (
                    <SelectItem key={index} value={JSON.stringify(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.frequencyData && (
                <p className="text-sm text-red-600">{errors.frequencyData}</p>
              )}
            </div>
          )}

          {/* Détails de fréquence annuelle */}
          {formData.frequency === 'YEARLY' && (
            <div className="space-y-2">
              <Label htmlFor="yearlyMonth">Mois annuel</Label>
              <Select 
                value={formData.frequencyData?.months?.[0]?.toString() || '1'} 
                onValueChange={(value) => handleFrequencyDataChange({ months: [parseInt(value)] })}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le mois" />
                </SelectTrigger>
                <SelectContent>
                  {YEARLY_MONTH_OPTIONS.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.frequencyData && (
                <p className="text-sm text-red-600">{errors.frequencyData}</p>
              )}
            </div>
          )}

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
          {formData.label && formData.amount > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Aperçu :</strong> {formData.label} - {formData.amount.toFixed(2)} {currencySymbol}
                <br />
                <strong>Fréquence :</strong> {getFrequencyDisplayText(formData.frequency, formData.frequencyData)}
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
              className="flex-1 bg-red-600 hover:bg-red-700"
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {mode === 'edit' ? 'Modification...' : 'Ajout...'}
                </>
              ) : (
                mode === 'edit' ? 'Modifier' : 'Ajouter'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
