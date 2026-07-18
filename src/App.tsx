import { ExpenseChart } from './components/ExpenseChart'
import { ActualSpendingPanel } from './components/ActualSpendingPanel'
import { ExpenseList } from './components/ExpenseList'
// import { GoalsPanel } from './components/GoalsPanel'
import { MonthSheetsBar } from './components/MonthSheetsBar'
import { PlanVsActualPanel } from './components/PlanVsActualPanel'
// import { Rule503020Panel } from './components/Rule503020Panel'
import { SummaryCards } from './components/SummaryCards'
import { WeeklyBreakdown } from './components/WeeklyBreakdown'
import { SharePlanButton } from './components/SharePlanButton'
import { useBudget } from './hooks/useBudget'
import type { CloudSyncStatus } from './utils/roomSync'
import './App.css'

function syncStatusLabel(status: CloudSyncStatus): string {
  switch (status) {
    case 'loading':
      return 'загрузка…'
    case 'saving':
      return 'сохранение…'
    case 'saved':
      return 'синхронизировано'
    case 'error':
      return 'ошибка синхронизации'
    default:
      return ''
  }
}

function App() {
  const {
    state,
    summary,
    monthKey,
    setMonthKey,
    monthKeys,
    monthExpenses,
    monthIncome,
    monthTransactions,
    roomId,
    roomName,
    cloudAvailable,
    cloudSyncEnabled,
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
    removeTransaction,
    // addGoal,
    // updateGoal,
    // removeGoal,
    resetBudget,
    isLegacySharedPlan,
    isRoomMode,
  } = useBudget()

  const syncLabel = syncStatusLabel(syncStatus)
  const displayRoomName = roomName.trim() || 'Общий бюджет'

  return (
    <div className="app">
      {isRoomMode && cloudSyncEnabled && (
        <div className="shared-banner shared-banner--sync">
          <strong className="shared-banner__title">{displayRoomName}</strong>
          <span className="shared-banner__meta">
            комната {roomId?.slice(0, 8)}…{syncLabel ? ` · ${syncLabel}` : ''}
          </span>
        </div>
      )}
      {isLegacySharedPlan && !isRoomMode && (
        <div className="shared-banner">
          Открыт план из старой ссылки. Данные только у вас — для синхронизации создайте общую
          комнату через «Комната».
        </div>
      )}
      <header className="header">
        <div className="header__content">
          <div>
            <p className="header__eyebrow">Личные финансы</p>
            <h1>{isRoomMode && cloudSyncEnabled ? displayRoomName : 'Месячный бюджет'}</h1>
            <p className="header__desc header__desc--desktop">
              Планируйте траты, фиксируйте факт и проверяйте баланс по правилу 50/30/20
            </p>
          </div>
          <div className="header__actions">
            <div className="header__buttons">
              <SharePlanButton
                state={state}
                roomId={roomId}
                roomName={roomName}
                cloudAvailable={cloudAvailable}
                savedRooms={savedRooms}
                onRoomNameChange={updateRoomName}
                onCreateRoom={createSharedRoom}
                onCreateNewRoom={createNewRoom}
                onSwitchToLocal={switchToLocal}
                onSwitchRoom={switchToRoom}
                onAddSavedRoom={addSavedRoom}
                onRemoveSavedRoom={removeSavedRoom}
              />
              <button type="button" className="btn btn--secondary" onClick={resetBudget}>
                Сбросить
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="workbook">
        <MonthSheetsBar
          monthKeys={monthKeys}
          value={monthKey}
          onChange={setMonthKey}
          onCopyPlan={copyMonthPlanTo}
        />

        <main className="layout workbook__content">
          <SummaryCards
            income={monthIncome}
            summary={summary}
            onIncomeChange={setIncome}
          />

          <div className="layout__main">
            <div className="layout__primary">
              <ExpenseList
                monthKey={monthKey}
                expenses={monthExpenses}
                onUpdate={updateExpense}
                onAdd={addExpense}
                onRemove={removeExpense}
              />
              <ActualSpendingPanel
                monthKey={monthKey}
                transactions={monthTransactions}
                onAdd={addTransaction}
                onRemove={removeTransaction}
              />
              <PlanVsActualPanel summary={summary} />
            </div>

            <aside className="layout__side">
              {/* <Rule503020Panel income={monthIncome} summary={summary} /> */}
              <ExpenseChart summary={summary} income={monthIncome} />
              <WeeklyBreakdown
                summary={summary}
                expenses={monthExpenses}
                transactions={monthTransactions}
              />
              {/* <GoalsPanel
                goals={state.goals}
                goalsMonthlyNeed={summary.goalsMonthlyNeed}
                onAdd={addGoal}
                onUpdate={updateGoal}
                onRemove={removeGoal}
              /> */}
            </aside>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
