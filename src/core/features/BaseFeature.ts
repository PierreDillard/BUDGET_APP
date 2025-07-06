/* import React from 'react';
import { FeatureModule, FeatureConfig } from './registry';
import { SliceCreator } from '../../store/types';

// Base class pour toutes les features
export abstract class BaseFeature implements FeatureModule {
  abstract config: FeatureConfig;

  // Méthodes obligatoires à implémenter
  abstract initialize(): Promise<void>;
  
  // Méthodes optionnelles
  cleanup?(): Promise<void>;
  
  // Helper methods pour les features
  protected createRoute(
    path: string,
    component: React.ComponentType,
    title: string,
    icon?: string,
    permissions?: string[]
  ) {
    return {
      path: `/${this.config.name}${path}`,
      component,
      title,
      icon,
      permissions
    };
  }

  protected createMenuItem(
    label: string,
    path: string,
    icon: string,
    order: number = 100,
    permissions?: string[]
  ) {
    return {
      id: `${this.config.name}-${path.replace('/', '')}`,
      label,
      icon,
      path: `/${this.config.name}${path}`,
      order,
      permissions
    };
  }

  // Store integration helpers
  protected registerStoreSlice<T>(sliceCreator: SliceCreator<T>): void {
    // À implémenter avec le store principal
    console.log(`Registering store slice for ${this.config.name}`);
  }

  // API integration helpers
  protected registerApiService(serviceName: string, service: any): void {
    console.log(`Registering API service ${serviceName} for ${this.config.name}`);
  }

  // Validation helper
  protected validateDependencies(): boolean {
    if (!this.config.dependencies) return true;
    
    // Vérifier que toutes les dépendances sont disponibles
    // Implementation détaillée selon le contexte
    return true;
  }

  // Logging helper
  protected log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const prefix = `[${this.config.name}]`;
    switch (level) {
      case 'info':
        console.log(`${prefix} ${message}`);
        break;
      case 'warn':
        console.warn(`${prefix} ${message}`);
        break;
      case 'error':
        console.error(`${prefix} ${message}`);
        break;
    }
  }
}

// Exemple d'utilisation pour la feature AI Advisor
export class AiAdvisorFeature extends BaseFeature {
  config: FeatureConfig = {
    name: 'ai-advisor',
    version: '1.0.0',
    description: 'AI-powered financial advisor that analyzes spending patterns and provides recommendations',
    dependencies: ['revenue-expense', 'project-budgets'], // Dépend des données financières
    enabled: true,
    routes: [],
    menuItems: [],
    permissions: ['ai:read', 'ai:analyze'],
    apiEndpoints: ['/ai/analyze', '/ai/recommendations']
  };

  async initialize(): Promise<void> {
    this.log('Initializing AI Advisor feature...');
    
    // Vérifier les dépendances
    if (!this.validateDependencies()) {
      throw new Error('Dependencies not met for AI Advisor feature');
    }

    // Configurer les routes
    this.config.routes = [
      this.createRoute('/dashboard', React.lazy(() => import('../features/ai-advisor/components/AiDashboard')), 'AI Insights', 'brain'),
      this.createRoute('/recommendations', React.lazy(() => import('../features/ai-advisor/components/RecommendationsView')), 'Recommendations', 'lightbulb')
    ];

    // Configurer les éléments de menu
    this.config.menuItems = [
      this.createMenuItem('AI Conseiller', '/dashboard', 'brain', 90, ['ai:read'])
    ];

    // Initialiser les services
    await this.initializeServices();
    
    this.log('AI Advisor feature initialized successfully');
  }

  private async initializeServices(): Promise<void> {
    // Charger les modèles IA, configurer les APIs, etc.
    this.log('Loading AI services...');
    
    // Exemple d'initialisation de service
    const aiService = await import('../features/ai-advisor/services/aiService');
    this.registerApiService('aiService', aiService);
  }

  async cleanup(): Promise<void> {
    this.log('Cleaning up AI Advisor feature...');
    // Nettoyage des ressources, fermeture des connexions, etc.
  }
}

// Factory pour créer des features facilement
export class FeatureFactory {
  static createSimpleFeature(
    name: string,
    version: string,
    description: string,
    components: { [key: string]: React.ComponentType },
    dependencies: string[] = []
  ): FeatureModule {
    return new (class extends BaseFeature {
      config: FeatureConfig = {
        name,
        version,
        description,
        dependencies,
        enabled: true,
        routes: Object.entries(components).map(([path, component]) => 
          this.createRoute(`/${path}`, component, path)
        ),
        menuItems: [
          this.createMenuItem(name, '/', 'star', 100)
        ]
      };

      async initialize(): Promise<void> {
        this.log(`Initializing ${name} feature...`);
        // Initialisation basique
        this.log(`${name} feature initialized`);
      }
    })();
  }
}
 */