import { Module } from '@nestjs/common';
import { BalanceService } from './balance.service';
import { BalanceController } from './balance.controller';
import { IncomesModule } from '../incomes/incomes.module';
import { ExpensesModule } from '../expenses/expenses.module';
import { PlannedExpensesModule } from '../planned-expenses/planned-expenses.module';

@Module({
  imports: [IncomesModule, ExpensesModule, PlannedExpensesModule],
  controllers: [BalanceController],
  providers: [BalanceService],
  exports: [BalanceService],
})
export class BalanceModule {}