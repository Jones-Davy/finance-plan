import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type {
  ActualTransaction,
  BudgetState,
  Expense,
  ExpenseCategory,
  Goal,
} from '../types'
import { buildBudgetSummary } from '../utils/calculations'
import { ensureMonthExpenses, getExpensesForMonth, collectMonthKeys } from '../utils/expenses'
import {
  createDefaultState,
  loadBudget,
  loadViewMonthKey,
  saveBudget,
  saveViewMonthKey,
} from '../utils/storage'
import { readSharePlanFromUrl, sharedPlanToState, syncSharePlanToUrl } from '../utils/share'
import { defaultGoalDeadline } from '../utils/dates'
import {
  canUseCloudSync,
  createRoom,
  loadRoomState,
  saveRoomState,
  subscribeRoomState,
  type CloudSyncStatus,
} from '../utils/roomSync'
import { readRoomIdFromUrl, setRoomInUrl } from '../utils/roomUrl'

function loadInitialState(monthKey: string): BudgetState {
  const local = loadBudget()
  const roomId = readRoomIdFromUrl()

  if (roomId && canUseCloudSync()) {
    return {
      ...local,
      expensesByMonth: ensureMonthExpenses(local.expensesByMonth, monthKey),
    }
  }

  const shared = readSharePlanFromUrl()
  const base = !shared ? local : sharedPlanToState(shared, local.transactions)

  return {
    ...base,
    expensesByMonth: ensureMonthExpenses(base.expensesByMonth, monthKey),
  }
}

export function useBudget() {
  const [initialMonthKey] = useState(() => loadViewMonthKey())
  const [monthKey, setMonthKeyState] = useState(initialMonthKey)
  const [roomId, setRoomIdState] = useState<string | null>(() => readRoomIdFromUrl())
  const [state, setState] = useState(() => loadInitialState(initialMonthKey))
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>('idle')
  const [isLegacySharedPlan] = useState(
    () => readSharePlanFromUrl() !== null && !readRoomIdFromUrl(),
  )
  const monthKeyRef = useRef(monthKey)
  const applyingRemoteRef = useRef(false)
  const lastPushedAtRef = useRef<string | null>(null)
  const cloudSyncEnabled = canUseCloudSync() && Boolean(roomId)

  monthKeyRef.current = monthKey

  const setMonthKey = useCallback((nextMonthKey: string) => {
    if (!/^\d{4}-\d{2}$/.test(nextMonthKey)) return
    setMonthKeyState(nextMonthKey)
    saveViewMonthKey(nextMonthKey)
  }, [])

  useEffect(() => {
    setState((current) => {
      const nextExpensesByMonth = ensureMonthExpenses(current.expensesByMonth, monthKey)
      if (nextExpensesByMonth === current.expensesByMonth) return current
      return { ...current, expensesByMonth: nextExpensesByMonth }
    })
  }, [monthKey])

  useEffect(() => {
    saveBudget(state)
  }, [state])

  useEffect(() => {
    if (cloudSyncEnabled) return

    const timer = window.setTimeout(() => {
      syncSharePlanToUrl(state)
    }, 300)

    return () => window.clearTimeout(timer)
  }, [state, cloudSyncEnabled])

  useEffect(() => {
    if (!roomId || !canUseCloudSync()) return

    let cancelled = false
    setSyncStatus('loading')

    loadRoomState(roomId)
      .then((row) => {
        if (cancelled || !row) {
          if (!cancelled) setSyncStatus(row ? 'saved' : 'error')
          return
        }

        applyingRemoteRef.current = true
        setState({
          ...row.data,
          expensesByMonth: ensureMonthExpenses(row.data.expensesByMonth, monthKeyRef.current),
        })
        applyingRemoteRef.current = false
        lastPushedAtRef.current = row.updated_at
        setSyncStatus('saved')
      })
      .catch(() => {
        if (!cancelled) setSyncStatus('error')
      })

    const unsubscribe = subscribeRoomState(roomId, (row) => {
      if (row.updated_at === lastPushedAtRef.current) return
      applyingRemoteRef.current = true
      setState({
        ...row.data,
        expensesByMonth: ensureMonthExpenses(row.data.expensesByMonth, monthKeyRef.current),
      })
      applyingRemoteRef.current = false
      setSyncStatus('saved')
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [roomId])

  useEffect(() => {
    if (!cloudSyncEnabled || !roomId || applyingRemoteRef.current) return

    setSyncStatus('saving')
    const timer = window.setTimeout(() => {
      saveRoomState(roomId, state)
        .then((updatedAt) => {
          lastPushedAtRef.current = updatedAt
          setSyncStatus('saved')
        })
        .catch(() => {
          setSyncStatus('error')
        })
    }, 900)

    return () => window.clearTimeout(timer)
  }, [state, roomId, cloudSyncEnabled])

  const createSharedRoom = useCallback(async () => {
    const id = await createRoom(state)
    setRoomIdState(id)
    setRoomInUrl(id)
    lastPushedAtRef.current = await saveRoomState(id, state)
    setSyncStatus('saved')
    return id
  }, [state])

  const monthExpenses = useMemo(
    () => getExpensesForMonth(state.expensesByMonth, monthKey),
    [state.expensesByMonth, monthKey],
  )

  const monthKeys = useMemo(
    () => collectMonthKeys(state.expensesByMonth, state.transactions, monthKey),
    [state.expensesByMonth, state.transactions, monthKey],
  )

  const summary = useMemo(() => buildBudgetSummary(state, monthKey), [state, monthKey])

  const monthTransactions = useMemo(
    () => state.transactions.filter((t) => t.date.startsWith(monthKey)),
    [state.transactions, monthKey],
  )

  const setIncome = useCallback((monthlyIncome: number) => {
    setState((s) => ({ ...s, monthlyIncome }))
  }, [])

  const updateExpense = useCallback((id: string, patch: Partial<Expense>) => {
    setState((s) => {
      const key = monthKeyRef.current
      return {
        ...s,
        expensesByMonth: {
          ...s.expensesByMonth,
          [key]: (s.expensesByMonth[key] ?? []).map((expense) =>
            expense.id === id ? { ...expense, ...patch } : expense,
          ),
        },
      }
    })
  }, [])

  const addExpense = useCallback(
    (category: ExpenseCategory = 'other', essential = true) => {
      setState((s) => {
        const key = monthKeyRef.current
        return {
          ...s,
          expensesByMonth: {
            ...s.expensesByMonth,
            [key]: [
              ...(s.expensesByMonth[key] ?? []),
              {
                id: uuidv4(),
                name: '',
                amount: 0,
                category,
                essential,
              },
            ],
          },
        }
      })
    },
    [],
  )

  const removeExpense = useCallback((id: string) => {
    setState((s) => {
      const key = monthKeyRef.current
      return {
        ...s,
        expensesByMonth: {
          ...s.expensesByMonth,
          [key]: (s.expensesByMonth[key] ?? []).filter((expense) => expense.id !== id),
        },
      }
    })
  }, [])

  const addTransaction = useCallback(
    (data: Omit<ActualTransaction, 'id'>) => {
      setState((s) => ({
        ...s,
        transactions: [{ ...data, id: uuidv4() }, ...s.transactions],
      }))
    },
    [],
  )

  const updateTransaction = useCallback((id: string, patch: Partial<ActualTransaction>) => {
    setState((s) => ({
      ...s,
      transactions: s.transactions.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }))
  }, [])

  const removeTransaction = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      transactions: s.transactions.filter((t) => t.id !== id),
    }))
  }, [])

  const addGoal = useCallback(() => {
    setState((s) => ({
      ...s,
      goals: [
        ...s.goals,
        {
          id: uuidv4(),
          name: '',
          targetAmount: 0,
          savedAmount: 0,
          deadline: defaultGoalDeadline(),
        },
      ],
    }))
  }, [])

  const updateGoal = useCallback((id: string, patch: Partial<Goal>) => {
    setState((s) => ({
      ...s,
      goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    }))
  }, [])

  const removeGoal = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      goals: s.goals.filter((g) => g.id !== id),
    }))
  }, [])

  const resetBudget = useCallback(() => {
    if (confirm('Сбросить все данные и вернуть шаблон?')) {
      setState(createDefaultState())
    }
  }, [])

  return {
    state,
    summary,
    monthKey,
    setMonthKey,
    monthKeys,
    monthExpenses,
    monthTransactions,
    roomId,
    cloudSyncEnabled,
    cloudAvailable: canUseCloudSync(),
    syncStatus,
    createSharedRoom,
    setIncome,
    updateExpense,
    addExpense,
    removeExpense,
    addTransaction,
    updateTransaction,
    removeTransaction,
    addGoal,
    updateGoal,
    removeGoal,
    resetBudget,
    isLegacySharedPlan,
    isRoomMode: Boolean(roomId),
  }
}
