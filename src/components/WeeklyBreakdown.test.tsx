import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { WeeklyBreakdown } from './WeeklyBreakdown'
import { buildBudgetSummary } from '../utils/calculations'
import { createBudgetState } from '../test/fixtures'

describe('WeeklyBreakdown', () => {
  it('shows weekly and daily limits', () => {
    const summary = buildBudgetSummary(createBudgetState(), '2026-07')

    render(<WeeklyBreakdown summary={summary} />)

    expect(screen.getByText('Недельный план')).toBeInTheDocument()
    expect(screen.getByText('Все траты')).toBeInTheDocument()
    expect(screen.getByText('Обязательные')).toBeInTheDocument()
  })
})
