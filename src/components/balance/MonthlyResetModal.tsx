import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Calendar, RefreshCw, TrendingUp, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { useBudgetStore } from "@/store/budgetStore";
import { apiService } from "@/services/api";

interface MonthlyResetModalProps {
  trigger?: React.ReactNode;
  onClose?: () => void;
}

export function MonthlyResetModal({ trigger, onClose }: MonthlyResetModalProps) {
  const { triggerMonthlyReset, isLoading, user, balance } = useBudgetStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const [resetStatus, setResetStatus] = useState<{
    lastReset: string | null;
    nextReset: string;
    isResetDue: boolean;
    daysSinceLastReset: number;
  } | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadResetStatus();
    }
  }, [isOpen]);

  const loadResetStatus = async () => {
    try {
      setStatusLoading(true);
      const status: {
        lastReset: string | null;
        nextReset: string;
        isResetDue?: boolean;
        daysSinceLastReset?: number;
      } = await apiService.getMonthlyResetStatus();
      // Ensure all required properties are present
      setResetStatus({
        lastReset: status.lastReset ?? null,
        nextReset: status.nextReset,
        isResetDue: status.isResetDue ?? false,
        daysSinceLastReset: status.daysSinceLastReset ?? 0,
      });
    } catch (error) {
      console.error('Erreur lors du chargement du statut de réinitialisation:', error);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      await triggerMonthlyReset();
      await loadResetStatus(); // Recharger le statut après la réinitialisation
    } catch (error) {
      console.error('Erreur lors de la réinitialisation:', error);
    }
  };

  const handleClose = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      onClose?.();
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Jamais';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getNextResetDate = () => {
    if (!user) return new Date();
    
    const now = new Date();
    const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, user.monthStartDay);
    
    // Si on a dépassé le jour de début de ce mois, passer au mois suivant
    if (now.getDate() >= user.monthStartDay) {
      nextReset.setMonth(nextReset.getMonth() + 1);
    }
    
    return nextReset;
  };

  const getDaysUntilReset = () => {
    const nextReset = getNextResetDate();
    const now = new Date();
    const diffTime = nextReset.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const currencySymbol = user?.currency === 'USD' ? '$' : user?.currency === 'GBP' ? '£' : '€';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Réinitialisation mensuelle
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-lg backdrop-blur-lg bg-white/95 border border-white/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Réinitialisation mensuelle du budget
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Statut actuel */}
          <Card className="bg-blue-50/50 border-blue-200/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Statut actuel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {statusLoading ? (
                <p className="text-sm text-gray-500">Chargement du statut...</p>
              ) : resetStatus ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Dernière réinitialisation :</span>
                    <span className="text-sm font-medium">
                      {formatDate(resetStatus.lastReset)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Prochaine réinitialisation :</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {formatDate(resetStatus.nextReset)}
                      </span>
                      <Badge variant={resetStatus.isResetDue ? 'destructive' : 'secondary'}>
                        {getDaysUntilReset() <= 0 ? 'Échue' : `Dans ${getDaysUntilReset()} jour${getDaysUntilReset() > 1 ? 's' : ''}`}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Jours depuis la dernière :</span>
                    <span className="text-sm font-medium">
                      {resetStatus.daysSinceLastReset} jour{resetStatus.daysSinceLastReset > 1 ? 's' : ''}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-red-500">Erreur lors du chargement du statut</p>
              )}
            </CardContent>
          </Card>

          {/* Configuration utilisateur */}
          <Card className="bg-gray-50/50 border-gray-200/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Jour de début du mois :</span>
                <span className="text-sm font-medium">{user?.monthStartDay || 1}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Devise :</span>
                <span className="text-sm font-medium">{user?.currency || 'EUR'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Marge de sécurité :</span>
                <span className="text-sm font-medium">{user?.marginPct || 0}%</span>
              </div>
            </CardContent>
          </Card>

          {/* Aperçu de l'impact */}
          {balance && (
            <Card className="bg-green-50/50 border-green-200/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Impact de la réinitialisation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Solde actuel :</span>
                  <span className={`text-sm font-medium ${
                    balance.currentBalance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {balance.currentBalance.toFixed(2)} {currencySymbol}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Revenus récurrents :</span>
                  <span className="text-sm font-medium text-green-600">
                    +{balance.totalIncome.toFixed(2)} {currencySymbol}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Dépenses récurrentes :</span>
                  <span className="text-sm font-medium text-red-600">
                    -{balance.totalExpenses.toFixed(2)} {currencySymbol}
                  </span>
                </div>
                <hr className="border-gray-200" />
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-sm">Nouveau solde estimé :</span>
                  <span className={`text-sm ${
                    (balance.currentBalance + balance.totalIncome - balance.totalExpenses) >= 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {(balance.currentBalance + balance.totalIncome - balance.totalExpenses).toFixed(2)} {currencySymbol}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Alerte si réinitialisation due */}
          {resetStatus?.isResetDue && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Réinitialisation recommandée</AlertTitle>
              <AlertDescription>
                Votre budget mensuel devrait être réinitialisé. Les revenus et dépenses récurrents seront automatiquement appliqués.
              </AlertDescription>
            </Alert>
          )}

          {/* Information sur le processus */}
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              La réinitialisation mensuelle ajoutera vos revenus récurrents et déduira vos dépenses récurrentes de votre solde actuel. 
              Les budgets ponctuels non dépensés seront conservés.
            </AlertDescription>
          </Alert>

          {/* Boutons d'action */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              className="flex-1"
              disabled={isLoading}
            >
              Fermer
            </Button>
            <Button
              onClick={handleReset}
              className="flex-1"
              disabled={isLoading || !resetStatus}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Réinitialisation...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Réinitialiser le budget
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Composant d'alerte pour la réinitialisation due
export function MonthlyResetAlert() {
  const { user } = useBudgetStore();
  const [resetStatus, setResetStatus] = useState<{
    isResetDue: boolean;
    daysSinceLastReset: number;
  } | null>(null);

  useEffect(() => {
    const checkResetStatus = async () => {
      try {
        const status: {
          lastReset: string | null;
          nextReset: string;
          isResetDue?: boolean;
          daysSinceLastReset?: number;
        } = await apiService.getMonthlyResetStatus();
        setResetStatus({
          isResetDue: status.isResetDue ?? false,
          daysSinceLastReset: status.daysSinceLastReset ?? 0,
        });
      } catch (error) {
        console.error('Erreur lors de la vérification du statut de réinitialisation:', error);
      }
    };

    if (user) {
      checkResetStatus();
    }
  }, [user]);

  if (!resetStatus?.isResetDue) return null;

  return (
  <div></div>
  );
}

export default MonthlyResetModal;
