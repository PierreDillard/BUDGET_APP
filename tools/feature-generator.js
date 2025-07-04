#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// CLI pour générer automatiquement une nouvelle feature
class FeatureGenerator {
  constructor() {
    this.featuresDir = path.join(process.cwd(), 'src', 'features');
    this.templates = this.loadTemplates();
  }

  loadTemplates() {
    return {
      component: `import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

interface {{ComponentName}}Props {
  // Define your props here
}

export const {{ComponentName}}: React.FC<{{ComponentName}}Props> = (props) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{{FeatureName}}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Welcome to {{FeatureName}} feature!</p>
        {/* Implement your component logic here */}
      </CardContent>
    </Card>
  );
};`,

      service: `import { BaseApiService } from '../../services/baseApiService';

export interface {{FeatureName}}Data {
  // Define your data types here
}

export class {{FeatureName}}Service extends BaseApiService {
  private readonly basePath = '/{{kebab-name}}';

  async get{{FeatureName}}Data(): Promise<{{FeatureName}}Data[]> {
    const response = await this.get<{{FeatureName}}Data[]>(this.basePath);
    return response.data;
  }

  // Add more service methods here
}

export const {{camelName}}Service = new {{FeatureName}}Service();`,

      storeSlice: `import type { {{FeatureName}}State, {{FeatureName}}Actions, SliceCreator } from '../../store/types';

export const create{{FeatureName}}Slice: SliceCreator<{{FeatureName}}State & {{FeatureName}}Actions> = (set, get) => ({
  // Initial state
  {{camelName}}Data: [],
  isLoading{{FeatureName}}: false,
  {{camelName}}Error: null,

  // Actions
  load{{FeatureName}}Data: async () => {
    try {
      set((state) => ({ ...state, isLoading{{FeatureName}}: true, {{camelName}}Error: null }));
      // Implement your data loading logic here
      const data = []; // Replace with actual service call
      set((state) => ({ ...state, {{camelName}}Data: data, isLoading{{FeatureName}}: false }));
    } catch (error) {
      set((state) => ({
        ...state,
        {{camelName}}Error: error instanceof Error ? error.message : 'An error occurred',
        isLoading{{FeatureName}}: false
      }));
    }
  },

  // Add more actions here
});`,

      types: `// Types for {{FeatureName}} feature
export interface {{FeatureName}}Data {
  id: string;
  // Add your properties here
}

export interface {{FeatureName}}State {
  {{camelName}}Data: {{FeatureName}}Data[];
  isLoading{{FeatureName}}: boolean;
  {{camelName}}Error: string | null;
}

export interface {{FeatureName}}Actions {
  load{{FeatureName}}Data: () => Promise<void>;
  // Add more action types here
}`,

      hook: `import { useBudgetStore } from '../../store/budgetStore';

export const use{{FeatureName}} = () => {
  const {
    {{camelName}}Data,
    isLoading{{FeatureName}},
    {{camelName}}Error,
    load{{FeatureName}}Data
  } = useBudgetStore();

  return {
    data: {{camelName}}Data,
    isLoading: isLoading{{FeatureName}},
    error: {{camelName}}Error,
    loadData: load{{FeatureName}}Data
  };
};`,

      featureClass: `import { BaseFeature, FeatureConfig } from '../../core/features/BaseFeature';
import React from 'react';

export class {{FeatureName}}Feature extends BaseFeature {
  config: FeatureConfig = {
    name: '{{kebab-name}}',
    version: '1.0.0',
    description: '{{description}}',
    dependencies: [], // Add dependencies if needed
    enabled: true,
    routes: [],
    menuItems: [],
    permissions: ['{{kebab-name}}:read'],
    apiEndpoints: ['/{{kebab-name}}']
  };

  async initialize(): Promise<void> {
    this.log('Initializing {{FeatureName}} feature...');
    
    // Configure routes
    this.config.routes = [
      this.createRoute(
        '/dashboard', 
        React.lazy(() => import('./components/{{FeatureName}}Dashboard')), 
        '{{FeatureName}} Dashboard', 
        'star'
      )
    ];

    // Configure menu items
    this.config.menuItems = [
      this.createMenuItem('{{FeatureName}}', '/dashboard', 'star', 100)
    ];

    this.log('{{FeatureName}} feature initialized successfully');
  }
}`,

      index: `// {{FeatureName}} Feature
export * from './components';
export * from './services';
export * from './store';
export * from './types';
export * from './hooks';
export { {{FeatureName}}Feature } from './{{FeatureName}}Feature';`,

      readme: `# {{FeatureName}} Feature

## Description
{{description}}

## Components
- \`{{FeatureName}}Dashboard\`: Main dashboard component
- Add more components as needed

## Services
- \`{{FeatureName}}Service\`: Main service for API interactions

## Store
- \`{{FeatureName}}Slice\`: State management slice

## Usage

\`\`\`typescript
import { use{{FeatureName}} } from './hooks/use{{FeatureName}}';

const MyComponent = () => {
  const { data, isLoading, loadData } = use{{FeatureName}}();
  
  // Use the feature
};
\`\`\`

## API Endpoints
- \`GET /{{kebab-name}}\`: Get {{featureName}} data
- Add more endpoints as needed

## Permissions
- \`{{kebab-name}}:read\`: Read access to {{featureName}} data
- Add more permissions as needed`,

      test: `import { describe, it, expect, beforeEach } from 'vitest';
import { {{FeatureName}}Service } from '../services/{{FeatureName}}Service';

describe('{{FeatureName}} Feature', () => {
  let service: {{FeatureName}}Service;

  beforeEach(() => {
    service = new {{FeatureName}}Service();
  });

  describe('{{FeatureName}}Service', () => {
    it('should initialize correctly', () => {
      expect(service).toBeDefined();
    });

    // Add more tests here
  });
});`
    };
  }

  generateFeature(name, options = {}) {
    const {
      description = `${name} feature`,
      type = 'full',
      withBackend = true
    } = options;

    // Normalize names
    const featureName = this.toPascalCase(name);
    const kebabName = this.toKebabCase(name);
    const camelName = this.toCamelCase(name);

    console.log(`🚀 Generating ${type} feature: ${featureName}`);

    // Create feature directory
    const featureDir = path.join(this.featuresDir, kebabName);
    this.createDirectory(featureDir);

    // Generate structure based on type
    switch (type) {
      case 'full':
        this.generateFullFeature(featureDir, featureName, kebabName, camelName, description);
        break;
      case 'component-only':
        this.generateComponentOnlyFeature(featureDir, featureName, kebabName, camelName, description);
        break;
      case 'service-only':
        this.generateServiceOnlyFeature(featureDir, featureName, kebabName, camelName, description);
        break;
    }

    // Generate backend module if requested
    if (withBackend) {
      this.generateBackendModule(kebabName, featureName, description);
    }

    console.log(`✅ Feature ${featureName} generated successfully!`);
    console.log(`📁 Location: ${featureDir}`);
    this.printNextSteps(featureName, kebabName);
  }

  generateFullFeature(featureDir, featureName, kebabName, camelName, description) {
    // Create subdirectories
    ['components', 'services', 'store', 'types', 'hooks', 'utils', 'tests'].forEach(dir => {
      this.createDirectory(path.join(featureDir, dir));
    });

    // Generate files
    this.generateFile(
      path.join(featureDir, 'components', `${featureName}Dashboard.tsx`),
      this.templates.component,
      { ComponentName: `${featureName}Dashboard`, FeatureName: featureName }
    );

    this.generateFile(
      path.join(featureDir, 'services', `${featureName}Service.ts`),
      this.templates.service,
      { FeatureName: featureName, 'kebab-name': kebabName, camelName }
    );

    this.generateFile(
      path.join(featureDir, 'store', `${kebabName}-slice.ts`),
      this.templates.storeSlice,
      { FeatureName: featureName, camelName }
    );

    this.generateFile(
      path.join(featureDir, 'types', 'index.ts'),
      this.templates.types,
      { FeatureName: featureName, camelName }
    );

    this.generateFile(
      path.join(featureDir, 'hooks', `use${featureName}.ts`),
      this.templates.hook,
      { FeatureName: featureName, camelName }
    );

    this.generateFile(
      path.join(featureDir, `${featureName}Feature.ts`),
      this.templates.featureClass,
      { FeatureName: featureName, 'kebab-name': kebabName, description }
    );

    this.generateFile(
      path.join(featureDir, 'index.ts'),
      this.templates.index,
      { FeatureName: featureName }
    );

    this.generateFile(
      path.join(featureDir, 'README.md'),
      this.templates.readme,
      { FeatureName: featureName, 'kebab-name': kebabName, description, featureName: camelName }
    );

    this.generateFile(
      path.join(featureDir, 'tests', `${kebabName}.test.ts`),
      this.templates.test,
      { FeatureName: featureName }
    );
  }

  generateComponentOnlyFeature(featureDir, featureName, kebabName, camelName, description) {
    this.createDirectory(path.join(featureDir, 'components'));
    
    this.generateFile(
      path.join(featureDir, 'components', `${featureName}.tsx`),
      this.templates.component,
      { ComponentName: featureName, FeatureName: featureName }
    );

    this.generateFile(
      path.join(featureDir, 'index.ts'),
      `export { ${featureName} } from './components/${featureName}';`,
      {}
    );
  }

  generateServiceOnlyFeature(featureDir, featureName, kebabName, camelName, description) {
    this.createDirectory(path.join(featureDir, 'services'));
    
    this.generateFile(
      path.join(featureDir, 'services', `${featureName}Service.ts`),
      this.templates.service,
      { FeatureName: featureName, 'kebab-name': kebabName, camelName }
    );

    this.generateFile(
      path.join(featureDir, 'index.ts'),
      `export { ${featureName}Service } from './services/${featureName}Service';`,
      {}
    );
  }

  generateBackendModule(kebabName, featureName, description) {
    const backendDir = path.join(process.cwd(), 'backend', 'src', kebabName);
    this.createDirectory(backendDir);

    // Controller
    const controllerContent = `import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ${featureName}Service } from './${kebabName}.service';

@Controller('${kebabName}')
@UseGuards(JwtAuthGuard)
export class ${featureName}Controller {
  constructor(private readonly ${camelName}Service: ${featureName}Service) {}

  @Get()
  findAll() {
    return this.${camelName}Service.findAll();
  }

  // Add more endpoints here
}`;

    // Service
    const serviceContent = `import { Injectable } from '@nestjs/common';

@Injectable()
export class ${featureName}Service {
  findAll() {
    // Implement your business logic here
    return [];
  }

  // Add more methods here
}`;

    // Module
    const moduleContent = `import { Module } from '@nestjs/common';
import { ${featureName}Controller } from './${kebabName}.controller';
import { ${featureName}Service } from './${kebabName}.service';

@Module({
  controllers: [${featureName}Controller],
  providers: [${featureName}Service],
  exports: [${featureName}Service]
})
export class ${featureName}Module {}`;

    this.writeFile(path.join(backendDir, `${kebabName}.controller.ts`), controllerContent);
    this.writeFile(path.join(backendDir, `${kebabName}.service.ts`), serviceContent);
    this.writeFile(path.join(backendDir, `${kebabName}.module.ts`), moduleContent);

    console.log(`📦 Backend module generated at: backend/src/${kebabName}/`);
  }

  generateFile(filePath, template, variables) {
    let content = template;
    for (const [key, value] of Object.entries(variables)) {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    this.writeFile(filePath, content);
  }

  createDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  writeFile(filePath, content) {
    fs.writeFileSync(filePath, content, 'utf8');
  }

  toPascalCase(str) {
    return str.replace(/(?:^|-)(.)/g, (_, char) => char.toUpperCase());
  }

  toKebabCase(str) {
    return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`).replace(/^-/, '');
  }

  toCamelCase(str) {
    const pascal = this.toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }

  printNextSteps(featureName, kebabName) {
    console.log(`
📋 Next Steps:
1. Register your feature in src/core/features/registry.ts:
   \`featureRegistry.registerFeature(new ${featureName}Feature());\`

2. Add the feature to your main store (if using full feature)

3. Update your router to include feature routes

4. Add feature permissions to your auth system

5. Run tests: npm test ${kebabName}

6. Start development: npm run dev

🎉 Happy coding!`);
  }
}

// CLI Interface
function main() {
  const args = process.argv.slice(2);
  const generator = new FeatureGenerator();

  if (args.length === 0) {
    console.log(`
🛠️  Feature Generator CLI

Usage:
  npm run feature:create -- --name=my-feature [options]

Options:
  --name=<name>           Feature name (required)
  --description=<desc>    Feature description
  --type=<type>          Type: full|component-only|service-only (default: full)
  --no-backend           Skip backend module generation

Examples:
  npm run feature:create -- --name=ai-advisor --description="AI financial advisor"
  npm run feature:create -- --name=notification-system --type=full
  npm run feature:create -- --name=simple-widget --type=component-only --no-backend
`);
    return;
  }

  const options = {};
  
  args.forEach(arg => {
    if (arg.startsWith('--name=')) {
      options.name = arg.split('=')[1];
    } else if (arg.startsWith('--description=')) {
      options.description = arg.split('=')[1];
    } else if (arg.startsWith('--type=')) {
      options.type = arg.split('=')[1];
    } else if (arg === '--no-backend') {
      options.withBackend = false;
    }
  });

  if (!options.name) {
    console.error('❌ Error: --name is required');
    return;
  }

  generator.generateFeature(options.name, options);
}

if (require.main === module) {
  main();
}

module.exports = { FeatureGenerator };
