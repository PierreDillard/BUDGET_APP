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
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto, UpdateExpenseDto } from './dto/expense.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Expenses')
@Controller('expenses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new expense',
    description: 'Add a new recurring expense to the user\'s budget',
  })
  @ApiResponse({
    status: 201,
    description: 'Expense successfully created',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        userId: { type: 'string' },
        label: { type: 'string' },
        amount: { type: 'number' },
        dayOfMonth: { type: 'number' },
        category: { type: 'string' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async create(@Request() req, @Body() createExpenseDto: CreateExpenseDto) {
    return this.expensesService.create(createExpenseDto, req.user.id);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all user expenses',
    description: 'Retrieve all recurring expenses for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Expenses retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          label: { type: 'string' },
          amount: { type: 'number' },
          dayOfMonth: { type: 'number' },
          category: { type: 'string' },
          createdAt: { type: 'string' },
          updatedAt: { type: 'string' },
        },
      },
    },
  })
  async findAll(@Request() req) {
    return this.expensesService.findAll(req.user.id);
  }

  @Get('total')
  @ApiOperation({
    summary: 'Get total monthly expenses',
    description: 'Calculate the total monthly expenses for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Total expenses calculated successfully',
    schema: {
      type: 'object',
      properties: {
        totalExpenses: { type: 'number', example: 1250.75 },
      },
    },
  })
  async getTotalExpenses(@Request() req) {
    const totalExpenses = await this.expensesService.getTotalExpenses(req.user.id);
    return { totalExpenses };
  }

  @Get('by-category')
  @ApiOperation({
    summary: 'Get expenses grouped by category',
    description: 'Retrieve expenses grouped by category with totals',
  })
  @ApiResponse({
    status: 200,
    description: 'Expenses by category retrieved successfully',
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
  async getExpensesByCategory(@Request() req) {
    return this.expensesService.getExpensesByCategory(req.user.id);
  }

  @Get('upcoming')
  @ApiOperation({
    summary: 'Get upcoming expenses',
    description: 'Retrieve expenses that are due in the next few days',
  })
  @ApiQuery({
    name: 'days',
    description: 'Number of days to look ahead',
    type: Number,
    required: false,
    example: 7,
  })
  @ApiResponse({
    status: 200,
    description: 'Upcoming expenses retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          label: { type: 'string' },
          amount: { type: 'number' },
          dayOfMonth: { type: 'number' },
          category: { type: 'string' },
          daysUntilDue: { type: 'number' },
        },
      },
    },
  })
  async getUpcomingExpenses(
    @Request() req,
    @Query('days', new DefaultValuePipe(7), ParseIntPipe) days: number,
  ) {
    return this.expensesService.getUpcomingExpenses(req.user.id, days);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get expense by ID',
    description: 'Retrieve a specific expense by its ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Expense ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Expense retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        userId: { type: 'string' },
        label: { type: 'string' },
        amount: { type: 'number' },
        dayOfMonth: { type: 'number' },
        category: { type: 'string' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Expense not found',
  })
  async findOne(
    @Request() req, 
    @Param('id', ParseUUIDPipe) id: string
  ) {
    return this.expensesService.findOne(req.user.id, id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update expense',
    description: 'Update an existing expense',
  })
  @ApiParam({
    name: 'id',
    description: 'Expense ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Expense updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        userId: { type: 'string' },
        label: { type: 'string' },
        amount: { type: 'number' },
        dayOfMonth: { type: 'number' },
        category: { type: 'string' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 404,
    description: 'Expense not found',
  })
  async update(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
  ) {
    return this.expensesService.update(id, updateExpenseDto, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete expense',
    description: 'Delete an existing expense',
  })
  @ApiParam({
    name: 'id',
    description: 'Expense ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Expense deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Expense successfully deleted' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Expense not found',
  })
  async remove(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.expensesService.remove(req.user.id, id);
  }
}