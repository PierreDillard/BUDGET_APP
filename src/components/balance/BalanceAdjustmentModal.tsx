import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PlusCircle, MinusCircle, TrendingUp, TrendingDown, Calculator, Info } from "lucide-react";
import { useBudgetStore } from "@/store/budgetStore";
import type { BalanceAdjustmentRequest } from "@/types";

interface BalanceAdjustmentModalProps {
  trigger?: React.ReactNode;
  onClose?: () => void;
}

export function BalanceAdjustmentModal({ trigger, onClose }: BalanceAdjustmentModalProps) {
  const { adjustBalance, balance, isLoading, user } = useBudgetStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<'increase' | 'decrease'>('increase');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [adjustmentReason, setAdjustmentReason] = useState<'manual_adjustment' | 'correction'>('manual_adjustment');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setAdjustmentType('increase');
    setAdjustmentReason('manual_adjustment');
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    const numericAmount = parseFloat(amount);
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      newErrors.amount = 'Veuillez saisir un montant valide supérieur à 0';
    }
    
    if (!description.trim()) {
      newErrors.description = 'Veuillez fournir une description pour cet ajustement';
    } else if (description.trim().length < 3) {
      newErrors.description = 'La description doit contenir au moins 3 caractères';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      const numericAmount = parseFloat(amount);
      const finalAmount = adjustmentType === 'decrease' ? -numericAmount : numericAmount;
      
      const adjustmentData: BalanceAdjustmentRequest = {
        amount: finalAmount,
        description: description.trim(),
        type: adjustmentReason
      };
      
      await adjustBalance(adjustmentData);
      
      setIsOpen(false);
      resetForm();
      onClose?.();
    } catch (error) {
      console.error('Erreur lors de l\'ajustement du solde:', error);
    }
  };

  const handleClose = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetForm();
      onClose?.();
    }
  };

  const previewNewBalance = () => {
    if (!balance || !amount || isNaN(parseFloat(amount))) return null;
    
    const numericAmount = parseFloat(amount);
    const finalAmount = adjustmentType === 'decrease' ? -numericAmount : numericAmount;
    return balance.currentBalance + finalAmount;
  };

  const currencySymbol = user?.currency === 'USD' ? '$' : user?.currency === 'GBP' ? '£' : '€';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Ajuster le solde
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md backdrop-blur-lg bg-white/95 border border-white/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Ajustement du solde
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Info sur le solde actuel */}
          <Card className="bg-blue-50/50 border-blue-200/50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Solde actuel :</span>
                <span className={`font-semibold ${
                  balance && balance.currentBalance >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {balance?.currentBalance.toFixed(2)} {currencySymbol}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Type d'ajustement */}
          <div className="space-y-3">
            <Label>Type d'ajustement</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={adjustmentType === 'increase' ? 'default' : 'outline'}
                onClick={() => setAdjustmentType('increase')}
                className="flex items-center gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                Augmenter
              </Button>
              <Button
                type="button"
                variant={adjustmentType === 'decrease' ? 'default' : 'outline'}
                onClick={() => setAdjustmentType('decrease')}
                className="flex items-center gap-2"
              >
                <MinusCircle className="h-4 w-4" />
                Diminuer
              </Button>
            </div>
          </div>

          {/* Montant */}
          <div className="space-y-2">
            <Label htmlFor="amount">
              Montant {adjustmentType === 'increase' ? 'à ajouter' : 'à retirer'}
            </Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={errors.amount ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              <span className="absolute right-3 top-2.5 text-gray-500 text-sm">
                {currencySymbol}
              </span>
            </div>
            {errors.amount && (
              <p className="text-sm text-red-600">{errors.amount}</p>
            )}
          </div>

          {/* Raison de l'ajustement */}
          <div className="space-y-2">
            <Label htmlFor="reason">Raison de l'ajustement</Label>
            <Select value={adjustmentReason} onValueChange={(value: 'manual_adjustment' | 'correction') => setAdjustmentReason(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual_adjustment">Ajustement manuel</SelectItem>
                <SelectItem value="correction">Correction d'erreur</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Décrivez la raison de cet ajustement..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={errors.description ? 'border-red-500' : ''}
              disabled={isLoading}
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* Aperçu du nouveau solde */}
          {amount && !isNaN(parseFloat(amount)) && (
            <Card className="bg-gray-50/50 border-gray-200/50">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Nouveau solde :</span>
                  <div className="flex items-center gap-2">
                    {adjustmentType === 'increase' ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span className={`font-semibold ${
                      previewNewBalance() && previewNewBalance()! >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {previewNewBalance()?.toFixed(2)} {currencySymbol}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Information importante */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Cet ajustement modifiera uniquement votre solde actuel et n'affectera pas vos revenus ou dépenses récurrents.
            </AlertDescription>
          </Alert>

          {/* Boutons d'action */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              className="flex-1"
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading || !amount || !description.trim()}
            >
              {isLoading ? 'Ajustement...' : 'Confirmer l\'ajustement'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Composant pour afficher l'historique des ajustements
export function BalanceAdjustmentHistory() {
  const { balance, user } = useBudgetStore();
  
  if (!balance?.adjustments || balance.adjustments.length === 0) {
    return (
      <Card className="backdrop-blur-lg bg-white/40 border border-white/30">
        <CardHeader>
          <CardTitle className="text-sm">Historique des ajustements</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 text-center py-4">
            Aucun ajustement de solde effectué
          </p>
        </CardContent>
      </Card>
    );
  }

  const currencySymbol = user?.currency === 'USD' ? '$' : user?.currency === 'GBP' ? '£' : '€';

  return (
    <Card className="backdrop-blur-lg bg-white/40 border border-white/30">
      <CardHeader>
        <CardTitle className="text-sm">Historique des ajustements</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {balance.adjustments.slice(-5).reverse().map((adjustment) => (
            <div key={adjustment.id} className="flex items-center justify-between py-2 border-b border-gray-200/50 last:border-0">
              <div className="flex-1">
                <p className="text-sm font-medium">{adjustment.description}</p>
                <p className="text-xs text-gray-500">
                  {new Date(adjustment.date).toLocaleDateString('fr-FR')} • {adjustment.type === 'manual_adjustment' ? 'Ajustement manuel' : 'Correction'}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {adjustment.amount > 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span className={`text-sm font-semibold ${
                  adjustment.amount > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {adjustment.amount > 0 ? '+' : ''}{adjustment.amount.toFixed(2)} {currencySymbol}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default BalanceAdjustmentModal;
