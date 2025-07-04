import React from 'react';
import { FeatureRoute } from '../features/registry';

export interface DynamicRoute extends FeatureRoute {
  feature: string;
}

export class RouteManager {
  private routes = new Map<string, DynamicRoute[]>();

  registerRoutes(feature: string, routes: FeatureRoute[]): void {
    const dynamicRoutes: DynamicRoute[] = routes.map(route => ({
      ...route,
      feature
    }));
    
    this.routes.set(feature, dynamicRoutes);
    console.log(`🛣️ Routes registered for feature "${feature}": ${routes.length} routes`);
  }

  getRoutes(): DynamicRoute[] {
    return Array.from(this.routes.values()).flat();
  }

  getRoutesByFeature(feature: string): DynamicRoute[] {
    return this.routes.get(feature) || [];
  }

  removeRoutes(feature: string): void {
    this.routes.delete(feature);
    console.log(`🗑️ Routes removed for feature "${feature}"`);
  }

  generateReactRoutes(): React.ReactElement[] {
    const allRoutes = this.getRoutes();
    
    return allRoutes.map((route, index) => 
      React.createElement('Route', {
        key: `${route.feature}-${index}`,
        path: route.path,
        element: React.createElement(route.component),
        // TODO: Add permission validation
      })
    );
  }
}

export const routeManager = new RouteManager();
export default routeManager;
