import  { useState } from 'react';
import { History, ChevronDown, ChevronUp, Calendar, TrendingUp, TrendingDown, CreditCard } from 'lucide-react';

interface PastTransaction {
  label: string;
  amount: number;
  date: string;
  type?: 'ONE_TIME' | 'RECURRING' | 'PLANNED';
  spent?: boolean;
}

interface PastTransactionsData {
  pastIncomes: PastTransaction[];
  pastExpenses: PastTransaction[];
  pastPlannedExpenses: PastTransaction[];
  totalPastIncomes: number;
  totalPastExpenses: number;
  totalPastPlanned: number;
}

interface PastTransactionsPanelProps {
  pastTransactions: PastTransactionsData;
  currencySymbol: string;
}

export function PastTransactionsPanel({ pastTransactions, currencySymbol }: PastTransactionsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!pastTransactions) {
    return null;
  }

  const totalTransactions = 
    pastTransactions.pastIncomes.length + 
    pastTransactions.pastExpenses.length + 
    pastTransactions.pastPlannedExpenses.length;

  if (totalTransactions === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center gap-2 text-gray-600">
          <History className="h-4 w-4" />
          <span className="text-sm">Aucune transaction passée trouvée</span>
        </div>
      </div>
    );
  }

  const netImpact = pastTransactions.totalPastIncomes - pastTransactions.totalPastExpenses - pastTransactions.totalPastPlanned;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* En-tête */}
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <History className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="font-medium text-gray-900">Transactions déjà affectées</h3>
              <p className="text-sm text-gray-600">
                {totalTransactions} transaction{totalTransactions > 1 ? 's' : ''} déjà prise{totalTransactions > 1 ? 's' : ''} en compte dans votre solde
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className={`text-sm font-semibold ${netImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {netImpact >= 0 ? '+' : ''}{netImpact.toFixed(2)} {currencySymbol}
              </div>
              <div className="text-xs text-gray-500">Impact net</div>
            </div>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Contenu étendu */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 space-y-4">
          {/* Résumé */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Revenus appliqués</span>
              </div>
              <div className="text-lg font-bold text-green-600">
                +{pastTransactions.totalPastIncomes.toFixed(2)} {currencySymbol}
              </div>
              <div className="text-xs text-green-600">
                {pastTransactions.pastIncomes.length} revenu{pastTransactions.pastIncomes.length > 1 ? 's' : ''} (récurrents + ponctuels)
              </div>
            </div>

            <div className="bg-red-50 rounded-lg p-3 border border-red-200">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">Dépenses appliquées</span>
              </div>
              <div className="text-lg font-bold text-red-600">
                -{pastTransactions.totalPastExpenses.toFixed(2)} {currencySymbol}
              </div>
              <div className="text-xs text-red-600">
                {pastTransactions.pastExpenses.length} dépense{pastTransactions.pastExpenses.length > 1 ? 's' : ''} (récurrentes + ponctuelles)
              </div>
            </div>

            <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">Budgets passés</span>
              </div>
              <div className="text-lg font-bold text-orange-600">
                -{pastTransactions.totalPastPlanned.toFixed(2)} {currencySymbol}
              </div>
              <div className="text-xs text-orange-600">
                {pastTransactions.pastPlannedExpenses.length} transaction{pastTransactions.pastPlannedExpenses.length > 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Liste détaillée */}
          <div className="space-y-3">
            {/* Revenus passés */}
            {pastTransactions.pastIncomes.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  Revenus pris en compte
                </h4>
                <div className="space-y-1">
                  {pastTransactions.pastIncomes.map((income, index) => (
                    <div key={`income-${index}`} className="flex items-center justify-between py-2 px-3 bg-green-50 rounded border border-green-100">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${income.type === 'RECURRING' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                        <span className="text-sm text-gray-800">{income.label}</span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {income.type === 'RECURRING' ? 'Récurrent' : new Date(income.date).toLocaleDateString('fr-FR')}
                        </span>
                        {income.type === 'RECURRING' && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            Récurrent
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-green-600">
                        +{income.amount.toFixed(2)} {currencySymbol}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dépenses passées */}
            {pastTransactions.pastExpenses.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <TrendingDown className="h-3 w-3 text-red-500" />
                  Dépenses prises en compte
                </h4>
                <div className="space-y-1">
                  {pastTransactions.pastExpenses.map((expense, index) => (
                    <div key={`expense-${index}`} className="flex items-center justify-between py-2 px-3 bg-red-50 rounded border border-red-100">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${expense.type === 'RECURRING' ? 'bg-blue-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm text-gray-800">{expense.label}</span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {expense.type === 'RECURRING' ? 'Récurrent' : new Date(expense.date).toLocaleDateString('fr-FR')}
                        </span>
                        {expense.type === 'RECURRING' && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            Récurrent
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-red-600">
                        -{expense.amount.toFixed(2)} {currencySymbol}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dépenses planifiées passées */}
            {pastTransactions.pastPlannedExpenses.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <CreditCard className="h-3 w-3 text-orange-500" />
                  Budgets ponctuels passés
                </h4>
                <div className="space-y-1">
                  {pastTransactions.pastPlannedExpenses.map((expense, index) => (
                    <div key={`planned-${index}`} className={`flex items-center justify-between py-2 px-3 rounded border ${
                      expense.spent 
                        ? 'bg-gray-50 border-gray-200' 
                        : 'bg-orange-50 border-orange-100'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          expense.spent ? 'bg-gray-400' : 'bg-orange-500'
                        }`}></div>
                        <span className={`text-sm ${expense.spent ? 'text-gray-600' : 'text-gray-800'}`}>
                          {expense.label}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(expense.date).toLocaleDateString('fr-FR')}
                        </span>
                        {expense.spent && (
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                            Dépensé
                          </span>
                        )}
                      </div>
                      <span className={`text-sm font-semibold ${
                        expense.spent ? 'text-gray-500' : 'text-orange-600'
                      }`}>
                        -{expense.amount.toFixed(2)} {currencySymbol}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Note explicative */}
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 mt-4">
            <div className="text-xs text-blue-800">
              <strong>ℹ️ Note :</strong> Ces transactions ont déjà été prises en compte dans le calcul de votre solde actuel. 
              Elles ne apparaîtront plus dans la projection future.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
