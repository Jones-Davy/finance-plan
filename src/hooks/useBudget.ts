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
import { getIncomeForMonth } from '../utils/income'
import { copyMonthPlan, type CopyMonthPlanOptions } from '../utils/monthPlan'
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
  defaultSavedRoomName,
  loadSavedRooms,
  removeSavedRoomFromList,
  upsertSavedRoom,
  type SavedRoom,
} from '../utils/savedRooms'
import {
  canUseCloudSync,
  createRoom,
  loadRoomState,
  saveRoomState,
  stripLocalOnlyFields,
  subscribeRoomState,
  type CloudSyncStatus,
} from '../utils/roomSync'
import {
  clearRoomFromUrl,
  parseRoomIdFromInput,
  readRoomIdFromUrl,
  setRoomInUrl,
} from '../utils/roomUrl'

const MONTH_KEY_PATTERN = /^\d{4}-\d{2}$/

function loadInitialState(monthKey: string): BudgetState {
  const roomId = readRoomIdFromUrl()

  if (roomId && canUseCloudSync()) {
    return {
      incomeByMonth: {},
      expensesByMonth: ensureMonthExpenses({}, monthKey),
      goals: [],
      transactions: [],
    }
  }

  const local = loadBudget()
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
  const [savedRooms, setSavedRooms] = useState<SavedRoom[]>(() => loadSavedRooms())
  const [state, setState] = useState(() => loadInitialState(initialMonthKey))
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>('idle')
  const [isLegacySharedPlan] = useState(
    () => readSharePlanFromUrl() !== null && !readRoomIdFromUrl(),
  )
  const monthKeyRef = useRef(monthKey)
  const roomIdRef = useRef(roomId)
  const roomHydratedRef = useRef(!readRoomIdFromUrl() || !canUseCloudSync())
  const skipCloudSaveRef = useRef(false)
  const lastPushedAtRef = useRef<string | null>(null)
  const cloudSyncEnabled = canUseCloudSync() && Boolean(roomId)

  monthKeyRef.current = monthKey
  roomIdRef.current = roomId

  const rememberRoom = useCallback((id: string, name?: string) => {
    setSavedRooms(
      upsertSavedRoom({
        id,
        name: name?.trim() || defaultSavedRoomName(id),
      }),
    )
  }, [])

  const applyRemoteState = useCallback((data: BudgetState, updatedAt: string) => {
    skipCloudSaveRef.current = true
    const localMonth = monthKeyRef.current
    setState({
      ...data,
      expensesByMonth: ensureMonthExpenses(data.expensesByMonth, localMonth),
    })
    lastPushedAtRef.current = updatedAt
    roomHydratedRef.current = true
    setSyncStatus('saved')

    const activeRoomId = roomIdRef.current
    if (activeRoomId) {
      setSavedRooms(
        upsertSavedRoom({
          id: activeRoomId,
          name: data.roomName?.trim() || defaultSavedRoomName(activeRoomId),
        }),
      )
    }
  }, [])

  const setMonthKey = useCallback((nextMonthKey: string) => {
    if (!MONTH_KEY_PATTERN.test(nextMonthKey)) return
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
    if (roomId) return
    saveBudget(state)
  }, [state, roomId])

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

  const roomPayload = useMemo(() => stripLocalOnlyFields(state), [state])

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

  useEffect(() => {
    const initialRoomId = readRoomIdFromUrl()
    if (initialRoomId && canUseCloudSync()) {
      rememberRoom(initialRoomId)
    }
  }, [rememberRoom])

  const switchToRoom = useCallback(
    (targetRoomId: string) => {
      if (!canUseCloudSync() || roomIdRef.current === targetRoomId) return

      skipCloudSaveRef.current = true
      roomHydratedRef.current = false
      lastPushedAtRef.current = null
      setRoomIdState(targetRoomId)
      setRoomInUrl(targetRoomId)
      rememberRoom(targetRoomId)
      setSyncStatus('loading')
    },
    [rememberRoom],
  )

  const switchToLocal = useCallback(() => {
    if (roomIdRef.current === null) return

    skipCloudSaveRef.current = true
    roomHydratedRef.current = true
    lastPushedAtRef.current = null
    setRoomIdState(null)
    clearRoomFromUrl()

    const localMonth = monthKeyRef.current
    const local = loadBudget()
    setState({
      ...local,
      expensesByMonth: ensureMonthExpenses(local.expensesByMonth, localMonth),
    })
    setSyncStatus('idle')
  }, [])

  const addSavedRoom = useCallback(
    (input: string) => {
      const id = parseRoomIdFromInput(input)
      if (!id || !canUseCloudSync()) return null

      rememberRoom(id)
      switchToRoom(id)
      return id
    },
    [rememberRoom, switchToRoom],
  )

  const removeSavedRoom = useCallback((id: string) => {
    setSavedRooms(removeSavedRoomFromList(id))
  }, [])

  const openRoom = useCallback(
    async (payload: BudgetState) => {
      const id = await createRoom(payload)
      skipCloudSaveRef.current = true
      roomHydratedRef.current = true
      setRoomIdState(id)
      setRoomInUrl(id)
      setState(payload)
      rememberRoom(id, payload.roomName)
      lastPushedAtRef.current = await saveRoomState(id, payload)
      setSyncStatus('saved')
      return id
    },
    [rememberRoom],
  )

  const createSharedRoom = useCallback(
    async (roomName?: string) => {
      const payload: BudgetState = {
        ...stripLocalOnlyFields(state),
        roomName: roomName?.trim() || state.roomName,
      }
      return openRoom(payload)
    },
    [openRoom, state],
  )

  const createNewRoom = useCallback(
    async (roomName?: string) => {
      const month = monthKeyRef.current
      const payload: BudgetState = {
        ...createDefaultState(),
        incomeByMonth: { [month]: 0 },
        expensesByMonth: ensureMonthExpenses({}, month),
        roomName: roomName?.trim() || 'Новый бюджет',
      }
      return openRoom(payload)
    },
    [openRoom],
  )

  const updateRoomName = useCallback(
    (roomName: string) => {
      const trimmed = roomName.trim()
      setState((current) => ({ ...current, roomName: trimmed }))

      const activeRoomId = roomIdRef.current
      if (activeRoomId) {
        setSavedRooms(
          upsertSavedRoom({
            id: activeRoomId,
            name: trimmed || defaultSavedRoomName(activeRoomId),
          }),
        )
      }
    },
    [],
  )

  const monthExpenses = useMemo(
    () => getExpensesForMonth(state.expensesByMonth, monthKey),
    [state.expensesByMonth, monthKey],
  )

  const monthKeys = useMemo(
    () => collectMonthKeys(state.expensesByMonth, state.transactions, monthKey),
    [state.expensesByMonth, state.transactions, monthKey],
  )

  const monthIncome = useMemo(
    () => getIncomeForMonth(state, monthKey),
    [state, monthKey],
  )

  const summary = useMemo(() => buildBudgetSummary(state, monthKey), [state, monthKey])

  const monthTransactions = useMemo(
    () => state.transactions.filter((t) => t.date.startsWith(monthKey)),
    [state.transactions, monthKey],
  )

  const setIncome = useCallback((income: number) => {
    setState((s) => {
      const key = monthKeyRef.current
      return {
        ...s,
        incomeByMonth: { ...(s.incomeByMonth ?? {}), [key]: income },
      }
    })
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

  const addExpense = useCallback((category?: ExpenseCategory, essential?: boolean) => {
    setState((s) => {
      const key = monthKeyRef.current
      const current = s.expensesByMonth[key] ?? []
      const last = current[current.length - 1]
      const nextCategory = category ?? last?.category ?? 'housing'
      const nextEssential = essential ?? last?.essential ?? true

      return {
        ...s,
        expensesByMonth: {
          ...s.expensesByMonth,
          [key]: [
            ...current,
            {
              id: uuidv4(),
              name: '',
              amount: 0,
              category: nextCategory,
              essential: nextEssential,
            },
          ],
        },
      }
    })
  }, [])

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

  const copyMonthPlanTo = useCallback(
    (sourceMonthKey: string, targetMonthKey: string, options?: CopyMonthPlanOptions): boolean => {
      let copied = false

      setState((current) => {
        const next = copyMonthPlan(current, sourceMonthKey, targetMonthKey, options)
        if (!next) return current
        copied = true
        return next
      })

      if (copied) {
        setMonthKey(targetMonthKey)
      }

      return copied
    },
    [setMonthKey],
  )

  return {
    state,
    summary,
    monthKey,
    setMonthKey,
    monthKeys,
    monthExpenses,
    monthIncome,
    monthTransactions,
    roomId,
    roomName: state.roomName ?? '',
    cloudSyncEnabled,
    cloudAvailable: canUseCloudSync(),
    syncStatus,
    createSharedRoom,
    createNewRoom,
    updateRoomName,
    savedRooms,
    switchToRoom,
    switchToLocal,
    addSavedRoom,
    removeSavedRoom,
    copyMonthPlanTo,
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
