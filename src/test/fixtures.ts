import type { ActualTransaction, BudgetState, Expense, Goal } from '../types'

export function createExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 'exp-1',
    name: 'Продукты',
    amount: 15000,
    category: 'food',
    essential: true,
    ...overrides,
  }
}

export function createTransaction(overrides: Partial<ActualTransaction> = {}): ActualTransaction {
  return {
    id: 'tx-1',
    name: 'Хлеб',
    amount: 100,
    date: '2026-07-18',
    category: 'food',
    bucket: 'need',
    ...overrides,
  }
}

export function createGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: 'goal-1',
    name: 'Отпуск',
    targetAmount: 120000,
    savedAmount: 20000,
    deadline: '2026-12-31',
    ...overrides,
  }
}

export function createBudgetState(overrides: Partial<BudgetState> = {}): BudgetState {
  return {
    monthlyIncome: 100000,
    expensesByMonth: {
      '2026-07': [
        createExpense(),
        createExpense({
          id: 'exp-2',
          name: 'Развлечения',
          amount: 5000,
          category: 'entertainment',
          essential: false,
        }),
      ],
    },
    goals: [createGoal()],
    transactions: [
      createTransaction(),
      createTransaction({
        id: 'tx-2',
        name: 'Кино',
        amount: 800,
        category: 'entertainment',
        bucket: 'want',
      }),
      createTransaction({
        id: 'tx-3',
        name: 'Август',
        amount: 500,
        date: '2026-08-02',
        category: 'food',
        bucket: 'need',
      }),
    ],
    viewMonthKey: '2026-07',
    ...overrides,
  }
}
