import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Calendar, Euro, Loader2 } from "lucide-react";
import { useBudgetStore } from "@/store/budgetStore";
import { IncomeModal } from "@/components/modals/IncomeModal";
import { ExpenseModal } from "@/components/modals/ExpenseModal";
import type { RecIncome, RecExpense } from "@/types";

export function RevenueExpenseScreen() {
  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<RecIncome | undefined>();
  const [selectedExpense, setSelectedExpense] = useState<RecExpense | undefined>();
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');

  const { 
    incomes, 
    expenses, 
    removeIncome, 
    removeExpense, 
    isLoading,
    user 
  } = useBudgetStore();

  const handleAddIncome = () => {
    setSelectedIncome(undefined);
    setModalMode('add');
    setIncomeModalOpen(true);
  };

  const handleEditIncome = (income: RecIncome) => {
    setSelectedIncome(income);
    setModalMode('edit');
    setIncomeModalOpen(true);
  };

  const handleDeleteIncome = async (income: RecIncome) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${income.label}" ?`)) {
      try {
        await removeIncome(income.id);
      } catch (error) {
        console.error('Erreur lors de la suppression du revenu:', error);
      }
    }
  };

  const handleAddExpense = () => {
    setSelectedExpense(undefined);
    setModalMode('add');
    setExpenseModalOpen(true);
  };

  const handleEditExpense = (expense: RecExpense) => {
    setSelectedExpense(expense);
    setModalMode('edit');
    setExpenseModalOpen(true);
  };

  const handleDeleteExpense = async (expense: RecExpense) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${expense.label}" ?`)) {
      try {
        await removeExpense(expense.id);
      } catch (error) {
        console.error('Erreur lors de la suppression de la dépense:', error);
      }
    }
  };

  const formatCurrency = (amount: number) => {
    const currency = user?.currency || 'EUR';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDay = (day: number) => {
    return `Le ${day} de chaque mois`;
  };

  const totalIncomes = incomes.reduce((sum, income) => sum + income.amount, 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  if (isLoading && incomes.length === 0 && expenses.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Chargement de vos données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mx-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Revenus et Dépenses</h1>
        <div className="flex gap-2">
          <Button 
            onClick={handleAddIncome} 
            className="bg-green-400 hover:bg-green-500 text-black"
            disabled={isLoading}
          >
            <Plus className="h-4 w-4 mr-2 text-black" />
            Ajouter un revenu
          </Button>
          <Button 
            onClick={handleAddExpense} 
            className="bg-red-400 hover:bg-red-500 text-black"
            variant="outline"
            disabled={isLoading}
          >
            <Plus className="h-4 w-4 mr-2 text-black" />
            Ajouter une dépense
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="backdrop-blur-lg bg-green-100/40 border border-green-300/30 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">Total des revenus</p>
                <h3 className="text-2xl font-bold text-green-800">
                  {formatCurrency(totalIncomes)}
                </h3>
                <p className="text-xs text-green-600 mt-1">
                  {incomes.length} source{incomes.length > 1 ? 's' : ''} de revenu{incomes.length > 1 ? 's' : ''}
                </p>
              </div>
              <Euro className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-lg bg-red-100/40 border border-red-300/30 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700">Total des dépenses</p>
                <h3 className="text-2xl font-bold text-red-800">
                  {formatCurrency(totalExpenses)}
                </h3>
                <p className="text-xs text-red-600 mt-1">
                  {expenses.length} dépense{expenses.length > 1 ? 's' : ''} récurrente{expenses.length > 1 ? 's' : ''}
                </p>
              </div>
              <Euro className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-lg bg-blue-100/40 border border-blue-300/30 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">Solde mensuel</p>
                <h3 className={`text-2xl font-bold ${
                  totalIncomes - totalExpenses >= 0 ? 'text-green-800' : 'text-red-800'
                }`}>
                  {formatCurrency(totalIncomes - totalExpenses)}
                </h3>
                <p className="text-xs text-blue-600 mt-1">
                  Avant budgets ponctuels
                </p>
              </div>
              <Euro className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="incomes" className="w-full">
        <TabsList className="grid w-full grid-cols-2 backdrop-blur-lg bg-white/30 border border-white/20">
          <TabsTrigger value="incomes">
            Revenus ({incomes.length})
          </TabsTrigger>
          <TabsTrigger value="expenses">
            Dépenses ({expenses.length})
          </TabsTrigger>
        </TabsList>

        {/* Incomes Tab */}
        <TabsContent value="incomes" className="space-y-4">
          <Card className="backdrop-blur-lg bg-white/40 border border-white/30 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Revenus récurrents</span>
                <Button 
                  onClick={handleAddIncome} 
                  size="sm"
                  disabled={isLoading}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {incomes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Euro className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun revenu enregistré</p>
                  <p className="text-sm">Commencez par ajouter votre premier revenu récurrent</p>
                  <Button 
                    onClick={handleAddIncome} 
                    className="mt-4"
                    disabled={isLoading}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter mon premier revenu
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {incomes.map((income) => (
                    <div
                      key={income.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-white/20 bg-white/20 hover:bg-white/30 transition-colors"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">{income.label}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span className="flex items-center gap-1">
                            <Euro className="h-3 w-3" />
                            {formatCurrency(income.amount)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDay(income.dayOfMonth)}
                          </span>
                          {income.category && (
                            <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                              {income.category}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditIncome(income)}
                          disabled={isLoading}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteIncome(income)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-4">
          <Card className="backdrop-blur-lg bg-white/40 border border-white/30 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Dépenses récurrentes</span>
                <Button 
                  onClick={handleAddExpense} 
                  size="sm" 
                  variant="outline"
                  disabled={isLoading}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Euro className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune dépense enregistrée</p>
                  <p className="text-sm">Ajoutez vos dépenses récurrentes (loyer, factures, etc.)</p>
                  <Button 
                    onClick={handleAddExpense} 
                    variant="outline" 
                    className="mt-4"
                    disabled={isLoading}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter ma première dépense
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-white/20 bg-white/20 hover:bg-white/30 transition-colors"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">{expense.label}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span className="flex items-center gap-1">
                            <Euro className="h-3 w-3" />
                            {formatCurrency(expense.amount)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDay(expense.dayOfMonth)}
                          </span>
                          {expense.category && (
                            <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                              {expense.category}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditExpense(expense)}
                          disabled={isLoading}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteExpense(expense)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <IncomeModal
        open={incomeModalOpen}
        onOpenChange={setIncomeModalOpen}
        income={selectedIncome}
        mode={modalMode}
      />

      <ExpenseModal
        open={expenseModalOpen}
        onOpenChange={setExpenseModalOpen}
        expense={selectedExpense}
        mode={modalMode}
      />
    </div>
  );
}
