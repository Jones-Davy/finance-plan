import type { RealtimeChannel } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'
import type { BudgetState } from '../types'
import { defaultGoalDeadline, getMonthKey } from './dates'
import { migrateExpensesByMonth } from './expenses'
import { getSupabaseClient, isSupabaseConfigured } from './supabase'

export type CloudSyncStatus = 'idle' | 'loading' | 'saving' | 'saved' | 'error'

interface RoomRow {
  id: string
  data: BudgetState
  updated_at: string
}

export function normalizeRemoteBudgetState(
  data: unknown,
  monthKey = getMonthKey(),
): BudgetState {
  if (!data || typeof data !== 'object') {
    return {
      monthlyIncome: 0,
      viewMonthKey: monthKey,
      expensesByMonth: migrateExpensesByMonth({}, monthKey),
      goals: [],
      transactions: [],
    }
  }

  const parsed = data as Partial<BudgetState> & { monthlyIncome?: unknown; viewMonthKey?: unknown }
  const monthlyIncome =
    typeof parsed.monthlyIncome === 'number'
      ? parsed.monthlyIncome
      : Number(parsed.monthlyIncome) || 0
  const viewMonthKey =
    typeof parsed.viewMonthKey === 'string' && /^\d{4}-\d{2}$/.test(parsed.viewMonthKey)
      ? parsed.viewMonthKey
      : monthKey

  return {
    monthlyIncome,
    viewMonthKey,
    expensesByMonth: migrateExpensesByMonth(parsed, viewMonthKey),
    goals: (parsed.goals ?? []).map((goal) => ({
      ...goal,
      deadline: goal.deadline || defaultGoalDeadline(),
    })),
    transactions: parsed.transactions ?? [],
  }
}

export async function createRoom(initialState: BudgetState): Promise<string> {
  const client = getSupabaseClient()
  if (!client) throw new Error('Supabase не настроен')

  const id = uuidv4()
  const { error } = await client.from('budget_rooms').insert({
    id,
    data: initialState,
  })

  if (error) throw error
  return id
}

export async function loadRoomState(roomId: string): Promise<RoomRow | null> {
  const client = getSupabaseClient()
  if (!client) return null

  const { data, error } = await client
    .from('budget_rooms')
    .select('id, data, updated_at')
    .eq('id', roomId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    id: data.id,
    data: normalizeRemoteBudgetState(data.data),
    updated_at: data.updated_at,
  }
}

export async function saveRoomState(roomId: string, state: BudgetState): Promise<string> {
  const client = getSupabaseClient()
  if (!client) throw new Error('Supabase не настроен')

  const updatedAt = new Date().toISOString()
  const { data, error } = await client
    .from('budget_rooms')
    .update({ data: state, updated_at: updatedAt })
    .eq('id', roomId)
    .select('updated_at')
    .single()

  if (error) throw error
  return data.updated_at as string
}

export function subscribeRoomState(
  roomId: string,
  onUpdate: (row: RoomRow) => void,
): () => void {
  const client = getSupabaseClient()
  if (!client) return () => undefined

  let channel: RealtimeChannel | null = client
    .channel(`budget-room:${roomId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'budget_rooms',
        filter: `id=eq.${roomId}`,
      },
      (payload) => {
        const next = payload.new as { data?: unknown; updated_at?: string }
        if (!next?.data || !next.updated_at) return
        onUpdate({
          id: roomId,
          data: normalizeRemoteBudgetState(next.data),
          updated_at: next.updated_at,
        })
      },
    )
    .subscribe()

  return () => {
    if (channel) {
      client.removeChannel(channel)
      channel = null
    }
  }
}

export function canUseCloudSync(): boolean {
  return isSupabaseConfigured()
}
