import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.originalUrl}`);
  next();
});
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Security
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }));
  app.use(compression());

  // Serve static files (frontend) in production
/*   if (process.env.NODE_ENV === 'production') {
    const publicPath = join(__dirname, '..', 'public');
    app.useStaticAssets(publicPath);
    app.setBaseViewsDir(publicPath);
    
    // Catch all handler for SPA routing
    app.getHttpAdapter().get('*', (req: any, res: any) => {
      if (!req.url.startsWith('/api') && !req.url.startsWith('/health')) {
        res.sendFile(join(publicPath, 'index.html'));
      }
    });
    
    logger.log(`📁 Serving static files from: ${publicPath}`);
  }
 */
  // CORS - allow all origins in production since we serve frontend from same domain
  const corsOrigins = process.env.NODE_ENV === 'production' 
    ? true 
    : [
        'http://localhost:5173', // Vite dev server
        'http://localhost:3000', // React dev server
        'http://localhost:4173', // Vite preview
        process.env.FRONTEND_URL || 'http://localhost:5173',
      ];

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Global prefix for API routes
  app.setGlobalPrefix('api/v1');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Budget App API')
      .setDescription('API pour l\'application de gestion de budget personnel')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag('Authentication', 'Endpoints d\'authentification')
      .addTag('Users', 'Gestion des utilisateurs')
      .addTag('Incomes', 'Gestion des revenus')
      .addTag('Expenses', 'Gestion des dépenses')
      .addTag('Planned Expenses', 'Gestion des budgets ponctuels')
      .addTag('Balance', 'Calculs de solde et projections')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    logger.log('📚 Swagger documentation available at: http://localhost:3001/api/docs');
  }

  // Start server
  const port = configService.get('PORT') || 3001;
  await app.listen(port);

  logger.log(`🚀 Budget App API is running on: http://localhost:${port}`);
  logger.log(`📊 Health check available at: http://localhost:${port}/api/v1/health`);
  
  if (process.env.NODE_ENV !== 'production') {
    logger.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  }
}

bootstrap().catch((error) => {
  console.error('❌ Error starting the application:', error);
  process.exit(1);
});