import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Calendar, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { useBudgetStore } from "@/store/budgetStore";

interface ProjectionDataPoint {
  date: string;
  balance: number;
  day: number;
  events?: {
    incomes: Array<{ label: string; amount: number }>;
    expenses: Array<{ label: string; amount: number }>;
    plannedExpenses: Array<{ label: string; amount: number }>;
  };
}

export function ProjectionChart() {
  const { 
    projection, 
    loadProjection, 
    balance, 
    isAuthenticated, 
    user 
  } = useBudgetStore();

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      const fetchProjection = async () => {
        setIsLoading(true);
        try {
          await loadProjection();
        } finally {
          setIsLoading(false);
        }
      };

      fetchProjection();
    }
  }, [isAuthenticated, loadProjection]);

  // Format des données pour le graphique
  const chartData = projection.map((point, index) => ({
    day: index,
    date: point.date,
    balance: point.balance,
    dayLabel: new Date(point.date).toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short' 
    }),
    events: (point as any).events,
  }));

  // Calcul des statistiques
  const currentBalance = balance?.currentBalance || 0;
  const finalBalance = chartData[chartData.length - 1]?.balance || currentBalance;
  const balanceChange = finalBalance - currentBalance;
  const minBalance = Math.min(...chartData.map(d => d.balance));
  const maxBalance = Math.max(...chartData.map(d => d.balance));
  const hasNegativeProjection = minBalance < 0;

  // Configuration des couleurs
  const lineColor = hasNegativeProjection ? '#ef4444' : currentBalance >= 0 ? '#10b981' : '#f59e0b';
  const currencySymbol = user?.currency === 'USD' ? '$' : user?.currency === 'GBP' ? '£' : '€';

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const date = new Date(data.date);
      const events = data.events;

      return (
        <div className="bg-slate-800 backdrop-blur-lg border border-white/20 rounded-lg p-3 shadow-lg max-w-xs">
          <p className="font-medium text-gray-100">
            {date.toLocaleDateString('fr-FR', { 
              weekday: 'long',
              day: 'numeric', 
              month: 'long' 
            })}
          </p>
          <p className={`text-lg font-bold ${
            data.balance >= 0 ? 'text-gray-200' : 'text-red-600'
          }`}>
            {data.balance.toFixed(2)} {currencySymbol}
          </p>
          
          {events && (
            <div className="mt-2 space-y-1">
              {events.incomes?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-200">Revenus :</p>
                  {events.incomes.map((income: any, i: number) => (
                    <p key={i} className="text-xs text-gray-100">
                      + {income.amount.toFixed(2)} {currencySymbol} ({income.label})
                    </p>
                  ))}
                </div>
              )}
              
              {events.expenses?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-200">Dépenses :</p>
                  {events.expenses.map((expense: any, i: number) => (
                    <p key={i} className="text-xs text-gray-100">
                      - {expense.amount.toFixed(2)} {currencySymbol} ({expense.label})
                    </p>
                  ))}
                </div>
              )}
              
              {events.plannedExpenses?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-100">Budgets :</p>
                  {events.plannedExpenses.map((planned: any, i: number) => (
                    <p key={i} className="text-xs text-gray-200">
                      - {planned.amount.toFixed(2)} {currencySymbol} ({planned.label})
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Calcul de la projection...</p>
        </div>
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Aucune donnée de projection disponible</p>
          <p className="text-sm">Ajoutez vos revenus et dépenses pour voir la projection</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* En-tête avec statistiques */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Projection sur 30 jours
          </h3>
          <p className="text-sm text-gray-600">
            Évolution prévue de votre solde
          </p>
        </div>
        
        <div className="text-right">
          <div className="flex items-center gap-2">
            {balanceChange >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span className={`text-sm font-medium ${
              balanceChange >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {balanceChange >= 0 ? '+' : ''}{balanceChange.toFixed(2)} {currencySymbol}
            </span>
          </div>
          <p className="text-xs text-gray-500">Dans 30 jours</p>
        </div>
      </div>

      {/* Alerte si projection négative */}
      {hasNegativeProjection && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800">
            Votre solde deviendra négatif dans les 30 prochains jours. 
            Minimum prévu : <strong>{minBalance.toFixed(2)} {currencySymbol}</strong>
          </p>
        </div>
      )}

      {/* Graphique */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="dayLabel" 
              stroke="#6b7280"
              fontSize={12}
              interval="preserveStartEnd"
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => `${value.toFixed(0)} ${currencySymbol}`}
            />
            
            {/* Ligne de référence à 0 */}
            <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="2 2" />
            
            <Tooltip content={<CustomTooltip />} />
            
            <Line
              type="monotone"
              dataKey="balance"
              stroke={lineColor}
              strokeWidth={3}
              dot={{ fill: lineColor, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: lineColor, strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Légende */}
      <div className="flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Revenus</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Dépenses</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span>Budgets ponctuels</span>
          </div>
        </div>
        
        <div className="text-right">
          <p>Amplitude : {(maxBalance - minBalance).toFixed(2)} {currencySymbol}</p>
        </div>
      </div>
    </div>
  );
}
