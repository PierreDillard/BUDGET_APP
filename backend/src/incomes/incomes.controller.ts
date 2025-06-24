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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { IncomesService } from './incomes.service';
import { CreateIncomeDto, UpdateIncomeDto } from './dto/income.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Incomes')
@Controller('incomes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class IncomesController {
  constructor(private readonly incomesService: IncomesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new income',
    description: 'Add a new recurring income to the user\'s budget',
  })
  @ApiResponse({
    status: 201,
    description: 'Income successfully created',
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
  async create(@Request() req, @Body() createIncomeDto: CreateIncomeDto) {
    return this.incomesService.create(req.user.id, createIncomeDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all user incomes',
    description: 'Retrieve all recurring incomes for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Incomes retrieved successfully',
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
    return this.incomesService.findAll(req.user.id);
  }

  @Get('total')
  @ApiOperation({
    summary: 'Get total monthly income',
    description: 'Calculate the total monthly income for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Total income calculated successfully',
    schema: {
      type: 'object',
      properties: {
        totalIncome: { type: 'number', example: 3500.50 },
      },
    },
  })
  async getTotalIncome(@Request() req) {
    const totalIncome = await this.incomesService.getTotalIncome(req.user.id);
    return { totalIncome };
  }

  @Get('by-category')
  @ApiOperation({
    summary: 'Get incomes grouped by category',
    description: 'Retrieve incomes grouped by category with totals',
  })
  @ApiResponse({
    status: 200,
    description: 'Incomes by category retrieved successfully',
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
  async getIncomesByCategory(@Request() req) {
    return this.incomesService.getIncomesByCategory(req.user.id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get income by ID',
    description: 'Retrieve a specific income by its ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Income ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Income retrieved successfully',
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
    description: 'Income not found',
  })
  async findOne(
    @Request() req, 
    @Param('id', ParseUUIDPipe) id: string
  ) {
    return this.incomesService.findOne(req.user.id, id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update income',
    description: 'Update an existing income',
  })
  @ApiParam({
    name: 'id',
    description: 'Income ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Income updated successfully',
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
    description: 'Income not found',
  })
  async update(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateIncomeDto: UpdateIncomeDto,
  ) {
    return this.incomesService.update(req.user.id, id, updateIncomeDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete income',
    description: 'Delete an existing income',
  })
  @ApiParam({
    name: 'id',
    description: 'Income ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Income deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Income successfully deleted' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Income not found',
  })
  async remove(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.incomesService.remove(req.user.id, id);
  }
}