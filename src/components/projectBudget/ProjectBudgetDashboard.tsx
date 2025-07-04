import React from 'react';
import { ProjectBudgetManager } from './ProjectBudgetManager';

export const ProjectBudgetDashboard: React.FC = () => {
  return (
    <div className="space-y-6 mx-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl ml-2 font-bold text-gray-800">Budgets Projet</h1>
          <p className="text-gray-600 mt-1 ml-2">
            Gérez vos budgets d'amortissement pour économiser en vue d'achats ou projets spécifiques
          </p>
        </div>
      </div>

      <ProjectBudgetManager />
    </div>
  );
};