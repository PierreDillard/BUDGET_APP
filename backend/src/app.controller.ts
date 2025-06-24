import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Health Check')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOperation({ 
    summary: 'Health check endpoint',
    description: 'Vérifie que l\'API est fonctionnelle'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'API is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'OK' },
        timestamp: { type: 'string', example: '2025-05-29T16:00:00.000Z' },
        uptime: { type: 'number', example: 12345 },
        message: { type: 'string', example: 'Budget App API is running successfully' }
      }
    }
  })
  getHealth() {
    return this.appService.getHealth();
  }

  @Get()
  @ApiOperation({ 
    summary: 'API info endpoint',
    description: 'Informations générales sur l\'API'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'API information',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Budget App API' },
        version: { type: 'string', example: '1.0.0' },
        description: { type: 'string', example: 'API for personal budget management' },
        documentation: { type: 'string', example: '/api/docs' }
      }
    }
  })
  getInfo() {
    return this.appService.getInfo();
  }
}