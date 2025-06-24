import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { BalanceService } from './balance.service';
import { GetBalanceDto, GetProjectionDto, BalanceAdjustmentDto } from './dto/balance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Balance')
@Controller('balance')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class BalanceController {
  constructor(private readonly balanceService: BalanceService) {}

  @Get()
  @ApiOperation({
    summary: 'Get current balance',
    description: 'Calculate and retrieve the current balance for the authenticated user',
  })
  @ApiQuery({
    name: 'month',
    description: 'Month for calculation (YYYY-MM format)',
    type: String,
    required: false,
    example: '2025-05',
  })
  @ApiResponse({
    status: 200,
    description: 'Balance calculated successfully',
    schema: {
      type: 'object',
      properties: {
        currentBalance: { type: 'number', example: 820.50 },
        totalIncome: { type: 'number', example: 3500.00 },
        totalExpenses: { type: 'number', example: 1200.00 },
        totalPlanned: { type: 'number', example: 500.00 },
        projectedBalance: { type: 'number', example: 800.00 },
        marginAmount: { type: 'number', example: 20.50 },
        adjustments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              amount: { type: 'number' },
              description: { type: 'string' },
              date: { type: 'string' },
              type: { type: 'string' },
            },
          },
        },
      },
    },
  })
  async getBalance(@Request() req, @Query('month') month?: string) {
    return this.balanceService.calculateBalance(req.user.id, month);
  }

  @Post('adjust')
  @ApiOperation({
    summary: 'Adjust balance manually',
    description: 'Add or subtract an amount from the current balance with a description',
  })
  @ApiBody({
    type: BalanceAdjustmentDto,
    description: 'Balance adjustment details',
    examples: {
      increase: {
        summary: 'Increase balance',
        description: 'Example of increasing the balance',
        value: {
          amount: 150.50,
          description: 'Unexpected income from freelance work',
          type: 'manual_adjustment',
        },
      },
      decrease: {
        summary: 'Decrease balance',
        description: 'Example of decreasing the balance',
        value: {
          amount: -75.25,
          description: 'Bank fees not accounted for',
          type: 'correction',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Balance adjusted successfully',
    schema: {
      type: 'object',
      properties: {
        currentBalance: { type: 'number', example: 971.00 },
        totalIncome: { type: 'number', example: 3500.00 },
        totalExpenses: { type: 'number', example: 1200.00 },
        totalPlanned: { type: 'number', example: 500.00 },
        projectedBalance: { type: 'number', example: 950.50 },
        marginAmount: { type: 'number', example: 20.50 },
        adjustments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              amount: { type: 'number' },
              description: { type: 'string' },
              date: { type: 'string' },
              type: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid adjustment data',
  })
  async adjustBalance(@Request() req, @Body() adjustmentDto: BalanceAdjustmentDto) {
    return this.balanceService.adjustBalance(req.user.id, adjustmentDto);
  }

  @Post('monthly-reset')
  @ApiOperation({
    summary: 'Trigger monthly budget reset',
    description: 'Apply recurring incomes and expenses to reset the monthly budget',
  })
  @ApiResponse({
    status: 200,
    description: 'Monthly reset completed successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Réinitialisation mensuelle effectuée avec succès' },
        newBalance: {
          type: 'object',
          properties: {
            currentBalance: { type: 'number', example: 3120.50 },
            totalIncome: { type: 'number', example: 3500.00 },
            totalExpenses: { type: 'number', example: 1200.00 },
            totalPlanned: { type: 'number', example: 500.00 },
            projectedBalance: { type: 'number', example: 3100.00 },
            marginAmount: { type: 'number', example: 20.50 },
          },
        },
        resetDate: { type: 'string', format: 'date-time', example: '2025-06-01T08:00:00.000Z' },
        previousBalance: { type: 'number', example: 820.50 },
        monthlyIncome: { type: 'number', example: 3500.00 },
        monthlyExpenses: { type: 'number', example: 1200.00 },
        netChange: { type: 'number', example: 2300.00 },
        lastResetDate: { type: 'string', format: 'date-time', example: '2025-05-01T08:00:00.000Z' },
      },
    },
  })
  async triggerMonthlyReset(@Request() req) {
    return this.balanceService.triggerMonthlyReset(req.user.id);
  }

  @Get('reset-status')
  @ApiOperation({
    summary: 'Get monthly reset status',
    description: 'Check when the last reset was performed and when the next one is due',
  })
  @ApiResponse({
    status: 200,
    description: 'Reset status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        lastReset: { type: 'string', format: 'date-time', example: '2025-05-01T08:00:00.000Z' },
        nextReset: { type: 'string', format: 'date-time', example: '2025-06-01T08:00:00.000Z' },
        isResetDue: { type: 'boolean', example: false },
        daysSinceLastReset: { type: 'number', example: 15 },
        monthStartDay: { type: 'number', example: 1 },
      },
    },
  })
  async getMonthlyResetStatus(@Request() req) {
    return this.balanceService.getMonthlyResetStatus(req.user.id);
  }

  @Get('projection')
  @ApiOperation({
    summary: 'Get balance projection',
    description: 'Calculate balance projection for the next days/month',
  })
  @ApiQuery({
    name: 'days',
    description: 'Number of days to project',
    type: Number,
    required: false,
    example: 30,
  })
  @ApiQuery({
    name: 'month',
    description: 'Month for projection (YYYY-MM format)',
    type: String,
    required: false,
    example: '2025-05',
  })
  @ApiResponse({
    status: 200,
    description: 'Projection calculated successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          date: { type: 'string', example: '2025-05-30' },
          balance: { type: 'number', example: 820.50 },
          day: { type: 'number', example: 0 },
          events: {
            type: 'object',
            properties: {
              incomes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    label: { type: 'string' },
                    amount: { type: 'number' },
                  },
                },
              },
              expenses: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    label: { type: 'string' },
                    amount: { type: 'number' },
                  },
                },
              },
              plannedExpenses: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    label: { type: 'string' },
                    amount: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  async getProjection(
    @Request() req,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
    @Query('month') month?: string,
  ) {
    return this.balanceService.calculateProjection(req.user.id, days);
  }

  @Get('alerts')
  @ApiOperation({
    summary: 'Get balance alerts',
    description: 'Get alerts about balance issues, upcoming expenses, etc.',
  })
  @ApiResponse({
    status: 200,
    description: 'Alerts retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['warning', 'error', 'info'] },
          title: { type: 'string', example: 'Solde prévu négatif' },
          message: { type: 'string', example: 'Votre solde sera négatif dans 5 jours' },
          date: { type: 'string', example: '2025-06-05' },
          amount: { type: 'number', example: -150.00 },
        },
        required: ['type', 'title', 'message'],
      },
    },
  })
  async getAlerts(@Request() req) {
    return this.balanceService.getAlerts(req.user.id);
  }

  @Get('summary')
  @ApiOperation({
    summary: 'Get complete balance summary',
    description: 'Get a complete summary including balance, projection, alerts, and statistics',
  })
  @ApiResponse({
    status: 200,
    description: 'Summary retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        balance: {
          type: 'object',
          properties: {
            currentBalance: { type: 'number' },
            totalIncome: { type: 'number' },
            totalExpenses: { type: 'number' },
            totalPlanned: { type: 'number' },
            projectedBalance: { type: 'number' },
            marginAmount: { type: 'number' },
          },
        },
        projection: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string' },
              balance: { type: 'number' },
              day: { type: 'number' },
            },
          },
        },
        alerts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              title: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
        stats: {
          type: 'object',
          properties: {
            incomesByCategory: { type: 'array' },
            expensesByCategory: { type: 'array' },
            plannedByCategory: { type: 'array' },
          },
        },
        calculatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  async getSummary(@Request() req) {
    return this.balanceService.getSummary(req.user.id);
  }

  @Get('trends')
  @ApiOperation({
    summary: 'Get monthly trends',
    description: 'Get balance trends over multiple months',
  })
  @ApiQuery({
    name: 'months',
    description: 'Number of months to include in trends',
    type: Number,
    required: false,
    example: 6,
  })
  @ApiResponse({
    status: 200,
    description: 'Trends retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          month: { type: 'string', example: '2025-05' },
          income: { type: 'number', example: 3500.00 },
          expenses: { type: 'number', example: 1200.00 },
          balance: { type: 'number', example: 820.50 },
          planned: { type: 'number', example: 500.00 },
        },
      },
    },
  })
  async getMonthlyTrends(
    @Request() req,
    @Query('months', new DefaultValuePipe(6), ParseIntPipe) months: number,
  ) {
    return this.balanceService.getMonthlyTrends(req.user.id, months);
  }
}
