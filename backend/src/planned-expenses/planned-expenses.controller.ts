import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Query,
  ParseBoolPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PlannedExpensesService } from './planned-expenses.service';
import { CreatePlannedExpenseDto, UpdatePlannedExpenseDto, MarkAsSpentDto } from './dto/planned-expense.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Planned Expenses')
@Controller('planned')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class PlannedExpensesController {
  constructor(private readonly plannedExpensesService: PlannedExpensesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new planned expense',
    description: 'Add a new one-time planned expense to the user\'s budget',
  })
  @ApiResponse({
    status: 201,
    description: 'Planned expense successfully created',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        userId: { type: 'string' },
        label: { type: 'string' },
        amount: { type: 'number' },
        date: { type: 'string', format: 'date-time' },
        spent: { type: 'boolean' },
        category: { type: 'string' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or date in the past',
  })
  async create(@Request() req, @Body() createPlannedExpenseDto: CreatePlannedExpenseDto) {
    return this.plannedExpensesService.create(req.user.id, createPlannedExpenseDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all user planned expenses',
    description: 'Retrieve all planned expenses for the authenticated user, optionally filtered by spent status',
  })
  @ApiQuery({
    name: 'spent',
    description: 'Filter by spent status',
    type: Boolean,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Planned expenses retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          label: { type: 'string' },
          amount: { type: 'number' },
          date: { type: 'string', format: 'date-time' },
          spent: { type: 'boolean' },
          category: { type: 'string' },
          createdAt: { type: 'string' },
          updatedAt: { type: 'string' },
        },
      },
    },
  })
  async findAll(
    @Request() req,
    @Query('spent', new ParseBoolPipe({ optional: true })) spent?: boolean,
  ) {
    return this.plannedExpensesService.findAll(req.user.id, spent);
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Get planned expenses statistics',
    description: 'Get statistics about planned expenses (total, spent, unspent)',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        total: {
          type: 'object',
          properties: {
            count: { type: 'number' },
            amount: { type: 'number' },
          },
        },
        spent: {
          type: 'object',
          properties: {
            count: { type: 'number' },
            amount: { type: 'number' },
          },
        },
        unspent: {
          type: 'object',
          properties: {
            count: { type: 'number' },
            amount: { type: 'number' },
          },
        },
      },
    },
  })
  async getStatistics(@Request() req) {
    return this.plannedExpensesService.getStatistics(req.user.id);
  }

  @Get('by-category')
  @ApiOperation({
    summary: 'Get planned expenses grouped by category',
    description: 'Retrieve planned expenses grouped by category with totals',
  })
  @ApiResponse({
    status: 200,
    description: 'Planned expenses by category retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          category: { type: 'string' },
          totalAmount: { type: 'number' },
          count: { type: 'number' },
        },
      },
    },
  })
  async getByCategory(@Request() req) {
    return this.plannedExpensesService.getByCategory(req.user.id);
  }

  @Get('upcoming')
  @ApiOperation({
    summary: 'Get upcoming planned expenses',
    description: 'Retrieve planned expenses that are due in the next few days',
  })
  @ApiQuery({
    name: 'days',
    description: 'Number of days to look ahead',
    type: Number,
    required: false,
    example: 30,
  })
  @ApiResponse({
    status: 200,
    description: 'Upcoming planned expenses retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          label: { type: 'string' },
          amount: { type: 'number' },
          date: { type: 'string', format: 'date-time' },
          category: { type: 'string' },
          daysUntil: { type: 'number' },
        },
      },
    },
  })
  async getUpcoming(
    @Request() req,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    return this.plannedExpensesService.getUpcoming(req.user.id, days);
  }

  @Get('overdue')
  @ApiOperation({
    summary: 'Get overdue planned expenses',
    description: 'Retrieve planned expenses that are past their due date and not yet spent',
  })
  @ApiResponse({
    status: 200,
    description: 'Overdue planned expenses retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          label: { type: 'string' },
          amount: { type: 'number' },
          date: { type: 'string', format: 'date-time' },
          category: { type: 'string' },
          daysPastDue: { type: 'number' },
        },
      },
    },
  })
  async getOverdue(@Request() req) {
    return this.plannedExpensesService.getOverdue(req.user.id);
  }

  @Get('projection')
  @ApiOperation({
    summary: 'Get monthly projection of planned expenses',
    description: 'Get projection of planned expenses for the next few months',
  })
  @ApiQuery({
    name: 'months',
    description: 'Number of months to project',
    type: Number,
    required: false,
    example: 6,
  })
  @ApiResponse({
    status: 200,
    description: 'Monthly projection retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          month: { type: 'string', example: '2025-06' },
          count: { type: 'number' },
          totalAmount: { type: 'number' },
        },
      },
    },
  })
  async getMonthlyProjection(
    @Request() req,
    @Query('months', new DefaultValuePipe(6), ParseIntPipe) months: number,
  ) {
    return this.plannedExpensesService.getMonthlyProjection(req.user.id, months);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get planned expense by ID',
    description: 'Retrieve a specific planned expense by its ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Planned expense ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Planned expense retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        userId: { type: 'string' },
        label: { type: 'string' },
        amount: { type: 'number' },
        date: { type: 'string', format: 'date-time' },
        spent: { type: 'boolean' },
        category: { type: 'string' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Planned expense not found',
  })
  async findOne(
    @Request() req, 
    @Param('id', ParseUUIDPipe) id: string
  ) {
    return this.plannedExpensesService.findOne(req.user.id, id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update planned expense',
    description: 'Update an existing planned expense',
  })
  @ApiParam({
    name: 'id',
    description: 'Planned expense ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Planned expense updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        userId: { type: 'string' },
        label: { type: 'string' },
        amount: { type: 'number' },
        date: { type: 'string', format: 'date-time' },
        spent: { type: 'boolean' },
        category: { type: 'string' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or date in the past',
  })
  @ApiResponse({
    status: 404,
    description: 'Planned expense not found',
  })
  async update(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePlannedExpenseDto: UpdatePlannedExpenseDto,
  ) {
    return this.plannedExpensesService.update(req.user.id, id, updatePlannedExpenseDto);
  }

  @Patch(':id/spent')
  @ApiOperation({
    summary: 'Mark planned expense as spent/unspent',
    description: 'Toggle the spent status of a planned expense',
  })
  @ApiParam({
    name: 'id',
    description: 'Planned expense ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Planned expense status updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        userId: { type: 'string' },
        label: { type: 'string' },
        amount: { type: 'number' },
        date: { type: 'string', format: 'date-time' },
        spent: { type: 'boolean' },
        category: { type: 'string' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Planned expense not found',
  })
  async markAsSpent(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() markAsSpentDto: MarkAsSpentDto,
  ) {
    return this.plannedExpensesService.markAsSpent(req.user.id, id, markAsSpentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete planned expense',
    description: 'Delete an existing planned expense',
  })
  @ApiParam({
    name: 'id',
    description: 'Planned expense ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Planned expense deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Planned expense successfully deleted' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Planned expense not found',
  })
  async remove(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.plannedExpensesService.remove(req.user.id, id);
  }
}