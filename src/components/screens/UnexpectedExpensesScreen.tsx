import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UnexpectedExpense, UnexpectedExpenseCategory, CreateUnexpectedExpenseRequest } from '@/types';
import { Plus, Edit, Trash2, Calendar, DollarSign } from 'lucide-react';
import { useBudgetStore } from '@/store/budgetStore';

const categoryLabels: Record<UnexpectedExpenseCategory, string> = {
  medical: 'Médical',
  car_repair: 'Réparation auto',
  home_repair: 'Réparation maison',
  legal: 'Juridique',
  emergency: 'Urgence',
  technology: 'Technologie',
  family: 'Famille',
  work: 'Travail',
  other: 'Autre'
};

const categoryColors: Record<UnexpectedExpenseCategory, string> = {
  medical: 'bg-red-500',
  car_repair: 'bg-blue-500',
  home_repair: 'bg-orange-500',
  legal: 'bg-purple-500',
  emergency: 'bg-red-600',
  technology: 'bg-green-500',
  family: 'bg-pink-500',
  work: 'bg-indigo-500',
  other: 'bg-gray-500'
};

export function UnexpectedExpensesScreen() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<UnexpectedExpense | undefined>();
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<'list' | 'chart'>('list');

  // Form state
  const [formData, setFormData] = useState({
    label: '',
    amount: '',
    date: '',
    category: 'other' as UnexpectedExpenseCategory,
    description: ''
  });

  const store = useBudgetStore();
  const { 
    isLoading,
    user,
    loadUnexpectedExpenses,
    addUnexpectedExpense,
    updateUnexpectedExpense,
    removeUnexpectedExpense
  } = store;

  // Access unexpected expenses safely
  const unexpectedExpenses = (store as any).unexpectedExpenses || [];

  // Load unexpected expenses on component mount
  useEffect(() => {
    if (loadUnexpectedExpenses) {
      loadUnexpectedExpenses();
    }
  }, [loadUnexpectedExpenses]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (modalOpen) {
      if (modalMode === 'edit' && selectedExpense) {
        setFormData({
          label: selectedExpense.label,
          amount: selectedExpense.amount.toString(),
          date: selectedExpense.date.split('T')[0], // Extract date part
          category: selectedExpense.category,
          description: selectedExpense.description || ''
        });
      } else {
        setFormData({
          label: '',
          amount: '',
          date: new Date().toISOString().split('T')[0], // Today's date
          category: 'other',
          description: ''
        });
      }
    }
  }, [modalOpen, modalMode, selectedExpense]);

  const handleAdd = () => {
    setSelectedExpense(undefined);
    setModalMode('add');
    setModalOpen(true);
  };

  const handleEdit = (expense: UnexpectedExpense) => {
    setSelectedExpense(expense);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleDelete = async (expense: UnexpectedExpense) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${expense.label}" ?`)) {
      try {
        if (removeUnexpectedExpense) {
          await removeUnexpectedExpense(expense.id);
        }
      } catch (error) {
        console.error('Erreur lors de la suppression de la dépense imprévue:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.label || !formData.amount || !formData.date) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const expenseData: CreateUnexpectedExpenseRequest = {
      label: formData.label,
      amount: parseFloat(formData.amount),
      date: formData.date,
      category: formData.category,
      description: formData.description || undefined
    };

    try {
      if (modalMode === 'add' && addUnexpectedExpense) {
        await addUnexpectedExpense(expenseData);
      } else if (modalMode === 'edit' && selectedExpense && updateUnexpectedExpense) {
        await updateUnexpectedExpense(selectedExpense.id, expenseData);
      }
      setModalOpen(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Filter expenses by year
  const filteredExpenses = unexpectedExpenses.filter((expense: UnexpectedExpense) => {
    const expenseYear = new Date(expense.date).getFullYear();
    return expenseYear === selectedYear;
  });

  // Calculate statistics
  const totalAmount = filteredExpenses.reduce((sum: number, expense: UnexpectedExpense) => sum + expense.amount, 0);
  const averageAmount = filteredExpenses.length > 0 ? totalAmount / filteredExpenses.length : 0;
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Dépenses imprévues</h1>
        <Button 
          onClick={handleAdd} 
          className="bg-blue-600 hover:bg-blue-700"
          disabled={isLoading}
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une dépense
        </Button>
      </div>

      {/* Filter and View Controls */}
      <Card className="backdrop-blur-lg bg-white/40 border border-white/30 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <Label className="text-sm font-medium">Année :</Label>
                <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                  <SelectTrigger className="w-32 ml-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2023, 2024, 2025, 2026].map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                Liste
              </Button>
              <Button
                variant={viewMode === 'chart' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('chart')}
              >
                Graphique
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      {filteredExpenses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="backdrop-blur-lg bg-white/40 border border-white/30 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-red-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Total</h3>
                  <p className="text-2xl font-bold text-red-600">
                    {totalAmount.toFixed(2)} {user?.currency || '€'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="backdrop-blur-lg bg-white/40 border border-white/30 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Nombre</h3>
                  <p className="text-2xl font-bold text-blue-600">{filteredExpenses.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="backdrop-blur-lg bg-white/40 border border-white/30 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-orange-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Moyenne</h3>
                  <p className="text-2xl font-bold text-orange-600">
                    {averageAmount.toFixed(2)} {user?.currency || '€'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Content based on view mode */}
      {viewMode === 'list' ? (
        <Card className="backdrop-blur-lg bg-white/40 border border-white/30 shadow-lg">
          <CardHeader>
            <CardTitle>Liste des dépenses imprévues ({selectedYear})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredExpenses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  Aucune dépense imprévue pour {selectedYear}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredExpenses.map((expense: UnexpectedExpense) => (
                  <div 
                    key={expense.id} 
                    className="flex items-center justify-between p-3 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className={`w-3 h-3 rounded-full ${categoryColors[expense.category]}`}
                      />
                      <div>
                        <p className="font-medium">{expense.label}</p>
                        <p className="text-sm text-gray-600">
                          {categoryLabels[expense.category]} • {new Date(expense.date).toLocaleDateString('fr-FR')}
                        </p>
                        {expense.description && (
                          <p className="text-xs text-gray-500 mt-1">{expense.description}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-red-600 mr-2">
                        {expense.amount.toFixed(2)} {user?.currency || '€'}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(expense)}
                        className="p-2"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(expense)}
                        className="p-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="backdrop-blur-lg bg-white/40 border border-white/30 shadow-lg">
          <CardHeader>
            <CardTitle>Analyse graphique des dépenses imprévues</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-center py-8">
              Graphique en cours de développement...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modal for Add/Edit */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="backdrop-blur-lg bg-white/95 border border-white/30">
          <DialogHeader>
            <DialogTitle>
              {modalMode === 'add' ? 'Ajouter' : 'Modifier'} une dépense imprévue
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="label">Libellé *</Label>
              <Input
                id="label"
                type="text"
                value={formData.label}
                onChange={(e) => handleInputChange('label', e.target.value)}
                placeholder="Ex: Réparation voiture"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Montant *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="category">Catégorie</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => handleInputChange('category', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${categoryColors[key as UnexpectedExpenseCategory]}`} />
                        {label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description (optionnel)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Description détaillée de la dépense..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setModalOpen(false)}
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {modalMode === 'add' ? 'Ajouter' : 'Modifier'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
