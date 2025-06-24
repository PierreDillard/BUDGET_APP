import { Module } from '@nestjs/common';
import { PlannedExpensesService } from './planned-expenses.service';
import { PlannedExpensesController } from './planned-expenses.controller';

@Module({
  controllers: [PlannedExpensesController],
  providers: [PlannedExpensesService],
  exports: [PlannedExpensesService],
})
export class PlannedExpensesModule {}