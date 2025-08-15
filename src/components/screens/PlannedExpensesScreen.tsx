import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Calendar, CheckCircle, Clock, Euro, Loader2 } from "lucide-react";
import { useBudgetStore } from "@/store/budgetStore";
import { PlannedExpenseModal } from "@/components/modals/PlannedExpenseModal";
import { sortPlannedExpensesByDate } from "@/lib/plannedExpense.utils";
import type { PlannedExpense } from "@/types";

export function PlannedExpensesScreen() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<PlannedExpense | undefined>();
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');

  const { 
    plannedExpenses, 
    removePlannedExpense, 
    markPlannedExpenseAsSpent,
    isLoading,
    user
  } = useBudgetStore();

  // Auto-mark today's expenses as spent
  useEffect(() => {
    const markTodayExpenses = async () => {
      const todayExpenses = plannedExpenses.filter(expense => 
        !expense.spent && isToday(expense.date)
      );
      
      for (const expense of todayExpenses) {
        try {
          await markPlannedExpenseAsSpent(expense.id);
        } catch (error) {
          console.error('Erreur lors du marquage automatique:', error);
        }
      }
    };

    if (plannedExpenses.length > 0) {
      markTodayExpenses();
    }
  }, [plannedExpenses, markPlannedExpenseAsSpent]);

  const handleAdd = () => {
    setSelectedExpense(undefined);
    setModalMode('add');
    setModalOpen(true);
  };

  const handleEdit = (expense: PlannedExpense) => {
    setSelectedExpense(expense);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleDelete = async (expense: PlannedExpense) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${expense.label}" ?`)) {
      try {
        await removePlannedExpense(expense.id);
      } catch (error) {
        console.error('Erreur lors de la suppression du budget:', error);
      }
    }
  };

  const handleToggleSpent = async (expense: PlannedExpense) => {
    try {
      if (expense.spent) {
        // If already spent, unmark it using a dedicated API or handle accordingly
        // Example: await unmarkPlannedExpenseAsSpent(expense.id);
        // If such API does not exist, you may need to update your backend/types.
        console.warn("Unmarking as spent is not supported by updatePlannedExpense. Please implement a dedicated API or update the type.");
      } else {
        // Mark as spent using the dedicated API
        await markPlannedExpenseAsSpent(expense.id);
      }
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    const currency = user?.currency || 'EUR';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const isToday = (dateString: string) => {
    const expenseDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expenseDate.setHours(0, 0, 0, 0);
    return expenseDate.getTime() === today.getTime();
  };


  // Filter expenses: only show spent expenses and today's expenses
  const visibleExpenses = plannedExpenses.filter(expense => {
    // Always show already spent expenses
    if (expense.spent) {
      return false;
    }
    // Show today's expenses (they will be marked as spent)
    if (isToday(expense.date)) {
      return true;
    }
    // Hide future expenses
    return false;
  });
  
  const sortedExpenses = sortPlannedExpensesByDate(visibleExpenses);

  // Calculate statistics using visible expenses only
  const totalPlanned = visibleExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalSpent = visibleExpenses
    .filter(expense => expense.spent)
    .reduce((sum, expense) => sum + expense.amount, 0);
  const totalRemaining = visibleExpenses
    .filter(expense => !expense.spent)
    .reduce((sum, expense) => sum + expense.amount, 0);

  const todayCount = visibleExpenses.filter(expense => 
    !expense.spent && isToday(expense.date)
  ).length;

  if (isLoading && plannedExpenses.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Chargement de vos budgets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mx-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Budgets ponctuels</h1>
        <Button 
          onClick={handleAdd} 
          className="bg-gray-300 hover:bg-gray-400 text-black"
          disabled={isLoading}
        >
          <Plus className="h-4 w-4 mr-2" />
          Planifier une dépense
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="backdrop-blur-lg bg-white/40 hover:bg-white/60  transition-colors duration-200
border border-blue-300/30 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-black">Total planifié</p>
                <h3 className="text-2xl font-bold text-yellow-500">
                  {formatCurrency(totalPlanned)}
                </h3>
                <p className="text-xs text-black mt-1">
                  {visibleExpenses.length} budget{visibleExpenses.length > 1 ? 's' : ''}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-black" />
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-lg bg-white/40 hover:bg-white/60 transition-colors duration-200 border border-green-300/30 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">Déjà dépensé</p>
                <h3 className="text-2xl font-bold text-green-800">
                  {formatCurrency(totalSpent)}
                </h3>
                <p className="text-xs text-green-600 mt-1">
                  {visibleExpenses.filter(e => e.spent).length} terminé{visibleExpenses.filter(e => e.spent).length > 1 ? 's' : ''}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-lg bg-white/40 hover:bg-white/60 transition-colors duration-200 border border-orange-300/30 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700">Reste à dépenser</p>
                <h3 className="text-2xl font-bold text-orange-800">
                  {formatCurrency(totalRemaining)}
                </h3>
                <p className="text-xs text-orange-600 mt-1">
                  {todayCount} aujourd'hui
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Expenses List */}
      <Card className="backdrop-blur-lg bg-white/40  hover:bg-white/60 transition-colors duration-200 border border-white/30 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Liste des budgets ({visibleExpenses.length})</span>
            <Button 
              onClick={handleAdd} 
              size="sm"
              disabled={isLoading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {visibleExpenses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun budget planifié</p>
              <p className="text-sm">Commencez par planifier votre première dépense exceptionnelle</p>
              <Button 
                onClick={handleAdd} 
                className="mt-4"
                disabled={isLoading}
              >
                <Plus className="h-4 w-4 mr-2" />
                Planifier ma première dépense
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedExpenses.map((expense) => {
                const isTodayExpense = isToday(expense.date);
                
                return (
                  <div
                    key={expense.id}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                      expense.spent 
                        ? 'border-green-300/40 bg-green-50/40' 
                        : isTodayExpense
                        ? 'border-blue-300/40 bg-blue-50/40'
                        : 'border-white/20 bg-white/20 hover:bg-white/30'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className={`font-medium ${
                          expense.spent ? 'text-green-800 line-through' : 'text-gray-800'
                        }`}>
                          {expense.label}
                        </h4>
                        
                        {expense.spent ? (
                          <Badge variant="default" className="bg-green-600 text-white">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Dépensé
                          </Badge>
                        ) : isTodayExpense ? (
                          <Badge variant="default" className="bg-blue-600 text-white">
                            <Calendar className="h-3 w-3 mr-1" />
                            Aujourd'hui
                          </Badge>
                        ) : null}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Euro className="h-3 w-3" />
                          {formatCurrency(expense.amount)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(expense.date)}
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
                        onClick={() => handleToggleSpent(expense)}
                        className={expense.spent ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'}
                        disabled={isLoading}
                        title={expense.spent ? 'Marquer comme non dépensé' : 'Marquer comme dépensé'}
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : expense.spent ? (
                          <Clock className="h-4 w-4" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(expense)}
                        disabled={isLoading}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(expense)}
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
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <PlannedExpenseModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        expense={selectedExpense}
        mode={modalMode}
      />
    </div>
  );
}
