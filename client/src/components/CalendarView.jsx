import { useState } from 'react'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDay(year, month) {
  return new Date(year, month, 1).getDay()
}

export default function CalendarView({ expenses = [] }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedDate, setSelectedDate] = useState(null)

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDay(year, month)

  const expenseMap = {}
  expenses.forEach(e => {
    try {
      const d = new Date(e.created_at).toISOString().split('T')[0]
      if (!expenseMap[d]) expenseMap[d] = { total: 0, items: [] }
      expenseMap[d].total += parseFloat(e.amount) || 0
      expenseMap[d].items.push(e)
    } catch {}
  })

  const today = new Date().toISOString().split('T')[0]

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
    setSelectedDate(null)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
    setSelectedDate(null)
  }

  const selectedExpenses = selectedDate ? expenseMap[selectedDate] : null

  return (
    <>
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <button onClick={prevMonth} style={{ border: 'none', background: 'var(--surface-hover)', color: 'var(--text)', padding: '6px 14px', borderRadius: 'var(--radius-xs)', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: '0.875rem', fontWeight: 600 }}>←</button>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font)' }}>
            {MONTHS[month]} {year}
          </h2>
          <button onClick={nextMonth} style={{ border: 'none', background: 'var(--surface-hover)', color: 'var(--text)', padding: '6px 14px', borderRadius: 'var(--radius-xs)', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: '0.875rem', fontWeight: 600 }}>→</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, textAlign: 'center' }}>
          {DAYS.map(d => (
            <div key={d} style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', padding: '4px 0', fontFamily: 'var(--font)' }}>{d}</div>
          ))}

          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const hasExpense = expenseMap[dateStr]
            const isToday = dateStr === today
            const isSelected = dateStr === selectedDate

            return (
              <button
                key={day}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                style={{
                  padding: '8px 4px',
                  border: isSelected ? '2px solid var(--primary)' : isToday ? '1.5px solid var(--accent)' : '1px solid transparent',
                  borderRadius: 'var(--radius-xs)',
                  background: hasExpense
                    ? `linear-gradient(135deg, rgba(99,102,241,${Math.min(0.15 + (hasExpense.total / 100000) * 0.5, 0.6)}), rgba(99,102,241,0.1))`
                    : 'transparent',
                  cursor: 'pointer',
                  fontFamily: 'var(--font)',
                  fontWeight: isToday ? 700 : 500,
                  color: 'var(--text)',
                  position: 'relative',
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{ fontSize: '0.8125rem' }}>{day}</span>
                {hasExpense && (
                  <div style={{ fontSize: '0.5625rem', color: 'var(--primary)', fontWeight: 700, marginTop: 1 }}>
                    ₹{hasExpense.total >= 1000 ? `${(hasExpense.total / 1000).toFixed(0)}k` : hasExpense.total.toFixed(0)}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 12, fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: 'linear-gradient(135deg, rgba(99,102,241,0.4), rgba(99,102,241,0.2))' }} /> Has expenses
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, border: '1.5px solid var(--accent)' }} /> Today
          </span>
        </div>
      </div>

      {selectedExpenses && (
        <div className="card" style={{ padding: 16, animation: 'fadeInUp 0.3s ease' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: 10, fontFamily: 'var(--font)' }}>
            {new Date(selectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </h3>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)', marginBottom: 10 }}>
            Total: ₹{selectedExpenses.total.toFixed(2)}
          </div>
          {selectedExpenses.items.map(e => (
            <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '0.8125rem' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{e.description}</div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{e.person}</div>
              </div>
              <span style={{ fontWeight: 700, color: 'var(--accent)' }}>₹{parseFloat(e.amount).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      {!selectedDate && (
        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 8, opacity: 0.4 }}>📅</div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontFamily: 'var(--font)' }}>Click a date to see expenses</p>
        </div>
      )}
    </>
  )
}
