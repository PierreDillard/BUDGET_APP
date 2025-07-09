import { useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Plus, AlertTriangle, Settings, LogOut, Calculator, RefreshCw, BarChart3, TrendingUp, Wallet, Target,  User, DollarSign } from "lucide-react";
import { useBudgetStore } from "@/store/budgetStore";
import { RevenueExpenseScreen } from "@/components/screens/RevenueExpenseScreen";
import { PlannedExpensesScreen } from "@/components/screens/PlannedExpensesScreen";
import { SettingsScreen } from "@/components/screens/SettingsScreen";
import { ProjectBudgetDashboard } from "@/components/projectBudget/ProjectBudgetDashboard";
import AuthScreen from "@/components/auth/AuthScreen";
import { BalanceAdjustmentModal, BalanceAdjustmentHistory } from "@/components/balance/BalanceAdjustmentModal";
import { InitialBalanceModal } from "@/components/balance/InitialBalanceModal";
import { MonthlyResetModal, MonthlyResetAlert } from "@/components/balance/MonthlyResetModal";
import { Toaster } from "@/components/ui/toaster";
import { ProjectionChart } from "@/components/charts/ProjectionChart";

export default function BudgetApp() {
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



  const balanceData = balance || {
    currentBalance: 0,
    totalIncome: 0,
    totalExpenses: 0,
    totalPlanned: 0,
    projectedBalance: 0
  };

  const currentMonth = new Date().toLocaleDateString('fr-FR', { 
    month: 'long', 
    year: 'numeric' 
  });

  const isNegativeProjection = balanceData.projectedBalance < 0;
  const currencySymbol = user?.currency === 'USD' ? '$' : user?.currency === 'GBP' ? '£' : '€';

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  if (isLoading && !balance) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f0f4ff] to-[#e2e8f0] flex items-center justify-center">
        <Card className="backdrop-blur-lg bg-white/40 border border-white/30 shadow-lg p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement de vos données...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
   
      <div className="min-h-screen bg-slate-900 text-white flex">
      {/* Sidebar for Desktop - Minimal Design like the mockup */}
      <aside className="hidden md:flex flex-col w-20 bg-slate-800 shadow-2xl">
        {/* Logo/Icon at top */}
        <div className="flex items-center justify-center p-6 border-b border-slate-700">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
        </div>

        {/* Navigation Icons */}
        <nav className="flex flex-col gap-4 flex-1 py-6">
          <Button 
            variant="ghost" 
            size="icon"
            className={`mx-3 h-12 w-12 rounded-xl transition-all duration-200 ${
              currentTab === 'dashboard' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            onClick={() => setCurrentTab('dashboard')}
            title="Dashboard"
          >
            <BarChart3 className="h-5 w-5" />
          </Button>
          
          <Button 
            variant="ghost"
            size="icon"
            className={`mx-3 h-12 w-12 rounded-xl transition-all duration-200 ${
              currentTab === 'revenus' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            onClick={() => setCurrentTab('revenus')}
            title="Revenus/Dépenses"
          >
            <TrendingUp className="h-5 w-5" />
          </Button>
          
          <Button 
            variant="ghost"
            size="icon"
            className={`mx-3 h-12 w-12 rounded-xl transition-all duration-200 ${
              currentTab === 'budgets' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            onClick={() => setCurrentTab('budgets')}
            title="Budgets ponctuels"
          >
            <Wallet className="h-5 w-5" />
          </Button>
          
          <Button 
            variant="ghost"
            size="icon"
            className={`mx-3 h-12 w-12 rounded-xl transition-all duration-200 ${
              currentTab === 'project-budgets' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            onClick={() => setCurrentTab('project-budgets')}
            title="Budgets projets"
          >
            <Target className="h-5 w-5" />
          </Button>
          
          <Button 
            variant="ghost"
            size="icon"
            className={`mx-3 h-12 w-12 rounded-xl transition-all duration-200 ${
              currentTab === 'settings' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            onClick={() => setCurrentTab('settings')}
            title="Paramètres"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </nav>

        {/* User Profile & Logout at bottom */}
        <div className="border-t border-slate-700 py-4">
          <Button 
            variant="ghost"
            size="icon"
            className="mx-3 h-12 w-12 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 mb-2"
            title={`${user?.email} (${user?.currency})`}
          >
            <User className="h-5 w-5" />
          </Button>
          
          <Button 
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="mx-3 h-12 w-12 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10"
            title="Déconnexion"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gradient-to-br from-blue-100 via-indigo-100 to-slate-400">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between mb-4 p-3 backdrop-blur-lg bg-white/30 rounded-xl border border-white/20">
          <div>
            <p className="text-sm font-medium text-gray-800">{user?.email}</p>
            <p className="text-xs text-gray-600">Devise: {user?.currency}</p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-4">
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
            className="mb-4 cursor-pointer"
            onClick={() => removeAlert(index)}
          >
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{alert.title}</AlertTitle>
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        ))}

        {/* Monthly Reset Alert */}
        <MonthlyResetAlert />

        <Tabs value={currentTab} onValueChange={setCurrentTab} >
          <TabsList className="md:hidden grid grid-cols-5 mb-4 backdrop-blur-lg bg-white/40 hover:bg-white/60 transition-colors duration-200  border border-white/20 rounded-xl shadow-sm">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="revenus">Revenus</TabsTrigger>
            <TabsTrigger value="budgets">Budgets</TabsTrigger>
            <TabsTrigger value="project-budgets">Projets</TabsTrigger>
            <TabsTrigger value="settings">Paramètres</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl ml-2 font-bold text-gray-800 capitalize">
                {currentMonth}
              </h1>
              <span className={`text-xl font-semibold ${
                balanceData.currentBalance >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {balanceData.currentBalance >= 0 ? '+' : ''}{balanceData.currentBalance.toFixed(2)} {currencySymbol}
              </span>
            </div>

            {/* Solde actuel avec actions */}
            <Card className="mb-4  backdrop-blur-lg bg-white/40 hover:bg-white/60 transition-colors duration-200 border border-white/30 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-2xl font-bold text-gray-700">Solde actuel</p>
                    <h2 className={`text-2xl font-bold ${
                      balanceData.currentBalance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {balanceData.currentBalance.toFixed(2)} {currencySymbol}
                    </h2>
                  </div>
                  <div className="flex gap-2">
                    <InitialBalanceModal 
                      trigger={
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          Solde initial
                        </Button>
                      }
                    />
                    <BalanceAdjustmentModal 
                      trigger={
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                          <Calculator className="h-4 w-4" />
                          Ajuster
                        </Button>
                      }
                    />
                    <MonthlyResetModal 
                      trigger={
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                          <RefreshCw className="h-4 w-4" />
                          Réinitialiser
                        </Button>
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

        

            {/* Cartes résumées */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Card className="backdrop-blur-lg bg-white/40 border border-white/30 shadow-md">
                <CardContent className="p-4">
                  <p className="text-gray-600 font-bold text-2xl mb-4">Revenus fixes</p>
                  <h3 className="text-2xl font-bold text-green-600">
                    +{balanceData.totalIncome.toFixed(2)} {currencySymbol}
                  </h3>
                  <p className="text-xs text-gray-500">{incomes.length} source{incomes.length > 1 ? 's' : ''}</p>
                </CardContent>
              </Card>
              <Card className="backdrop-blur-lg bg-white/40 border border-white/30 shadow-md">
                <CardContent className="p-4">
                  <p className="text-gray-600 font-bold text-2xl mb-4">Dépenses fixes</p>
                  <h3 className=" font-bold text-red-600 text-2xl">
                    -{balanceData.totalExpenses.toFixed(2)} {currencySymbol}
                  </h3>
                  <p className="text-xs text-gray-600">{expenses.length} dépense{expenses.length > 1 ? 's' : ''}</p>
                </CardContent>
              </Card>
              <Card className="backdrop-blur-lg bg-white/40 border border-white/30 shadow-md">
                <CardContent className="p-4">
                  <p className="text-gray-700 font-bold text-2xl mb-4">Budgets ponctuels</p>
                  <h3 className="text-2xl font-bold text-yellow-500">
                    {balanceData.totalPlanned.toFixed(2)} {currencySymbol}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {plannedExpenses.filter(e => !e.spent).length} en attente
                  </p>
                </CardContent>
              </Card>
            </div>
                {/* Projection Chart */}
            <Card className="mb-4 backdrop-blur-lg bg-white/40 hover:bg-white/60 transition-colors duration-200 border border-white/30 shadow-lg">
              <CardContent className="p-4">
                <ProjectionChart />
              </CardContent>
            </Card>

            {/* Historique des ajustements */}
            <BalanceAdjustmentHistory />

            {/* Alert */}
            {isNegativeProjection && (
              <Alert 
                variant="destructive" 
                className="mt-4 backdrop-blur-lg bg-red-100/40 border border-red-300/40 shadow-md"
              >
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-red-700">
                  Alerte : Solde prévu négatif
                </AlertTitle>
                <AlertDescription className="text-red-700">
                  Votre solde sera sous zéro dans les 30 prochains jours. Considérez réduire vos dépenses ou augmenter vos revenus.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Revenus tab (CRUD) */}
          <TabsContent value="revenus">
            <RevenueExpenseScreen />
          </TabsContent>

          {/* Budgets tab (CRUD) */}
          <TabsContent value="budgets">
            <PlannedExpensesScreen />
          </TabsContent>

          {/* Project Budgets tab */}
          <TabsContent value="project-budgets">
            <ProjectBudgetDashboard />
          </TabsContent>

          {/* Paramètres */}
          <TabsContent value="settings">
            <SettingsScreen />
          </TabsContent>
        </Tabs>

        {/* Floating Action Button */}
        <Button className="fixed bottom-6 right-6 rounded-full h-14 w-14 p-0 shadow-xl bg-white/40 backdrop-blur-lg border border-white/30 text-gray-800 hover:bg-white">
          <Plus className="h-6 w-6" />
        </Button>
      </main>
      <Toaster />
    </div>
  );
}
