export type ExpenseCategory =
  | 'housing'
  | 'food'
  | 'transport'
  | 'utilities'
  | 'health'
  | 'entertainment'
  | 'subscriptions'
  | 'savings'
  | 'debts'
  | 'other'

export interface Expense {
  id: string
  name: string
  amount: number
  category: ExpenseCategory
  essential: boolean
}

export interface Goal {
  id: string
  name: string
  targetAmount: number
  savedAmount: number
  deadline: string
}

export type SpendingBucket = 'need' | 'want' | 'savings'

export interface ActualTransaction {
  id: string
  date: string
  name: string
  amount: number
  category: ExpenseCategory
  bucket: SpendingBucket
}

export interface BudgetState {
  /** @deprecated используйте incomeByMonth */
  monthlyIncome?: number
  incomeByMonth?: Record<string, number>
  expensesByMonth: Record<string, Expense[]>
  goals: Goal[]
  transactions: ActualTransaction[]
  roomName?: string
}

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  housing: 'Жильё',
  food: 'Еда',
  transport: 'Транспорт',
  utilities: 'Коммуналка',
  health: 'Здоровье',
  entertainment: 'Развлечения',
  subscriptions: 'Подписки',
  savings: 'Накопления',
  debts: 'Долги',
  other: 'Прочее',
}

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  housing: '#6366f1',
  food: '#22c55e',
  transport: '#f59e0b',
  utilities: '#06b6d4',
  health: '#ec4899',
  entertainment: '#a855f7',
  subscriptions: '#64748b',
  savings: '#14b8a6',
  debts: '#f97316',
  other: '#94a3b8',
}

export const DEFAULT_EXPENSES: Omit<Expense, 'id'>[] = [
  { name: 'Аренда / ипотека', amount: 0, category: 'housing', essential: true },
  { name: 'Продукты', amount: 0, category: 'food', essential: true },
  { name: 'Транспорт', amount: 0, category: 'transport', essential: true },
  { name: 'Коммунальные услуги', amount: 0, category: 'utilities', essential: true },
  { name: 'Связь и интернет', amount: 0, category: 'subscriptions', essential: true },
  { name: 'Медицина', amount: 0, category: 'health', essential: false },
  { name: 'Развлечения', amount: 0, category: 'entertainment', essential: false },
  { name: 'Подписки', amount: 0, category: 'subscriptions', essential: false },
]

export const CATEGORY_BUCKET: Record<ExpenseCategory, SpendingBucket> = {
  housing: 'need',
  food: 'need',
  transport: 'need',
  utilities: 'need',
  health: 'need',
  entertainment: 'want',
  subscriptions: 'want',
  savings: 'savings',
  debts: 'need',
  other: 'want',
}

export const BUCKET_LABELS: Record<SpendingBucket, string> = {
  need: 'Необходимое (50%)',
  want: 'Желания (30%)',
  savings: 'Накопления (20%)',
}

export const BUCKET_SHORT_LABELS: Record<SpendingBucket, string> = {
  need: 'Необходимое',
  want: 'Желания',
  savings: 'Накопления',
}
