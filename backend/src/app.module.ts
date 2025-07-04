import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

// Modules
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { IncomesModule } from './incomes/incomes.module';
import { ExpensesModule } from './expenses/expenses.module';
import { PlannedExpensesModule } from './planned-expenses/planned-expenses.module';
import { BalanceModule } from './balance/balance.module';
import { ProjectBudgetsModule } from './project-budgets/project-budgets.module';
import { HealthModule } from './health/health.module';

// Controllers
import { AppController } from './app.controller';

// Services
import { AppService } from './app.service';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot({
      ttl: 60000, // 60 seconds in milliseconds
      limit: 100, // 100 requests per minute
    }),

    // Scheduled tasks
    ScheduleModule.forRoot(),

    // Application modules
    PrismaModule,
    AuthModule,
    UsersModule,
    IncomesModule,
    ExpensesModule,
    PlannedExpensesModule,
    BalanceModule,
    ProjectBudgetsModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}