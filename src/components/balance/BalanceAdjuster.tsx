import React, { useState } from 'react';
import { useBudgetStore } from '../../store/budgetStore';

interface BalanceAdjusterProps {
  currentBalance: number;
  onClose?: () => void;
}

export const BalanceAdjuster: React.FC<BalanceAdjusterProps> = ({ 
  currentBalance, 
  onClose 
}) => {
  const [newBalance, setNewBalance] = useState(currentBalance.toString());
  const [isOpen, setIsOpen] = useState(false);
  const { setDirectBalance, isLoading } = useBudgetStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(newBalance);
    
    if (isNaN(amount)) {
      alert('Veuillez entrer un montant valide');
      return;
    }

    try {
      await setDirectBalance(amount);
      setIsOpen(false);
      onClose?.();
    } catch (error) {
      console.error('Erreur lors de l\'ajustement:', error);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Ajuster
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Reinitialiser le solde</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nouveau solde (€)
            </label>
            <input
              type="number"
              step="0.01"
              value={newBalance}
              onChange={(e) => setNewBalance(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: 65.00"
              disabled={isLoading}
            />
            <p className="text-sm text-gray-500 mt-1">
              Solde actuel : {currentBalance.toFixed(2)}€
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Ajustement...' : 'Confirmer'}
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
