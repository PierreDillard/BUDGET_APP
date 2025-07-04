import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  UseGuards,
  Request
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjectBudgetsService } from './project-budgets.service';
import { CreateProjectBudgetDto, UpdateProjectBudgetDto, AddContributionDto, MonthlyAllocationDto } from './project-budgets.dto';

@Controller('project-budgets')
@UseGuards(JwtAuthGuard)
export class ProjectBudgetsController {
  constructor(private readonly projectBudgetsService: ProjectBudgetsService) {}

  @Post()
  create(@Request() req, @Body() createProjectBudgetDto: CreateProjectBudgetDto) {
    return this.projectBudgetsService.create(req.user.id, createProjectBudgetDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.projectBudgetsService.findAll(req.user.id);
  }

  @Get('stats')
  getStats(@Request() req) {
    return this.projectBudgetsService.getStats(req.user.id);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.projectBudgetsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateProjectBudgetDto: UpdateProjectBudgetDto
  ) {
    return this.projectBudgetsService.update(id, req.user.id, updateProjectBudgetDto);
  }

  @Put(':id')
  updatePut(
    @Request() req,
    @Param('id') id: string,
    @Body() updateProjectBudgetDto: UpdateProjectBudgetDto
  ) {
    return this.projectBudgetsService.update(id, req.user.id, updateProjectBudgetDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.projectBudgetsService.remove(id, req.user.id);
  }

  @Post(':id/contributions')
  addContribution(
    @Request() req,
    @Param('id') id: string,
    @Body() addContributionDto: AddContributionDto
  ) {
    return this.projectBudgetsService.addContribution(id, req.user.id, addContributionDto);
  }

  @Post(':id/monthly-allocation')
  allocateMonthlyAmount(
    @Request() req,
    @Param('id') id: string,
    @Body() monthlyAllocationDto: MonthlyAllocationDto
  ) {
    return this.projectBudgetsService.allocateMonthlyAmount(id, req.user.id, monthlyAllocationDto);
  }

  @Patch(':id/complete')
  complete(@Request() req, @Param('id') id: string) {
    return this.projectBudgetsService.complete(id, req.user.id);
  }

  @Patch(':id/pause')
  pause(@Request() req, @Param('id') id: string) {
    return this.projectBudgetsService.pause(id, req.user.id);
  }

  @Patch(':id/resume')
  resume(@Request() req, @Param('id') id: string) {
    return this.projectBudgetsService.resume(id, req.user.id);
  }
}
