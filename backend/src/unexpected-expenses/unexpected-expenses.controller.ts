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
import { UnexpectedExpensesService } from './unexpected-expenses.service';
import { CreateUnexpectedExpenseDto, UpdateUnexpectedExpenseDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Unexpected Expenses')
@Controller('unexpected')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UnexpectedExpensesController {
  constructor(private readonly unexpectedExpensesService: UnexpectedExpensesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new unexpected expense',
    description: 'Add a new unexpected expense to the user\'s budget',
  })
  @ApiResponse({
    status: 201,
    description: 'Unexpected expense successfully created',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        userId: { type: 'string' },
        label: { type: 'string' },
        amount: { type: 'number' },
        date: { type: 'string', format: 'date-time' },
        category: { type: 'string' },
        description: { type: 'string' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or date in the future',
  })
  async create(@Request() req, @Body() createUnexpectedExpenseDto: CreateUnexpectedExpenseDto) {
    return this.unexpectedExpensesService.create(req.user.id, createUnexpectedExpenseDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all user unexpected expenses',
    description: 'Retrieve all unexpected expenses for the authenticated user, optionally filtered by year',
  })
  @ApiQuery({
    name: 'year',
    description: 'Filter by year',
    type: Number,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Unexpected expenses retrieved successfully',
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
          category: { type: 'string' },
          description: { type: 'string' },
          createdAt: { type: 'string' },
          updatedAt: { type: 'string' },
        },
      },
    },
  })
  async findAll(
    @Request() req,
    @Query('year', new ParseIntPipe({ optional: true })) year?: number,
  ) {
    return this.unexpectedExpensesService.findAll(req.user.id, year);
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Get unexpected expenses statistics',
    description: 'Get statistics about unexpected expenses (total, count, average)',
  })
  @ApiQuery({
    name: 'year',
    description: 'Filter by year',
    type: Number,
    required: false,
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
        average: { type: 'number' },
      },
    },
  })
  async getStatistics(
    @Request() req,
    @Query('year', new ParseIntPipe({ optional: true })) year?: number,
  ) {
    return this.unexpectedExpensesService.getStatistics(req.user.id, year);
  }

  @Get('by-category')
  @ApiOperation({
    summary: 'Get unexpected expenses grouped by category',
    description: 'Retrieve unexpected expenses grouped by category with totals',
  })
  @ApiQuery({
    name: 'year',
    description: 'Filter by year',
    type: Number,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Unexpected expenses by category retrieved successfully',
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
  async getByCategory(
    @Request() req,
    @Query('year', new ParseIntPipe({ optional: true })) year?: number,
  ) {
    return this.unexpectedExpensesService.getByCategory(req.user.id, year);
  }

  @Get('recent')
  @ApiOperation({
    summary: 'Get recent unexpected expenses',
    description: 'Retrieve unexpected expenses that occurred in the last few days',
  })
  @ApiQuery({
    name: 'days',
    description: 'Number of days to look back',
    type: Number,
    required: false,
    example: 30,
  })
  @ApiResponse({
    status: 200,
    description: 'Recent unexpected expenses retrieved successfully',
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
          description: { type: 'string' },
        },
      },
    },
  })
  async getRecent(
    @Request() req,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    return this.unexpectedExpensesService.getRecent(req.user.id, days);
  }

  @Get('monthly-data')
  @ApiOperation({
    summary: 'Get monthly data of unexpected expenses',
    description: 'Get monthly breakdown of unexpected expenses for analysis',
  })
  @ApiQuery({
    name: 'months',
    description: 'Number of months to analyze',
    type: Number,
    required: false,
    example: 12,
  })
  @ApiResponse({
    status: 200,
    description: 'Monthly data retrieved successfully',
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
  async getMonthlyData(
    @Request() req,
    @Query('months', new DefaultValuePipe(12), ParseIntPipe) months: number,
  ) {
    return this.unexpectedExpensesService.getMonthlyData(req.user.id, months);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get unexpected expense by ID',
    description: 'Retrieve a specific unexpected expense by its ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Unexpected expense ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Unexpected expense retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        userId: { type: 'string' },
        label: { type: 'string' },
        amount: { type: 'number' },
        date: { type: 'string', format: 'date-time' },
        category: { type: 'string' },
        description: { type: 'string' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Unexpected expense not found',
  })
  async findOne(
    @Request() req, 
    @Param('id', ParseUUIDPipe) id: string
  ) {
    return this.unexpectedExpensesService.findOne(req.user.id, id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update unexpected expense',
    description: 'Update an existing unexpected expense',
  })
  @ApiParam({
    name: 'id',
    description: 'Unexpected expense ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Unexpected expense updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        userId: { type: 'string' },
        label: { type: 'string' },
        amount: { type: 'number' },
        date: { type: 'string', format: 'date-time' },
        category: { type: 'string' },
        description: { type: 'string' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or date in the future',
  })
  @ApiResponse({
    status: 404,
    description: 'Unexpected expense not found',
  })
  async update(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUnexpectedExpenseDto: UpdateUnexpectedExpenseDto,
  ) {
    return this.unexpectedExpensesService.update(req.user.id, id, updateUnexpectedExpenseDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete unexpected expense',
    description: 'Delete an existing unexpected expense',
  })
  @ApiParam({
    name: 'id',
    description: 'Unexpected expense ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Unexpected expense deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Unexpected expense successfully deleted' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Unexpected expense not found',
  })
  async remove(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.unexpectedExpensesService.remove(req.user.id, id);
  }
}
