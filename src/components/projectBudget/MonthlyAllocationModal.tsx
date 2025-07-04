import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import { useBudgetStore } from '../../store/budgetStore';
import { ProjectBudget } from '../../types/projectBudget';

interface MonthlyAllocationModalProps {
  projectBudget: ProjectBudget;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export const MonthlyAllocationModal: React.FC<MonthlyAllocationModalProps> = ({
  projectBudget,
  trigger,
  onSuccess
}) => {
  const { balance, user, allocateMonthlyAmount } = useBudgetStore();
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const currencySymbol = user?.currency === 'USD' ? '$' : user?.currency === 'GBP' ? '£' : '€';
  const currentBalance = balance?.currentBalance || 0;
  const allocationAmount = parseFloat(amount) || 0;
  const newBalance = currentBalance - allocationAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!amount || allocationAmount <= 0) {
      setError('Veuillez saisir un montant valide');
      return;
    }

    if (newBalance < 0) {
      setError(`Cette allocation rendrait votre solde négatif de ${Math.abs(newBalance).toFixed(2)} ${currencySymbol}`);
      return;
    }

    setIsLoading(true);

    try {
      await allocateMonthlyAmount(projectBudget.id, {
        amount: allocationAmount,
        description: description.trim() || undefined
      });

      // Reset form
      setAmount('');
      setDescription('');
      setIsOpen(false);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'allocation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setError('');
      setAmount('');
      setDescription('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Allouer pour ce mois
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Allocation mensuelle
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Informations du projet */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="font-medium text-sm">{projectBudget.name}</p>
            <p className="text-xs text-gray-600">
              {projectBudget.current_amount.toFixed(2)} {currencySymbol} / {projectBudget.target_amount.toFixed(2)} {currencySymbol}
            </p>
          </div>

          {/* Solde actuel */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Solde actuel :</span>
              <span className={`font-medium ${currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {currentBalance.toFixed(2)} {currencySymbol}
              </span>
            </div>
          </div>

          {/* Montant à allouer */}
          <div className="space-y-2">
            <Label htmlFor="amount">Montant à allouer *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              max={currentBalance}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optionnel)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Allocation de juin pour mon projet..."
              rows={2}
            />
          </div>

          {/* Aperçu du nouveau solde */}
          {amount && allocationAmount > 0 && (
            <div className={`p-3 rounded-lg ${newBalance >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Nouveau solde :</span>
                <span className={`font-medium ${newBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {newBalance.toFixed(2)} {currencySymbol}
                </span>
              </div>
            </div>
          )}

          {/* Messages d'erreur */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Message de confirmation */}
          {amount && allocationAmount > 0 && newBalance >= 0 && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                {allocationAmount.toFixed(2)} {currencySymbol} seront déduits de votre solde et ajoutés à ce projet.
              </AlertDescription>
            </Alert>
          )}

          {/* Boutons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !amount || allocationAmount <= 0 || newBalance < 0}
            >
              {isLoading ? 'Allocation...' : 'Allouer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
