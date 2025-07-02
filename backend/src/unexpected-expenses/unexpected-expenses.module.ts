import { Module } from '@nestjs/common';
import { UnexpectedExpensesService } from './unexpected-expenses.service';
import { UnexpectedExpensesController } from './unexpected-expenses.controller';

@Module({
  controllers: [UnexpectedExpensesController],
  providers: [UnexpectedExpensesService],
  exports: [UnexpectedExpensesService],
})
export class UnexpectedExpensesModule {}