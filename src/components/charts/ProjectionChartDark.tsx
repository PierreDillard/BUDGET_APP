import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';
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
  const balanceChange = finalBalance - currentBalance;
  const minBalance = Math.min(...chartData.map(d => d.balance));
  const maxBalance = Math.max(...chartData.map(d => d.balance));
  const hasNegativeProjection = minBalance < 0;

  // Configuration des couleurs selon la maquette
  const currencySymbol = user?.currency === 'USD' ? '$' : user?.currency === 'GBP' ? '£' : '€';

  // Custom tooltip selon le style de la maquette
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const date = new Date(data.date);
      
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
          <p className="text-slate-300 text-sm font-medium mb-2">
            {date.toLocaleDateString('fr-FR', { 
              day: 'numeric', 
              month: 'short' 
            })}
          </p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-white text-sm">Revenus</span>
              <span className="text-green-500 font-semibold">0,00€</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-white text-sm">Budget ponctuel</span>
              <span className="text-orange-500 font-semibold">0,00€</span>
            </div>
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
          <LineChart
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
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#374151" 
              horizontal={true}
              vertical={false}
            />
            
            <XAxis 
              dataKey="dayLabel"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              interval="preserveStartEnd"
            />
            
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              domain={['dataMin - 100', 'dataMax + 100']}
              tickFormatter={(value) => `${value}`}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            {/* Ligne de référence zéro */}
            <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="2 2" />
            
            {/* Aire sous la courbe pour l'effet visuel */}
            <Area
              type="monotone"
              dataKey="balance"
              stroke="none"
              fill="url(#areaGradient)"
            />
            
            {/* Ligne principale rouge comme dans la maquette */}
            <Line
              type="monotone"
              dataKey="balance"
              stroke="#ef4444"
              strokeWidth={3}
              dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: '#ef4444', stroke: '#1f2937', strokeWidth: 2 }}
            />
            
            {/* Ligne verte constante pour "Budget ponctuel" */}
            <Line
              type="monotone"
              dataKey="budgetPonctuel"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Légende comme dans la maquette */}
      <div className="flex items-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-slate-400 text-sm">Revenus</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
          <span className="text-slate-400 text-sm">Budget ponctuel</span>
        </div>
      </div>
      
      {/* Point de survol affiché */}
      {hoveredPoint && (
        <div className="absolute top-4 right-4 bg-slate-700 p-2 rounded-lg">
          <p className="text-slate-300 text-xs">
            {new Date(hoveredPoint.date).toLocaleDateString('fr-FR', { 
              day: 'numeric',
              month: 'short'
            })}
          </p>
          <p className="text-white font-semibold">
            {hoveredPoint.balance?.toFixed(2)} €
          </p>
        </div>
      )}
    </div>
  );
}
