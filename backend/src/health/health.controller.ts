import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Application is healthy' })
  @ApiResponse({ status: 503, description: 'Application is unhealthy' })
  async check() {
    const startTime = Date.now();
    const checks = {
      database: false,
      memory: true,
      disk: true,
    };

    try {
      // Test database connection
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = true;
    } catch (error) {
      checks.database = false;
    }

    // Check memory usage (warning if > 90%)
    const memory = process.memoryUsage();
    const memoryUsagePercent = (memory.heapUsed / memory.heapTotal) * 100;
    checks.memory = memoryUsagePercent < 90;

    const responseTime = Date.now() - startTime;
    const isHealthy = Object.values(checks).every(check => check === true);

    const healthStatus = {
      status: isHealthy ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      memory: {
        usage: memory,
        usagePercent: Math.round(memoryUsagePercent * 100) / 100,
      },
      pid: process.pid,
      responseTime: `${responseTime}ms`,
      checks,
    };

    if (!isHealthy) {
      throw new HttpException(healthStatus, HttpStatus.SERVICE_UNAVAILABLE);
    }

    return healthStatus;
  }
}
