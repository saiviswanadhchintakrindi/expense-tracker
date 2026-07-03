import { useState, useEffect, useRef } from 'react'
import Header from './components/Header'
import ExpenseForm from './components/ExpenseForm'
import ExpenseList from './components/ExpenseList'
import SummaryDashboard from './components/SummaryDashboard'
import ManagePanel from './components/ManagePanel'
import CalendarView from './components/CalendarView'
import ReminderPopup, { useReminder } from './components/ReminderBanner'
import useData from './useData'

const TABS = ['add', 'list', 'summary', 'manage']

export default function App() {
  const [tab, setTab] = useState('add')
  const [dir, setDir] = useState(0)
  const [slide, setSlide] = useState(false)
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('theme') === 'dark' } catch { return false }
  })
  const [showCalendar, setShowCalendar] = useState(false)
  const touchStart = useRef(null)

  const {
    expenses, people, sources, summary, toast,
    filterPerson, filterSource,
    setFilterPerson, setFilterSource,
    addExpense, deleteExpense, recordPayment,
    addPerson, deletePerson, addSource, deleteSource,
    syncFromServer
  } = useData()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    try { localStorage.setItem('theme', dark ? 'dark' : 'light') } catch {}
  }, [dark])

  const toggleTheme = () => setDark(d => !d)

  const navigate = (newTab) => {
    const curIdx = TABS.indexOf(tab)
    const newIdx = TABS.indexOf(newTab)
    if (newIdx < 0) return
    setDir(newIdx > curIdx ? 1 : -1)
    setSlide(true)
    setTimeout(() => { setTab(newTab); setSlide(false) }, 200)
  }

  const handleTouchStart = (e) => { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY } }
  const handleTouchEnd = (e) => {
    if (!touchStart.current) return
    const dx = e.changedTouches[0].clientX - touchStart.current.x
    const dy = e.changedTouches[0].clientY - touchStart.current.y
    touchStart.current = null
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return
    const idx = TABS.indexOf(tab)
    if (dx < 0 && idx < TABS.length - 1) navigate(TABS[idx + 1])
    else if (dx > 0 && idx > 0) navigate(TABS[idx - 1])
  }

  const { show: reminderShow, reminderData, dismiss: dismissReminder, openPopup, isDailyReminder } = useReminder()

  const slideStyle = {
    animation: slide ? `${dir > 0 ? 'slideLeftIn' : 'slideRightIn'} 0.2s ease` : 'none',
    transform: 'translateX(0)'
  }

  return (
    <>
      <Header
        tab={tab} onTabChange={navigate} onBellClick={openPopup}
        reminderTotal={reminderData?.total || 0}
        dark={dark} onToggleTheme={toggleTheme}
        onSync={syncFromServer}
        onCalendarClick={() => setShowCalendar(true)}
      />
      <div ref={null} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} style={slideStyle}>
        {tab === 'add' && <ExpenseForm people={people} sources={sources} onSubmit={addExpense} />}
        {tab === 'list' && (
          <ExpenseList
            expenses={expenses} people={people} loading={false}
            filterPerson={filterPerson} onFilterChange={setFilterPerson}
            filterSource={filterSource} onSourceFilterChange={setFilterSource}
            sources={sources} onDelete={deleteExpense} onPay={recordPayment}
          />
        )}
        {tab === 'summary' && (
          <SummaryDashboard summary={summary} filterSource={filterSource} onSourceFilterChange={setFilterSource} sources={sources} />
        )}
        {tab === 'manage' && (
          <ManagePanel
            people={people} sources={sources}
            onAddPerson={addPerson} onDeletePerson={deletePerson} onRefreshPeople={() => {}}
            onAddSource={addSource} onDeleteSource={deleteSource} onRefreshSources={() => {}}
          />
        )}
      </div>
      {showCalendar && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 998, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '60px 16px 16px', overflow: 'auto' }} onClick={(e) => { if (e.target === e.currentTarget) setShowCalendar(false) }}>
          <div style={{ maxWidth: 500, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
              <button onClick={() => setShowCalendar(false)} style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <CalendarView expenses={expenses} />
          </div>
        </div>
      )}
      <ReminderPopup show={reminderShow} reminderData={reminderData} onDismiss={dismissReminder} isDailyReminder={isDailyReminder} />
      {toast && <div className={`toast ${toast.isError ? 'error' : ''}`}>{toast.message}</div>}
    </>
  )
}
