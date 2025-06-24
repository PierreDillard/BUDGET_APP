import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing data
  await prisma.refresh_tokens.deleteMany({});
  await prisma.planned_expenses.deleteMany({});
  await prisma.rec_expenses.deleteMany({});
  await prisma.rec_incomes.deleteMany({});
  await prisma.users.deleteMany({});

  // Create demo user
  const hashedPassword = await bcrypt.hash('demo123', 10);
  
  const demoUser = await prisma.users.create({
    data: {
      id: '1',
      email: 'demo@budgetapp.com',
      password_hash: hashedPassword,
      currency: 'EUR',
      month_start_day: 1,
      margin_pct: 5,
      notification: true,
      updated_at: new Date(),
    },
  });

  console.log('👤 Created demo user:', demoUser.email);

  // Create demo incomes
  const incomes = await prisma.rec_incomes.createMany({
    data: [
      {
        id: '1',
        user_id: demoUser.id,
        label: 'Salaire principal',
        amount: 2800,
        day_of_month: 28,
        category: 'salary',
        updated_at: new Date(),
      },
      {
        id: '2',
        user_id: demoUser.id,
        label: 'Freelance web',
        amount: 500,
        day_of_month: 15,
        category: 'freelance',
        updated_at: new Date(),
      },
      {
        id: '3',
        user_id: demoUser.id,
        label: 'Allocations CAF',
        amount: 150,
        day_of_month: 5,
        category: 'allowance',
        updated_at: new Date(),
      },
    ],
  });

  console.log('💰 Created', incomes.count, 'demo incomes');

  // Create demo expenses
  const expenses = await prisma.rec_expenses.createMany({
    data: [
      {
        id: '1',
        user_id: demoUser.id,
        label: 'Loyer appartement',
        amount: 900,
        day_of_month: 1,
        category: 'rent',
        updated_at: new Date(),
      },
      {
        id: '2',
        user_id: demoUser.id,
        label: 'Factures EDF/Gaz',
        amount: 120,
        day_of_month: 3,
        category: 'utilities',
        updated_at: new Date(),
      },
      {
        id: '3',
        user_id: demoUser.id,
        label: 'Assurance habitation',
        amount: 85,
        day_of_month: 10,
        category: 'insurance',
        updated_at: new Date(),
      },
      {
        id: '4',
        user_id: demoUser.id,
        label: 'Transport en commun',
        amount: 70,
        day_of_month: 1,
        category: 'transport',
        updated_at: new Date(),
      },
      {
        id: '5',
        user_id: demoUser.id,
        label: 'Téléphone mobile',
        amount: 35,
        day_of_month: 15,
        category: 'subscription',
        updated_at: new Date(),
      },
      {
        id: '6',
        user_id: demoUser.id,
        label: 'Mutuelle santé',
        amount: 45,
        day_of_month: 5,
        category: 'health',
        updated_at: new Date(),
      },
    ],
  });

  console.log('💸 Created', expenses.count, 'demo expenses');

  // Create demo planned expenses
  const plannedExpenses = await prisma.planned_expenses.createMany({
    data: [
      {
        id: '1',
        user_id: demoUser.id,
        label: 'Voyage d\'été',
        amount: 1500,
        date: new Date('2025-07-20'),
        spent: false,
        category: 'travel',
        updated_at: new Date(),
      },
      {
        id: '2',
        user_id: demoUser.id,
        label: 'Nouveau laptop',
        amount: 800,
        date: new Date('2025-06-15'),
        spent: false,
        category: 'electronics',
        updated_at: new Date(),
      },
      {
        id: '3',
        user_id: demoUser.id,
        label: 'Rendez-vous dentiste',
        amount: 200,
        date: new Date('2025-06-10'),
        spent: true,
        category: 'health',
        updated_at: new Date(),
      },
      {
        id: '4',
        user_id: demoUser.id,
        label: 'Cadeaux de Noël',
        amount: 400,
        date: new Date('2025-12-20'),
        spent: false,
        category: 'gift',
        updated_at: new Date(),
      },
      {
        id: '5',
        user_id: demoUser.id,
        label: 'Cours de langue',
        amount: 300,
        date: new Date('2025-09-01'),
        spent: false,
        category: 'education',
        updated_at: new Date(),
      },
    ],
  });

  console.log('📅 Created', plannedExpenses.count, 'demo planned expenses');

  // Calculate and display summary
  const totalIncome = 2800 + 500 + 150;
  const totalExpenses = 900 + 120 + 85 + 70 + 35 + 45;
  const monthlyBalance = totalIncome - totalExpenses;
  
  console.log('');
  console.log('📊 Demo Data Summary:');
  console.log('├── Monthly Income:', totalIncome, '€');
  console.log('├── Monthly Expenses:', totalExpenses, '€');
  console.log('├── Monthly Balance:', monthlyBalance, '€');
  console.log('└── Planned Expenses: 5 items');
  console.log('');
  console.log('🎯 Demo login credentials:');
  console.log('├── Email: demo@budgetapp.com');
  console.log('└── Password: demo123');
  console.log('');
  console.log('✅ Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });