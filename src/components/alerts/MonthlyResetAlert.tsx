import React from 'react';
import { X } from 'lucide-react';
import { useBudgetStore } from '../../store/budgetStore';

export const MonthlyResetAlert: React.FC = () => {
  const { dismissMonthlyResetAlert, triggerMonthlyReset, isLoading } = useBudgetStore();
  
  // Vérifier si l'alerte a déjà été fermée ce mois
  const currentMonth = new Date().toISOString().slice(0, 7);
  const isDismissed = localStorage.getItem(`monthly_alert_dismissed_${currentMonth}`) === 'true';
  
  if (isDismissed) {
    return null;
  }

  const handleReset = async () => {
    try {
      await triggerMonthlyReset();
      dismissMonthlyResetAlert();
    } catch (error) {
      console.error('Erreur lors de la réinitialisation:', error);
    }
  };

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 relative">
      <button
        onClick={dismissMonthlyResetAlert}
        className="absolute top-2 right-2 text-red-400 hover:text-red-600 transition-colors"
        aria-label="Fermer l'alerte"
      >
        <X size={18} />
      </button>
      
      <div className="flex items-start gap-3 pr-8">
        <div className="flex-shrink-0">
          <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-red-600 text-xs">!</span>
          </div>
        </div>
        
        <div className="flex-1">
          <h4 className="text-red-800 font-medium">
            Réinitialisation mensuelle recommandée
          </h4>
          <p className="text-red-700 text-sm mt-1">
            Votre budget mensuel devrait être réinitialisé depuis 0 jour.
          </p>
          
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleReset}
              disabled={isLoading}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Réinitialisation...' : 'Réinitialiser'}
            </button>
            <button
              onClick={dismissMonthlyResetAlert}
              className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
            >
              Plus tard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
