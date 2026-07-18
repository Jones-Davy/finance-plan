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

const MONTH_KEY_PATTERN = /^\d{4}-\d{2}$/

function buildRoomPayload(state: BudgetState, monthKey: string): BudgetState {
  return { ...state, viewMonthKey: monthKey }
}

function loadInitialState(monthKey: string): BudgetState {
  const roomId = readRoomIdFromUrl()

  if (roomId && canUseCloudSync()) {
    return {
      monthlyIncome: 0,
      expensesByMonth: ensureMonthExpenses({}, monthKey),
      goals: [],
      transactions: [],
      viewMonthKey: monthKey,
    }
  }

  const local = loadBudget()
  const shared = readSharePlanFromUrl()
  const base = !shared ? local : sharedPlanToState(shared, local.transactions)

  return {
    ...base,
    expensesByMonth: ensureMonthExpenses(base.expensesByMonth, monthKey),
    viewMonthKey: base.viewMonthKey && MONTH_KEY_PATTERN.test(base.viewMonthKey) ? base.viewMonthKey : monthKey,
  }
}

export function useBudget() {
  const [initialMonthKey] = useState(() => {
    if (readRoomIdFromUrl() && canUseCloudSync()) {
      return loadViewMonthKey()
    }
    const local = loadBudget()
    if (local.viewMonthKey && MONTH_KEY_PATTERN.test(local.viewMonthKey)) {
      return local.viewMonthKey
    }
    return loadViewMonthKey()
  })
  const [monthKey, setMonthKeyState] = useState(initialMonthKey)
  const [roomId, setRoomIdState] = useState<string | null>(() => readRoomIdFromUrl())
  const [state, setState] = useState(() => loadInitialState(initialMonthKey))
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>('idle')
  const [isLegacySharedPlan] = useState(
    () => readSharePlanFromUrl() !== null && !readRoomIdFromUrl(),
  )
  const monthKeyRef = useRef(monthKey)
  const roomHydratedRef = useRef(!readRoomIdFromUrl() || !canUseCloudSync())
  const skipCloudSaveRef = useRef(false)
  const lastPushedAtRef = useRef<string | null>(null)
  const cloudSyncEnabled = canUseCloudSync() && Boolean(roomId)

  monthKeyRef.current = monthKey

  const applyRemoteState = useCallback((data: BudgetState, updatedAt: string) => {
    skipCloudSaveRef.current = true
    const remoteMonth =
      data.viewMonthKey && MONTH_KEY_PATTERN.test(data.viewMonthKey)
        ? data.viewMonthKey
        : monthKeyRef.current

    if (remoteMonth !== monthKeyRef.current) {
      setMonthKeyState(remoteMonth)
      saveViewMonthKey(remoteMonth)
    }

    setState({
      ...data,
      viewMonthKey: remoteMonth,
      expensesByMonth: ensureMonthExpenses(data.expensesByMonth, remoteMonth),
    })
    lastPushedAtRef.current = updatedAt
    roomHydratedRef.current = true
    setSyncStatus('saved')
  }, [])

  const setMonthKey = useCallback((nextMonthKey: string) => {
    if (!MONTH_KEY_PATTERN.test(nextMonthKey)) return
    setMonthKeyState(nextMonthKey)
    saveViewMonthKey(nextMonthKey)
    setState((current) => ({ ...current, viewMonthKey: nextMonthKey }))
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
    roomHydratedRef.current = false
    setSyncStatus('loading')

    loadRoomState(roomId)
      .then((row) => {
        if (cancelled) return
        if (!row) {
          roomHydratedRef.current = true
          setSyncStatus('error')
          return
        }

        applyRemoteState(row.data, row.updated_at)
      })
      .catch(() => {
        if (!cancelled) {
          roomHydratedRef.current = true
          setSyncStatus('error')
        }
      })

    const unsubscribe = subscribeRoomState(roomId, (row) => {
      if (row.updated_at === lastPushedAtRef.current) return
      applyRemoteState(row.data, row.updated_at)
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [roomId, applyRemoteState])

  const roomPayload = useMemo(
    () => buildRoomPayload(state, monthKey),
    [state, monthKey],
  )

  useEffect(() => {
    if (!cloudSyncEnabled || !roomId || !roomHydratedRef.current) return

    if (skipCloudSaveRef.current) {
      skipCloudSaveRef.current = false
      return
    }

    setSyncStatus('saving')
    const timer = window.setTimeout(() => {
      saveRoomState(roomId, roomPayload)
        .then((updatedAt) => {
          lastPushedAtRef.current = updatedAt
          setSyncStatus('saved')
        })
        .catch(() => {
          setSyncStatus('error')
        })
    }, 900)

    return () => window.clearTimeout(timer)
  }, [roomPayload, roomId, cloudSyncEnabled])

  const createSharedRoom = useCallback(async () => {
    const payload = buildRoomPayload(state, monthKeyRef.current)
    const id = await createRoom(payload)
    skipCloudSaveRef.current = true
    roomHydratedRef.current = true
    setRoomIdState(id)
    setRoomInUrl(id)
    lastPushedAtRef.current = await saveRoomState(id, payload)
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
