import { useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Settings, LogOut } from "lucide-react";
import { useBudgetStore } from "@/store/budgetStore";
import { RevenueExpenseScreen } from "@/components/screens/RevenueExpenseScreen";
import { PlannedExpensesScreen } from "@/components/screens/PlannedExpensesScreen";
import { SettingsScreen } from "@/components/screens/SettingsScreen";
import AuthScreen from "@/components/auth/AuthScreen";
import { BalanceAdjustmentModal } from "@/components/balance/BalanceAdjustmentModal";
import { MonthlyResetModal, MonthlyResetAlert } from "@/components/balance/MonthlyResetModal";
import { Toaster } from "@/components/ui/toaster";
import { ProjectionChartDark } from "@/components/charts/ProjectionChartDark";

export default function BudgetAppDark() {
  const { 
    currentTab, 
    setCurrentTab, 
    balance, 
    incomes, 
    expenses, 
    plannedExpenses, 
    user,
    isAuthenticated,
    isLoading,
    error,
    logout,
    checkAuth,
    loadAllData,
    loadBalance,
    alerts,
    removeAlert
  } = useBudgetStore();

  // Vérifier l'authentification au démarrage
  useEffect(() => {
    if (isAuthenticated) {
      checkAuth();
    }
  }, []);

  // Recharger les données quand l'utilisateur est authentifié
  useEffect(() => {
    if (isAuthenticated && user) {
      loadAllData();
    }
  }, [isAuthenticated, user]);

  // Actualiser le solde périodiquement
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(() => {
        loadBalance();
      }, 30000); // Toutes les 30 secondes

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, loadBalance]);

  // Si pas authentifié, afficher l'écran de connexion
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  // Calculer les totaux depuis les données réelles
  const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalPlanned = plannedExpenses
    .filter(expense => !expense.spent)
    .reduce((sum, expense) => sum + expense.amount, 0);
  
  const currentBalance = balance?.currentBalance ?? (totalIncome - totalExpenses - totalPlanned);
  
  const balanceData = balance || {
    currentBalance,
    totalIncome,
    totalExpenses,
    totalPlanned,
    projectedBalance: currentBalance
  };

  const currentMonth = new Date().toLocaleDateString('fr-FR', { 
    month: 'long', 
    year: 'numeric' 
  });

  const isNegativeProjection = balanceData.projectedBalance < 0;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  if (isLoading && !balance) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Card className="bg-slate-800 border-slate-700 shadow-lg p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-slate-300">Chargement de vos données...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-80 bg-slate-800 shadow-2xl">
        {/* User Info */}
        <div className="p-6 border-b border-slate-700">
          <p className="text-sm font-medium text-slate-300">{user?.email}</p>
          <p className="text-xs text-slate-400">Devise: {user?.currency}</p>
        </div>

        <nav className="flex flex-col gap-1 flex-1 p-4">
          <Button 
            variant="ghost" 
            className={`justify-start h-12 ${currentTab === 'dashboard' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
            onClick={() => setCurrentTab('dashboard')}
          >
            Dashboard
          </Button>
          <Button 
            variant="ghost"
            className={`justify-start h-12 ${currentTab === 'revenus' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
            onClick={() => setCurrentTab('revenus')}
          >
            Revenus/Dépenses
          </Button>
          <Button 
            variant="ghost"
            className={`justify-start h-12 ${currentTab === 'budgets' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
            onClick={() => setCurrentTab('budgets')}
          >
            Budgets ponctuels
          </Button>
          <Button 
            variant="ghost"
            className={`justify-start h-12 ${currentTab === 'settings' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
            onClick={() => setCurrentTab('settings')}
          >
            <Settings className="h-4 w-4 mr-2" />
            Paramètres
          </Button>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-slate-700">
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="w-full flex items-center gap-2 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between mb-6 p-4 bg-slate-800 rounded-xl border border-slate-700">
          <div>
            <p className="text-sm font-medium text-slate-300">{user?.email}</p>
            <p className="text-xs text-slate-400">Devise: {user?.currency}</p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-2 border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-900/50 border-red-800">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Custom Alerts */}
        {alerts.map((alert, index) => (
          <Alert 
            key={index}
            variant={alert.type === 'error' ? 'destructive' : 'default'}
            className="mb-6 cursor-pointer bg-slate-800/50 border-slate-700"
            onClick={() => removeAlert(index)}
          >
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{alert.title}</AlertTitle>
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        ))}

        {/* Monthly Reset Alert */}
        <MonthlyResetAlert />

        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="md:hidden grid grid-cols-4 mb-6 bg-slate-800 border-slate-700 rounded-xl">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">Dashboard</TabsTrigger>
            <TabsTrigger value="revenus" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">Revenus</TabsTrigger>
            <TabsTrigger value="budgets" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">Budgets</TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">Paramètres</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-white capitalize">
                {currentMonth}
              </h1>
              <div className="text-right">
                <p className="text-sm text-slate-400 mb-1">01-06-2025 ~ 30-062025</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  + Réinitialiser
                </Button>
              </div>
            </div>

            {/* Cartes résumées avec design de la maquette */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-slate-800 border-slate-700 rounded-2xl">
                <CardContent className="p-6">
                  <p className="text-slate-400 text-sm mb-2">Revenus fixes</p>
                  <h3 className="text-3xl font-bold text-green-500 mb-1">
                    +{balanceData.totalIncome.toFixed(2)} €
                  </h3>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800 border-slate-700 rounded-2xl">
                <CardContent className="p-6">
                  <p className="text-slate-400 text-sm mb-2">Dépenses fixes</p>
                  <h3 className="text-3xl font-bold text-red-500 mb-1">
                    -{balanceData.totalExpenses.toFixed(2)} €
                  </h3>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800 border-slate-700 rounded-2xl">
                <CardContent className="p-6">
                  <p className="text-slate-400 text-sm mb-2">Budgets ponctuels</p>
                  <h3 className="text-3xl font-bold text-yellow-500 mb-1">
                    {balanceData.totalPlanned.toFixed(2)} €
                  </h3>
                </CardContent>
              </Card>
            </div>

            {/* Projection Chart */}
            <Card className="mb-8 bg-slate-800 border-slate-700 rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <h3 className="text-lg font-semibold text-white">Projection sur 30 jours</h3>
                </div>
                <p className="text-sm text-slate-400 mb-6">
                  Évolution dans le prochain mois selon les données de référence: 542,49 €
                </p>
                <div className="h-64">
                  <ProjectionChartDark />
                </div>
              </CardContent>
            </Card>

            {/* Historique des ajustements avec style de la maquette */}
            <Card className="bg-slate-800 border-slate-700 rounded-2xl mb-8">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-white">Historique des ajustements</h3>
                  <div className="flex gap-2">
                    <span className="text-sm text-slate-400">Montant</span>
                    <span className="text-sm text-slate-400">Statut</span>
                    <span className="text-sm text-slate-400">Gestion</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 text-sm">4</span>
                      <span className="text-white">Réintitualisation mensuelle automatique</span>
                    </div>
                    <div className="text-right">
                      <span className="text-green-500 font-semibold">2400,00 €</span>
                      <p className="text-xs text-slate-400">Correction</p>
                    </div>
                    <span className="text-slate-400 text-sm">Gestion</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 text-sm">11</span>
                      <span className="text-white">Réintitualisation mensuelle de l'enseignement</span>
                    </div>
                    <div className="text-right">
                      <span className="text-red-500 font-semibold">-2600,00 €</span>
                      <p className="text-xs text-slate-400">2400,00 €</p>
                    </div>
                    <span className="text-slate-400 text-sm">Gestion</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 text-sm">25</span>
                      <span className="text-white">Réintitualisation mensuelle @ Correction</span>
                    </div>
                    <div className="text-right">
                      <span className="text-green-500 font-semibold">2400,00 €</span>
                      <p className="text-xs text-slate-400">-2600,00 €</p>
                    </div>
                    <span className="text-slate-400 text-sm">Gestion</span>
                  </div>
                </div>
                
                {/* Pagination */}
                <div className="flex justify-center mt-4">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="w-8 h-8 rounded-full bg-slate-700">
                      ←
                    </Button>
                    <Button variant="ghost" size="sm" className="w-8 h-8 rounded-full bg-slate-700">
                      →
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Solde actuel avec actions en bas */}
            <div className="fixed bottom-6 right-6 flex gap-3">
              <BalanceAdjustmentModal 
                trigger={
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg shadow-lg">
                    + Transaction
                  </Button>
                }
              />
              <MonthlyResetModal 
                trigger={
                  <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 px-6 py-3 rounded-lg shadow-lg">
                    Azter
                  </Button>
                }
              />
            </div>

            {/* Alert */}
            {isNegativeProjection && (
              <Alert 
                variant="destructive" 
                className="mt-6 bg-red-900/30 border-red-800"
              >
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <AlertTitle className="text-red-400">
                  Alerte : Solde prévu négatif
                </AlertTitle>
                <AlertDescription className="text-red-300">
                  Votre solde sera sous zéro dans les 30 prochains jours. Considérez réduire vos dépenses ou augmenter vos revenus.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Revenus tab (CRUD) */}
          <TabsContent value="revenus">
            <div className="text-white">
              <RevenueExpenseScreen />
            </div>
          </TabsContent>

          {/* Budgets tab (CRUD) */}
          <TabsContent value="budgets">
            <div className="text-white">
              <PlannedExpensesScreen />
            </div>
          </TabsContent>

          {/* Paramètres */}
          <TabsContent value="settings">
            <div className="text-white">
              <SettingsScreen />
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <Toaster />
    </div>
  );
}
