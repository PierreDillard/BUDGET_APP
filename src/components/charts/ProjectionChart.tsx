import { useEffect, useState } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';
import { Calendar, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { useBudgetStore } from "@/store/budgetStore";

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
  
  // Calcul de la tendance basé sur la pente moyenne
  const calculateTrend = () => {
    if (chartData.length < 2) return balanceChange >= 0;
    
    // Calculer la pente sur la première moitié et la seconde moitié
    const midPoint = Math.floor(chartData.length / 2);
    const firstHalf = chartData.slice(0, midPoint);
    const secondHalf = chartData.slice(midPoint);
    
    const firstAvg = firstHalf.reduce((sum, point) => sum + point.balance, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, point) => sum + point.balance, 0) / secondHalf.length;
    
    // La tendance est positive si la seconde moitié est meilleure que la première
    // et si le changement final est aussi positif (ou neutre si petit changement)
    const halfTrend = secondAvg > firstAvg;
    const overallTrend = balanceChange >= -10; // Tolérance de -10€ pour les petites variations
    
    return halfTrend && overallTrend;
  };
  
  const isPositiveTrend = calculateTrend();

  // Configuration des couleurs et symbole monétaire
  const currencySymbol = user?.currency === 'USD' ? '$' : user?.currency === 'GBP' ? '£' : '€';

  // Custom tooltip amélioré avec données dynamiques
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const date = new Date(data.date);
      const events = data.events || { incomes: [], expenses: [], plannedExpenses: [] };

      // Calculer les totaux pour cette date
      const totalIncomes = events.incomes?.reduce((sum: number, income: any) => sum + income.amount, 0) || 0;
      const totalExpenses = events.expenses?.reduce((sum: number, expense: any) => sum + expense.amount, 0) || 0;
      const totalPlanned = events.plannedExpenses?.reduce((sum: number, expense: any) => sum + expense.amount, 0) || 0;

      const hasTransactions = totalIncomes > 0 || totalExpenses > 0 || totalPlanned > 0;

      return (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-2xl max-w-xs">
          <p className="font-medium text-gray-800 mb-3 text-center">
            {date.toLocaleDateString('fr-FR', { 
              weekday: 'long',
              day: 'numeric', 
              month: 'long',
              year: 'numeric'
            })}
          </p>
          
          <div className="space-y-3">
            {/* Solde actuel */}
            <div className="flex items-center justify-between gap-4 pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full shadow-sm"></div>
                <span className="text-gray-700 text-sm font-medium">Solde</span>
              </div>
              <span className={`font-bold text-sm ${data.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {data.balance?.toFixed(2)} {currencySymbol}
              </span>
            </div>
            
            {hasTransactions && (
              <div className="space-y-2">
                {/* Détail des revenus */}
                {events.incomes && events.incomes.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-3 w-3 text-blue-500" />
                      <span className="text-xs font-medium text-blue-600">Revenus ({events.incomes.length})</span>
                    </div>
                    {events.incomes.map((income: any, index: number) => (
                      <div key={index} className="flex items-center justify-between gap-2 pl-4">
                        <span className="text-xs text-gray-600 truncate">{income.label}</span>
                        <span className="text-xs font-medium text-blue-600">
                          +{income.amount.toFixed(2)} {currencySymbol}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between gap-2 pl-4 pt-1 border-t border-blue-100">
                      <span className="text-xs font-medium text-blue-700">Total revenus</span>
                      <span className="text-xs font-bold text-blue-600">
                        +{totalIncomes.toFixed(2)} {currencySymbol}
                      </span>
                    </div>
                  </div>
                )}

                {/* Détail des dépenses récurrentes */}
                {events.expenses && events.expenses.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingDown className="h-3 w-3 text-red-500" />
                      <span className="text-xs font-medium text-red-600">Dépenses récurrentes ({events.expenses.length})</span>
                    </div>
                    {events.expenses.map((expense: any, index: number) => (
                      <div key={index} className="flex items-center justify-between gap-2 pl-4">
                        <span className="text-xs text-gray-600 truncate">{expense.label}</span>
                        <span className="text-xs font-medium text-red-600">
                          -{expense.amount.toFixed(2)} {currencySymbol}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between gap-2 pl-4 pt-1 border-t border-red-100">
                      <span className="text-xs font-medium text-red-700">Total dépenses</span>
                      <span className="text-xs font-bold text-red-600">
                        -{totalExpenses.toFixed(2)} {currencySymbol}
                      </span>
                    </div>
                  </div>
                )}

                {/* Détail des budgets ponctuels */}
                {events.plannedExpenses && events.plannedExpenses.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-3 w-3 text-orange-500" />
                      <span className="text-xs font-medium text-orange-600">Budgets ponctuels ({events.plannedExpenses.length})</span>
                    </div>
                    {events.plannedExpenses.map((expense: any, index: number) => (
                      <div key={index} className="flex items-center justify-between gap-2 pl-4">
                        <span className="text-xs text-gray-600 truncate">{expense.label}</span>
                        <span className="text-xs font-medium text-orange-600">
                          -{expense.amount.toFixed(2)} {currencySymbol}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between gap-2 pl-4 pt-1 border-t border-orange-100">
                      <span className="text-xs font-medium text-orange-700">Total budgets</span>
                      <span className="text-xs font-bold text-orange-600">
                        -{totalPlanned.toFixed(2)} {currencySymbol}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Message si pas de transactions */}
            {!hasTransactions && (
              <div className="text-center py-2">
                <span className="text-xs text-gray-500 italic">Aucune transaction prévue</span>
              </div>
            )}
          </div>
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
      <div className="h-64 relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              {/* Gradient principal - positif */}
              <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="50%" stopColor="#34d399" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#6ee7b7" stopOpacity={0.1} />
              </linearGradient>
              
              {/* Gradient négatif */}
              <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                <stop offset="50%" stopColor="#f87171" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#fca5a5" stopOpacity={0.1} />
              </linearGradient>
              
              {/* Gradient de transition */}
              <linearGradient id="transitionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8} />
                <stop offset="50%" stopColor="#fbbf24" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#fde68a" stopOpacity={0.1} />
              </linearGradient>
              
              {/* Filtres pour effets visuels */}
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#e5e7eb" 
              opacity={0.6}
            />
            
            <XAxis 
              dataKey="dayLabel" 
              stroke="#6b7280"
              fontSize={12}
              interval="preserveStartEnd"
              tick={{ fill: '#6b7280' }}
            />
            
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tick={{ fill: '#6b7280' }}
              tickFormatter={(value) => `${value.toFixed(0)} ${currencySymbol}`}
            />
            
            {/* Ligne de référence à 0 avec style amélioré */}
            <ReferenceLine 
              y={0} 
              stroke="#9ca3af" 
              strokeDasharray="4 4" 
              strokeWidth={2}
              opacity={0.8}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <Area
              type="monotone"
              dataKey="balance"
              stroke={hasNegativeProjection ? '#ef4444' : (isPositiveTrend ? '#10b981' : '#f59e0b')}
              strokeWidth={3}
              fill={`url(#${hasNegativeProjection ? 'negativeGradient' : (isPositiveTrend ? 'positiveGradient' : 'transitionGradient')})`}
              dot={{ 
                fill: hasNegativeProjection ? '#ef4444' : (isPositiveTrend ? '#10b981' : '#f59e0b'), 
                strokeWidth: 2, 
                r: 4,
                filter: "url(#glow)"
              }}
              activeDot={{ 
                r: 8, 
                stroke: hasNegativeProjection ? '#ef4444' : (isPositiveTrend ? '#10b981' : '#f59e0b'), 
                strokeWidth: 3,
                fill: '#ffffff',
                filter: "url(#glow)"
              }}
              style={{
                filter: "url(#glow)"
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
        
        {/* Indicateur de tendance en overlay */}
        <div className="absolute top-2 right-2">
          <div className={`
            px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm border
            ${isPositiveTrend 
              ? 'bg-emerald-50/80 text-emerald-700 border-emerald-200' 
              : 'bg-red-50/80 text-red-700 border-red-200'
            }
          `}>
            {isPositiveTrend ? (
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span>Tendance positive</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <TrendingDown className="h-3 w-3" />
                <span>Tendance négative</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Légende améliorée avec gradients */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-gradient-to-r from-blue-400 to-blue-500 rounded-sm shadow-sm"></div>
            <span className="text-gray-700 font-medium">Revenus</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-gradient-to-r from-red-400 to-red-500 rounded-sm shadow-sm"></div>
            <span className="text-gray-700 font-medium">Dépenses</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-gradient-to-r from-orange-400 to-orange-500 rounded-sm shadow-sm"></div>
            <span className="text-gray-700 font-medium">Budgets ponctuels</span>
          </div>
        </div>
        
        <div className="text-right">
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Amplitude:</span>
            <span className="font-semibold text-gray-800">
              {(maxBalance - minBalance).toFixed(2)} {currencySymbol}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
