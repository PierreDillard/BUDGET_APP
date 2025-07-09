import  { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings, Save, Plus, X, Bell, Calendar, DollarSign, User, Shield, Database } from "lucide-react";
import { useBudgetStore } from "@/store/budgetStore";
import { BalanceAdjustmentModal } from "@/components/balance/BalanceAdjustmentModal";
import { MonthlyResetModal } from "@/components/balance/MonthlyResetModal";
import type { Currency } from "@/types";

const currencies = [
  { value: 'EUR' as Currency, label: 'Euro (€)', symbol: '€' },
  { value: 'USD' as Currency, label: 'Dollar US ($)', symbol: '$' },
  { value: 'GBP' as Currency, label: 'Livre Sterling (£)', symbol: '£' },
];

const defaultCategories = {
  income: ['Salaire', 'Freelance', 'Investissement', 'Allocation', 'Autre'],
  expense: ['Loyer', 'Factures', 'Assurance', 'Alimentation', 'Transport', 'Santé', 'Abonnements', 'Autre'],
  planned: ['Voyage', 'Équipement', 'Vêtements', 'Électronique', 'Maison', 'Santé', 'Formation', 'Cadeau', 'Autre']
};

export function SettingsScreen() {
  const { 
    user, 
    updateProfile, 
    isLoading, 
    error,
    addAlert,
    logout
  } = useBudgetStore();

  const [settings, setSettings] = useState({
    currency: 'EUR' as Currency,
    monthStartDay: 1,
    marginPct: 0,
    initialBalance: 0,
    notification: true,
  });
  
  const [categories, setCategories] = useState(defaultCategories);
  const [newCategory, setNewCategory] = useState({ type: 'income', name: '' });
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load user settings on mount
  useEffect(() => {
    if (user) {
      setSettings({
        currency: user.currency as Currency,
        monthStartDay: user.monthStartDay,
        marginPct: user.marginPct,
        initialBalance: user.initialBalance || 0,
        notification: user.notification,
      });
    }
  }, [user]);

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleAddCategory = () => {
    if (!newCategory.name.trim()) return;
    
    const categoryType = newCategory.type as keyof typeof categories;
    if (categories[categoryType].includes(newCategory.name.trim())) {
      addAlert({
        type: 'error',
        title: 'Erreur',
        message: 'Cette catégorie existe déjà.'
      });
      return;
    }

    setCategories(prev => ({
      ...prev,
      [categoryType]: [...prev[categoryType], newCategory.name.trim()]
    }));
    
    setNewCategory({ type: newCategory.type, name: '' });
    setHasChanges(true);
    
    addAlert({
      type: 'success',
      title: 'Catégorie ajoutée',
      message: `"${newCategory.name}" a été ajoutée aux catégories.`
    });
  };

  const handleRemoveCategory = (type: keyof typeof categories, categoryName: string) => {
    // Don't allow removing "Autre"
    if (categoryName === 'Autre') {
      addAlert({
        type: 'error',
        title: 'Action impossible',
        message: 'La catégorie "Autre" ne peut pas être supprimée.'
      });
      return;
    }

    setCategories(prev => ({
      ...prev,
      [type]: prev[type].filter(cat => cat !== categoryName)
    }));
    
    setHasChanges(true);
    
    addAlert({
      type: 'success',
      title: 'Catégorie supprimée',
      message: `"${categoryName}" a été supprimée.`
    });
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setIsSaving(true);
      
      // Validate settings
      if (settings.monthStartDay < 1 || settings.monthStartDay > 28) {
        addAlert({
          type: 'error',
          title: 'Erreur de validation',
          message: 'Le jour de début du mois doit être entre 1 et 28.'
        });
        return;
      }

      if (settings.marginPct < 0 || settings.marginPct > 50) {
        addAlert({
          type: 'error',
          title: 'Erreur de validation',
          message: 'La marge de sécurité doit être entre 0% et 50%.'
        });
        return;
      }

      // Update user profile via API
      await updateProfile({
        currency: settings.currency,
        monthStartDay: settings.monthStartDay,
        marginPct: settings.marginPct,
        notification: settings.notification,
      });

      // TODO: Save categories to backend when categories API is implemented
      localStorage.setItem('budget-app-categories', JSON.stringify(categories));
      
      setHasChanges(false);
      
      addAlert({
        type: 'success',
        title: 'Paramètres sauvegardés',
        message: 'Vos paramètres ont été mis à jour avec succès.'
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      addAlert({
        type: 'error',
        title: 'Erreur de sauvegarde',
        message: 'Impossible de sauvegarder les paramètres. Veuillez réessayer.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (user) {
      setSettings({
        currency: user.currency as Currency,
        monthStartDay: user.monthStartDay,
        marginPct: user.marginPct,
        initialBalance: user.initialBalance || 0,
        notification: user.notification,
      });
    }
    
    // Load categories from localStorage or use defaults
    const savedCategories = localStorage.getItem('budget-app-categories');
    if (savedCategories) {
      try {
        setCategories(JSON.parse(savedCategories));
      } catch {
        setCategories(defaultCategories);
      }
    } else {
      setCategories(defaultCategories);
    }
    
    setHasChanges(false);
    
    addAlert({
      type: 'info',
      title: 'Paramètres réinitialisés',
      message: 'Les paramètres ont été remis aux valeurs précédentes.'
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  // Load categories from localStorage on mount
  useEffect(() => {
    const savedCategories = localStorage.getItem('budget-app-categories');
    if (savedCategories) {
      try {
        setCategories(JSON.parse(savedCategories));
      } catch {
        // Keep default categories if parsing fails
      }
    }
  }, []);

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Chargement des paramètres utilisateur...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 mx-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Settings className="h-7 w-7" />
          Paramètres
        </h1>
        {hasChanges && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset} disabled={isSaving}>
              Annuler
            </Button>
            <Button 
              onClick={handleSave} 
              className="bg-green-600 hover:bg-green-700"
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* User Profile */}
      <Card className="backdrop-blur-lg bg-white/40 border border-white/30 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profil utilisateur
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user.email} disabled className="bg-gray-100/50" />
            <p className="text-sm text-gray-500">
              L'email ne peut pas être modifié pour l'instant
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-xs text-gray-500">Compte créé le</Label>
              <p>{new Date(user.createdAt).toLocaleDateString('fr-FR')}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Dernière modification</Label>
              <p>{new Date(user.updatedAt ?? '').toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* General Settings */}
      <Card className="backdrop-blur-lg bg-white/40 border border-white/30 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Paramètres financiers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Currency */}
          <div className="space-y-2">
            <Label htmlFor="currency">Devise par défaut</Label>
            <Select 
              value={settings.currency} 
              onValueChange={(value) => handleSettingChange('currency', value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une devise" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency.value} value={currency.value}>
                    {currency.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">
              Devise utilisée pour tous les montants dans l'application
            </p>
          </div>

          <Separator />

          {/* Month Start Day */}
          <div className="space-y-2">
            <Label htmlFor="monthStartDay">Jour de début du mois budgétaire</Label>
            <Select 
              value={settings.monthStartDay.toString()} 
              onValueChange={(value) => handleSettingChange('monthStartDay', parseInt(value))}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un jour" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                  <SelectItem key={day} value={day.toString()}>
                    Le {day} de chaque mois
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">
              Définit le jour où commence votre mois budgétaire et où les revenus/dépenses récurrents sont appliqués
            </p>
          </div>

          <Separator />

          {/* Initial Balance */}
          <div className="space-y-2">
            <Label htmlFor="initialBalance">Solde initial du mois</Label>
            <Input
              id="initialBalance"
              type="number"
              step="0.01"
              value={settings.initialBalance}
              onChange={(e) => handleSettingChange('initialBalance', parseFloat(e.target.value) || 0)}
              disabled={isLoading}
              placeholder="0.00"
            />
            <p className="text-sm text-gray-500">
              Solde de départ pour vos calculs mensuels. Ce montant sera votre solde au début du mois avant toute transaction.
            </p>
          </div>

          <Separator />

          {/* Margin Percentage */}
          <div className="space-y-2">
            <Label htmlFor="marginPct">Marge de sécurité (%)</Label>
            <Input
              id="marginPct"
              type="number"
              min="0"
              max="50"
              step="1"
              value={settings.marginPct}
              onChange={(e) => handleSettingChange('marginPct', parseInt(e.target.value) || 0)}
              disabled={isLoading}
            />
            <p className="text-sm text-gray-500">
              Pourcentage de marge de sécurité appliqué aux calculs de projection (0-50%)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions financières */}
      <Card className="backdrop-blur-lg bg-white/40 border border-white/30 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Actions sur le budget
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BalanceAdjustmentModal 
              trigger={
                <Button variant="outline" className="w-full">
                  Ajuster le solde manuellement
                </Button>
              }
            />
            <MonthlyResetModal 
              trigger={
                <Button variant="outline" className="w-full">
                  Réinitialisation mensuelle
                </Button>
              }
            />
          </div>
          <p className="text-sm text-gray-500">
            Utilisez ces fonctions pour ajuster votre solde ou appliquer la réinitialisation mensuelle de vos revenus et dépenses récurrents.
          </p>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="backdrop-blur-lg bg-white/40 border border-white/30 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications">Notifications push</Label>
              <p className="text-sm text-gray-500">
                Recevoir des alertes quand votre solde devient négatif ou approche de zéro
              </p>
            </div>
            <Switch
              id="notifications"
              checked={settings.notification}
              onCheckedChange={(checked) => handleSettingChange('notification', checked)}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories Management */}
      <Card className="backdrop-blur-lg bg-white/40 border border-white/30 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Gestion des catégories
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add New Category */}
          <div className="space-y-2">
            <Label>Ajouter une nouvelle catégorie</Label>
            <div className="flex items-center gap-2">
              <Select 
                value={newCategory.type} 
                onValueChange={(value) => setNewCategory(prev => ({ ...prev, type: value }))}
                disabled={isLoading}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Revenus</SelectItem>
                  <SelectItem value="expense">Dépenses</SelectItem>
                  <SelectItem value="planned">Budgets</SelectItem>
                </SelectContent>
              </Select>
              
              <Input
                placeholder="Nom de la catégorie"
                value={newCategory.name}
                onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                className="flex-1"
                disabled={isLoading}
              />
              
              <Button onClick={handleAddCategory} disabled={!newCategory.name.trim() || isLoading}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Categories Lists */}
          {Object.entries(categories).map(([type, categoryList]) => {
            const typeLabels = {
              income: 'Revenus',
              expense: 'Dépenses',
              planned: 'Budgets ponctuels'
            };
            
            return (
              <div key={type} className="space-y-2">
                <Label>{typeLabels[type as keyof typeof typeLabels]}</Label>
                <div className="flex flex-wrap gap-2">
                  {categoryList.map((category) => (
                    <Badge
                      key={category}
                      variant="secondary"
                      className="flex items-center gap-1 px-3 py-1"
                    >
                      {category}
                      {category !== 'Autre' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 text-gray-500 hover:text-red-600"
                          onClick={() => handleRemoveCategory(type as keyof typeof categories, category)}
                          disabled={isLoading}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="backdrop-blur-lg bg-white/40 border border-white/30 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Sécurité
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Déconnexion</Label>
              <p className="text-sm text-gray-500">
                Se déconnecter de l'application et supprimer les données locales
              </p>
            </div>
            <Button variant="destructive" onClick={handleLogout}>
              Se déconnecter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card className="backdrop-blur-lg bg-white/40 border border-white/30 shadow-lg">
        <CardHeader>
          <CardTitle>À propos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Budget App</strong> - Version 2.0.0</p>
            <p>Application de gestion de budget personnel avec backend sécurisé</p>
            <p>Frontend: React, TypeScript, Tailwind CSS</p>
            <p>Backend: NestJS, Prisma, PostgreSQL</p>
            <p>Authentification: JWT avec refresh tokens</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
