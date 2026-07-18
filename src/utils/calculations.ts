import type {
  ActualTransaction,
  BudgetState,
  Expense,
  ExpenseCategory,
  Goal,
  SpendingBucket,
} from '../types'
import { CATEGORY_LABELS } from '../types'
import { formatRuMonth, getMonthKey, getTodayISO } from './dates'

export { getMonthKey } from './dates'

export interface CategorySummary {
  category: ExpenseCategory
  label: string
  amount: number
  percent: number
}

export interface PlanVsActualRow {
  category: ExpenseCategory
  label: string
  planned: number
  actual: number
  diff: number
}

export interface BucketSummary {
  bucket: SpendingBucket
  label: string
  targetAmount: number
  targetPercent: number
  actualAmount: number
  actualPercent: number
  diff: number
}

export interface BudgetSummary {
  totalExpenses: number
  essentialExpenses: number
  optionalExpenses: number
  remaining: number
  savingsRate: number
  weeklyBudget: number
  dailyBudget: number
  weeklyEssential: number
  weeklyOptional: number
  goalsMonthlyNeed: number
  freeAfterGoals: number
  byCategory: CategorySummary[]
  actualTotal: number
  actualRemaining: number
  planVsActual: PlanVsActualRow[]
  planVsActualDiff: number
  rule503020: BucketSummary[]
}
export function defaultDateForMonth(monthKey: string, reference = new Date()): string {
  const today = getTodayISO(reference)
  const firstDay = `${monthKey}-01`
  const lastDay = lastDayOfMonth(monthKey)

  if (today >= firstDay && today <= lastDay) return today
  if (today < firstDay) return firstDay
  return lastDay
}

export function isDateInMonth(date: string, monthKey: string): boolean {
  return date.startsWith(monthKey)
}

export function lastDayOfMonth(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number)
  const day = new Date(year, month, 0).getDate()
  return `${monthKey}-${String(day).padStart(2, '0')}`
}

export function formatMonthLabel(monthKey: string): string {
  return formatRuMonth(monthKey)
}

export function filterTransactionsByMonth(
  transactions: ActualTransaction[],
  monthKey: string,
): ActualTransaction[] {
  return transactions.filter((t) => t.date.startsWith(monthKey))
}

export function sumTransactions(transactions: ActualTransaction[]): number {
  return transactions.reduce((sum, t) => sum + (t.amount || 0), 0)
}

export function sumTransactionsByBucket(
  transactions: ActualTransaction[],
  bucket: SpendingBucket,
): number {
  return transactions
    .filter((t) => t.bucket === bucket)
    .reduce((sum, t) => sum + (t.amount || 0), 0)
}

export function groupActualByCategory(
  transactions: ActualTransaction[],
): Map<ExpenseCategory, number> {
  const map = new Map<ExpenseCategory, number>()
  for (const t of transactions) {
    if (t.amount <= 0) continue
    map.set(t.category, (map.get(t.category) ?? 0) + t.amount)
  }
  return map
}

export function buildPlanVsActual(
  expenses: Expense[],
  transactions: ActualTransaction[],
): PlanVsActualRow[] {
  const planned = groupByCategory(expenses)
  const spendingTransactions = transactions.filter((t) => t.bucket !== 'savings')
  const actualMap = groupActualByCategory(spendingTransactions)
  const savingsActual = sumTransactionsByBucket(transactions, 'savings')
  const categories = new Set([
    ...planned.map((p) => p.category).filter((c) => c !== 'savings'),
    ...actualMap.keys(),
  ])

  const rows = Array.from(categories)
    .map((category) => {
      const plannedAmount = planned.find((p) => p.category === category)?.amount ?? 0
      const actualAmount = actualMap.get(category) ?? 0
      return {
        category,
        label: CATEGORY_LABELS[category],
        planned: plannedAmount,
        actual: actualAmount,
        diff: plannedAmount - actualAmount,
      }
    })
    .filter((row) => row.planned > 0 || row.actual > 0)

  const savingsPlanned = planned.find((p) => p.category === 'savings')?.amount ?? 0
  if (savingsPlanned > 0 || savingsActual > 0) {
    rows.push({
      category: 'savings',
      label: CATEGORY_LABELS.savings,
      planned: savingsPlanned,
      actual: savingsActual,
      // Для накоплений больше плана — хорошо, поэтому знак наоборот от трат
      diff: savingsActual - savingsPlanned,
    })
  }

  return rows.sort((a, b) => b.actual - a.actual)
}

export function buildRule503020(income: number, transactions: ActualTransaction[]): BucketSummary[] {
  const rules: { bucket: SpendingBucket; label: string; targetPercent: number }[] = [
    { bucket: 'need', label: 'Необходимое', targetPercent: 50 },
    { bucket: 'want', label: 'Желания', targetPercent: 30 },
    { bucket: 'savings', label: 'Накопления', targetPercent: 20 },
  ]

  const needs = sumTransactionsByBucket(transactions, 'need')
  const wants = sumTransactionsByBucket(transactions, 'want')
  const explicitSavings = sumTransactionsByBucket(transactions, 'savings')
  const implicitSavings = Math.max(0, income - needs - wants - explicitSavings)
  const actualSavings = explicitSavings + implicitSavings

  const actualByBucket: Record<SpendingBucket, number> = {
    need: needs,
    want: wants,
    savings: actualSavings,
  }

  return rules.map(({ bucket, label, targetPercent }) => {
    const targetAmount = income > 0 ? (income * targetPercent) / 100 : 0
    const actualAmount = actualByBucket[bucket]
    return {
      bucket,
      label,
      targetAmount,
      targetPercent,
      actualAmount,
      actualPercent: income > 0 ? (actualAmount / income) * 100 : 0,
      diff: targetAmount - actualAmount,
    }
  })
}

export function sumExpenses(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + (e.amount || 0), 0)
}

export function sumEssential(expenses: Expense[]): number {
  return expenses.filter((e) => e.essential).reduce((sum, e) => sum + (e.amount || 0), 0)
}

export function groupByCategory(expenses: Expense[]): CategorySummary[] {
  const total = sumExpenses(expenses)
  const map = new Map<ExpenseCategory, number>()

  for (const expense of expenses) {
    if (expense.amount <= 0) continue
    map.set(expense.category, (map.get(expense.category) ?? 0) + expense.amount)
  }

  return Array.from(map.entries())
    .map(([category, amount]) => ({
      category,
      label: CATEGORY_LABELS[category],
      amount,
      percent: total > 0 ? (amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
}

export function calcGoalsMonthlyNeed(goals: Goal[]): number {
  const now = new Date()
  return goals.reduce((sum, goal) => {
    if (goal.savedAmount >= goal.targetAmount) return sum
    const remaining = goal.targetAmount - goal.savedAmount
    const deadline = new Date(goal.deadline)
    const monthsLeft = Math.max(
      1,
      (deadline.getFullYear() - now.getFullYear()) * 12 +
        (deadline.getMonth() - now.getMonth()) +
        (deadline.getDate() >= now.getDate() ? 0 : -1) +
        1,
    )
    return sum + remaining / monthsLeft
  }, 0)
}

export function buildBudgetSummary(state: BudgetState, monthKey = getMonthKey()): BudgetSummary {
  const monthTransactions = filterTransactionsByMonth(state.transactions, monthKey)
  const monthExpenses = state.expensesByMonth[monthKey] ?? []
  const totalExpenses = sumExpenses(monthExpenses)
  const essentialExpenses = sumEssential(monthExpenses)
  const optionalExpenses = totalExpenses - essentialExpenses
  const remaining = state.monthlyIncome - totalExpenses
  const savingsRate =
    state.monthlyIncome > 0 ? (remaining / state.monthlyIncome) * 100 : 0
  const goalsMonthlyNeed = calcGoalsMonthlyNeed(state.goals)
  const actualTotal = sumTransactions(monthTransactions)
  const actualRemaining = state.monthlyIncome - actualTotal
  const planVsActual = buildPlanVsActual(monthExpenses, monthTransactions)

  return {
    totalExpenses,
    essentialExpenses,
    optionalExpenses,
    remaining,
    savingsRate,
    weeklyBudget: totalExpenses / 4.33,
    dailyBudget: totalExpenses / 30,
    weeklyEssential: essentialExpenses / 4.33,
    weeklyOptional: optionalExpenses / 4.33,
    goalsMonthlyNeed,
    freeAfterGoals: remaining - goalsMonthlyNeed,
    byCategory: groupByCategory(monthExpenses),
    actualTotal,
    actualRemaining,
    planVsActual,
    planVsActualDiff: totalExpenses - actualTotal,
    rule503020: buildRule503020(state.monthlyIncome, monthTransactions),
  }
}

export function goalProgress(goal: Goal): number {
  if (goal.targetAmount <= 0) return 0
  return Math.min(100, (goal.savedAmount / goal.targetAmount) * 100)
}

export function goalMonthsLeft(goal: Goal): number {
  const now = new Date()
  const deadline = new Date(goal.deadline)
  return Math.max(
    0,
    (deadline.getFullYear() - now.getFullYear()) * 12 +
      (deadline.getMonth() - now.getMonth()),
  )
}
