import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      message: 'Budget App API is running successfully',
      environment: process.env.NODE_ENV || 'development',
    };
  }

  getInfo() {
    return {
      name: 'Budget App API',
      version: '1.0.0',
      description: 'API for personal budget management application',
      documentation: '/api/docs',
      endpoints: {
        health: '/api/v1/health',
        auth: '/api/v1/auth',
        users: '/api/v1/users',
        incomes: '/api/v1/incomes',
        expenses: '/api/v1/expenses',
        plannedExpenses: '/api/v1/planned',
        balance: '/api/v1/balance',
      },
    };
  }
}