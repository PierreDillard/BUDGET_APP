import React, { useState } from 'react';
import { ProjectBudgetList } from './ProjectBudgetList';
import { ProjectBudgetForm } from './ProjectBudgetForm';
import { ProjectBudgetDetail } from './ProjectBudgetDetail';
import { ProjectBudget } from '../../types/projectBudget';

type View = 'list' | 'form' | 'detail';

interface ProjectBudgetManagerProps {
  className?: string;
}

export const ProjectBudgetManager: React.FC<ProjectBudgetManagerProps> = ({ className }) => {
  const [currentView, setCurrentView] = useState<View>('list');
  const [selectedBudget, setSelectedBudget] = useState<ProjectBudget | undefined>();

  const handleCreateNew = () => {
    setSelectedBudget(undefined);
    setCurrentView('form');
  };

  const handleEdit = (budget: ProjectBudget) => {
    setSelectedBudget(budget);
    setCurrentView('form');
  };

  const handleView = (budget: ProjectBudget) => {
    setSelectedBudget(budget);
    setCurrentView('detail');
  };

  const handleBackToList = () => {
    setSelectedBudget(undefined);
    setCurrentView('list');
  };

  const handleSave = () => {
    // After saving, go back to list
    handleBackToList();
  };

  const renderView = () => {
    switch (currentView) {
      case 'list':
        return (
          <ProjectBudgetList
            onCreateNew={handleCreateNew}
            onEdit={handleEdit}
            onView={handleView}
          />
        );

      case 'form':
        return (
          <ProjectBudgetForm
            budget={selectedBudget}
            onSave={handleSave}
            onCancel={handleBackToList}
          />
        );

      case 'detail':
        return selectedBudget ? (
          <ProjectBudgetDetail
            budgetId={selectedBudget.id}
            onEdit={handleEdit}
            onBack={handleBackToList}
          />
        ) : (
          <div className="text-center p-4">
            <p className="text-gray-600 mb-4">Budget non trouvé</p>
            <button
              onClick={handleBackToList}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retour à la liste
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={className}>
      {renderView()}
    </div>
  );
};
