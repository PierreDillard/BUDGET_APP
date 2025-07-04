import { Module } from '@nestjs/common';
import { ProjectBudgetsService } from './project-budgets.service';
import { ProjectBudgetsController } from './project-budgets.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProjectBudgetsController],
  providers: [ProjectBudgetsService],
  exports: [ProjectBudgetsService]
})
export class ProjectBudgetsModule {}
