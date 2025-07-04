// Core feature management system
export interface FeatureConfig {
  name: string;
  version: string;
  description: string;
  dependencies?: string[];
  enabled: boolean;
  routes?: FeatureRoute[];
  menuItems?: FeatureMenuItem[];
  permissions?: string[];
  apiEndpoints?: string[];
}

export interface FeatureRoute {
  path: string;
  component: React.ComponentType;
  title: string;
  icon?: string;
  permissions?: string[];
}

export interface FeatureMenuItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  order: number;
  permissions?: string[];
}

export interface FeatureModule {
  config: FeatureConfig;
  initialize(): Promise<void>;
  cleanup?(): Promise<void>;
}

class FeatureRegistry {
  private features = new Map<string, FeatureModule>();
  private dependencies = new Map<string, string[]>();

  registerFeature(feature: FeatureModule): void {
    const { name, dependencies = [] } = feature.config;
    
    // Vérifier les dépendances
    for (const dependency of dependencies) {
      if (!this.features.has(dependency)) {
        throw new Error(`Feature "${name}" requires "${dependency}" to be registered first`);
      }
    }

    this.features.set(name, feature);
    this.dependencies.set(name, dependencies);
    
    console.log(`✅ Feature "${name}" registered successfully`);
  }

  getFeature(name: string): FeatureModule | undefined {
    return this.features.get(name);
  }

  getEnabledFeatures(): FeatureModule[] {
    return Array.from(this.features.values()).filter(f => f.config.enabled);
  }

  getAllRoutes(): FeatureRoute[] {
    return this.getEnabledFeatures()
      .flatMap(feature => feature.config.routes || []);
  }

  getAllMenuItems(): FeatureMenuItem[] {
    return this.getEnabledFeatures()
      .flatMap(feature => feature.config.menuItems || [])
      .sort((a, b) => a.order - b.order);
  }

  async initializeFeatures(): Promise<void> {
    const features = this.getEnabledFeatures();
    
    // Initialiser dans l'ordre des dépendances
    const initializedFeatures = new Set<string>();
    
    for (const feature of features) {
      await this.initializeFeatureWithDependencies(feature, initializedFeatures);
    }
  }

  private async initializeFeatureWithDependencies(
    feature: FeatureModule, 
    initialized: Set<string>
  ): Promise<void> {
    if (initialized.has(feature.config.name)) {
      return;
    }

    // Initialiser les dépendances d'abord
    const dependencies = this.dependencies.get(feature.config.name) || [];
    for (const depName of dependencies) {
      const dependency = this.features.get(depName);
      if (dependency) {
        await this.initializeFeatureWithDependencies(dependency, initialized);
      }
    }

    // Initialiser la feature
    await feature.initialize();
    initialized.add(feature.config.name);
    
    console.log(`🚀 Feature "${feature.config.name}" initialized`);
  }

  enableFeature(name: string): void {
    const feature = this.features.get(name);
    if (feature) {
      feature.config.enabled = true;
      console.log(`✅ Feature "${name}" enabled`);
    }
  }

  disableFeature(name: string): void {
    const feature = this.features.get(name);
    if (feature) {
      feature.config.enabled = false;
      console.log(`❌ Feature "${name}" disabled`);
    }
  }

  listFeatures(): FeatureConfig[] {
    return Array.from(this.features.values()).map(f => f.config);
  }
}

export const featureRegistry = new FeatureRegistry();
export default featureRegistry;
