import { useEffect, useState } from 'react';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';
import { useBudgetStore } from "@/store/budgetStore";

export function ProjectionChartDark() {
  const { 
    projection, 
    loadProjection, 
    balance, 
    isAuthenticated, 
    user 
  } = useBudgetStore();

  const [isLoading, setIsLoading] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<any>(null);

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

  // Format des données pour le graphique avec style de la maquette
  const chartData = projection.map((point, index) => ({
    day: index,
    date: point.date,
    balance: point.balance,
    budgetPonctuel: 0, // Pour la ligne verte constante
    dayLabel: new Date(point.date).toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short' 
    }),
    events: (point as any).events,
  }));

  // Calcul des statistiques
  const currentBalance = balance?.currentBalance || 0;
  const finalBalance = chartData[chartData.length - 1]?.balance || currentBalance;
  const minBalance = Math.min(...chartData.map(d => d.balance));
  const isPositiveTrend = finalBalance >= currentBalance;
  const currencySymbol = user?.currency === 'USD' ? '$' : user?.currency === 'GBP' ? '£' : '€';

  // Custom tooltip avec données dynamiques
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const date = new Date(data.date);
      const events = data.events || { incomes: [], expenses: [], plannedExpenses: [] };
      
      // Calculer les totaux pour cette date
      const totalIncomes = events.incomes?.reduce((sum: number, income: any) => sum + income.amount, 0) || 0;
      const totalPlanned = events.plannedExpenses?.reduce((sum: number, expense: any) => sum + expense.amount, 0) || 0;
      
      return (
        <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-600/50 rounded-xl p-4 shadow-2xl">
          <p className="text-slate-300 text-sm font-medium mb-3 text-center">
            {date.toLocaleDateString('fr-FR', { 
              day: 'numeric', 
              month: 'short',
              year: 'numeric'
            })}
          </p>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full shadow-sm"></div>
                <span className="text-white text-sm">Solde</span>
              </div>
              <span className={`font-bold text-sm ${data.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {data.balance?.toFixed(2)} {currencySymbol}
              </span>
            </div>
            
            {totalIncomes > 0 && (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full shadow-sm"></div>
                  <span className="text-white text-sm">Revenus</span>
                </div>
                <span className="text-blue-400 font-semibold text-sm">
                  +{totalIncomes.toFixed(2)} {currencySymbol}
                </span>
              </div>
            )}
            
            {totalPlanned > 0 && (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full shadow-sm"></div>
                  <span className="text-white text-sm">Budget ponctuel</span>
                </div>
                <span className="text-orange-400 font-semibold text-sm">
                  -{totalPlanned.toFixed(2)} {currencySymbol}
                </span>
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
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-slate-400">Aucune donnée de projection disponible</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            onMouseMove={(e) => {
              if (e && e.activePayload && e.activePayload[0]) {
                setHoveredPoint(e.activePayload[0].payload);
              }
            }}
            onMouseLeave={() => setHoveredPoint(null)}
          >
            <defs>
              {/* Dégradé principal pour la courbe positive */}
              <linearGradient id="balanceGradientPositive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="50%" stopColor="#059669" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#047857" stopOpacity={0.1} />
              </linearGradient>
              
              {/* Dégradé pour la courbe négative */}
              <linearGradient id="balanceGradientNegative" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                <stop offset="50%" stopColor="#dc2626" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#b91c1c" stopOpacity={0.1} />
              </linearGradient>
              
              {/* Dégradé pour la ligne de la courbe */}
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={isPositiveTrend ? "#10b981" : "#ef4444"} />
                <stop offset="50%" stopColor={isPositiveTrend ? "#059669" : "#dc2626"} />
                <stop offset="100%" stopColor={isPositiveTrend ? "#047857" : "#b91c1c"} />
              </linearGradient>
              
              {/* Effet de brillance pour la ligne */}
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#374151" 
              horizontal={true}
              vertical={false}
              opacity={0.3}
            />
            
            <XAxis 
              dataKey="dayLabel"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              interval="preserveStartEnd"
            />
            
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              domain={['dataMin - 100', 'dataMax + 100']}
              tickFormatter={(value) => `${value}${currencySymbol}`}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            {/* Ligne de référence zéro avec style amélioré */}
            <ReferenceLine 
              y={0} 
              stroke="#6b7280" 
              strokeDasharray="4 4" 
              strokeWidth={1.5}
              opacity={0.6}
            />
            
            {/* Aire sous la courbe avec dégradé dynamique */}
            <Area
              type="monotone"
              dataKey="balance"
              stroke="none"
              fill={minBalance < 0 && finalBalance < currentBalance ? "url(#balanceGradientNegative)" : "url(#balanceGradientPositive)"}
            />
            
            {/* Ligne principale avec dégradé et effet de brillance */}
            <Line
              type="monotone"
              dataKey="balance"
              stroke="url(#lineGradient)"
              strokeWidth={4}
              dot={{ 
                fill: isPositiveTrend ? "#10b981" : "#ef4444", 
                strokeWidth: 3, 
                r: 5,
                stroke: "#1f2937",
                filter: "url(#glow)"
              }}
              activeDot={{ 
                r: 8, 
                fill: isPositiveTrend ? "#10b981" : "#ef4444", 
                stroke: "#1f2937", 
                strokeWidth: 3,
                filter: "url(#glow)",
                style: {
                  boxShadow: `0 0 20px ${isPositiveTrend ? "#10b981" : "#ef4444"}40`
                }
              }}
              filter="url(#glow)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {/* Légende modernisée avec dégradés */}
      <div className="flex items-center justify-center gap-8 mt-6">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-lg"></div>
          <span className="text-slate-300 text-sm font-medium">Solde positif</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-red-400 to-red-600 shadow-lg"></div>
          <span className="text-slate-300 text-sm font-medium">Solde négatif</span>
        </div>
      </div>
      
      {/* Indicateur de tendance */}
      <div className="flex items-center justify-center mt-4">
        <div className={`px-4 py-2 rounded-full backdrop-blur-sm border ${
          isPositiveTrend 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          <span className="text-sm font-medium">
            Tendance: {isPositiveTrend ? '↗️ Positive' : '↘️ Négative'}
          </span>
        </div>
      </div>
      
      {/* Point de survol amélioré */}
      {hoveredPoint && (
        <div className="absolute top-4 right-4 bg-slate-800/90 backdrop-blur-sm border border-slate-600/50 p-3 rounded-xl shadow-2xl">
          <p className="text-slate-300 text-xs mb-1">
            {new Date(hoveredPoint.date).toLocaleDateString('fr-FR', { 
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </p>
          <p className={`font-bold text-sm ${hoveredPoint.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {hoveredPoint.balance?.toFixed(2)} {currencySymbol}
          </p>
        </div>
      )}
    </div>
  );
}
