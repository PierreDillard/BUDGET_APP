import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Retrieve the profile information of the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        email: { type: 'string' },
        currency: { type: 'string' },
        monthStartDay: { type: 'number' },
        marginPct: { type: 'number' },
        notification: { type: 'boolean' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
      },
    },
  })
  async getProfile(@Request() req) {
    return this.usersService.findById(req.user.id);
  }

  @Patch('me')
  @ApiOperation({
    summary: 'Update user profile',
    description: 'Update the profile information of the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        email: { type: 'string' },
        currency: { type: 'string' },
        monthStartDay: { type: 'number' },
        marginPct: { type: 'number' },
        notification: { type: 'boolean' },
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
    description: 'User not found',
  })
  async updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(req.user.id, updateUserDto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete user account',
    description: 'Permanently delete the authenticated user account and all associated data',
  })
  @ApiResponse({
    status: 200,
    description: 'User account successfully deleted',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'User account successfully deleted' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async deleteAccount(@Request() req) {
    return this.usersService.delete(req.user.id);
  }

  @Get('me/stats')
  @ApiOperation({
    summary: 'Get user statistics',
    description: 'Get statistics about the user\'s financial data',
  })
  @ApiResponse({
    status: 200,
    description: 'User statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        counts: {
          type: 'object',
          properties: {
            incomes: { type: 'number' },
            expenses: { type: 'number' },
            plannedExpenses: { type: 'number' },
          },
        },
        totals: {
          type: 'object',
          properties: {
            monthlyIncome: { type: 'number' },
            monthlyExpenses: { type: 'number' },
            totalPlanned: { type: 'number' },
            totalSpent: { type: 'number' },
            monthlyBalance: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getUserStats(@Request() req) {
    return this.usersService.getUserStats(req.user.id);
  }
}