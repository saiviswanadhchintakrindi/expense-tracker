import { useState, useEffect, useCallback } from 'react'

const API = '/api'
const REMINDER_HOURS = [18, 20, 22]

export function useReminder() {
  const [show, setShow] = useState(false)
  const [reminderData, setReminder] = useState(null)
  const [notifiedHours, setNotifiedHours] = useState(new Set())
  const [permission, setPermission] = useState('default')
  const [isDailyReminder, setIsDailyReminder] = useState(false)

  useEffect(() => {
    try { setPermission(Notification.permission) } catch {}
    // Auto-request notification permission on first load
    const timer = setTimeout(async () => {
      try {
        if (Notification.permission === 'default') {
          const p = await Notification.requestPermission()
          setPermission(p)
        }
      } catch {}
    }, 5000)
    return () => clearTimeout(timer)
  }, [])

  const loadReminder = useCallback(async () => {
    try {
      const res = await fetch(`${API}/summary?source_type=credit_card`)
      const data = await res.json()
      if (data.summary && data.summary.length > 0) {
        const owing = data.summary.filter(s => s.remaining > 0)
        setReminder(owing.length > 0 ? { owing, total: data.remaining_total } : null)
      } else {
        setReminder(null)
      }
    } catch { setReminder(null) }
  }, [])

  useEffect(() => {
    loadReminder()
    const check = () => {
      const now = new Date()
      const hour = now.getHours()
      const minute = now.getMinutes()
      const dayKey = `${now.getDate()}-${hour}`

      const isReminderTime = REMINDER_HOURS.includes(hour) && minute >= 0 && minute <= 5
      if (isReminderTime && !notifiedHours.has(dayKey)) {
        setNotifiedHours(prev => new Set([...prev, dayKey]))
        setIsDailyReminder(true)
        setShow(true)
      }

      if (hour === 0 && minute < 5) setNotifiedHours(new Set())
    }
    check()
    const interval = setInterval(check, 60000)
    return () => clearInterval(interval)
  }, [notifiedHours, loadReminder])

  useEffect(() => {
    if (show && isDailyReminder && permission === 'granted') {
      try {
        new Notification('\u23F0 Add Your Expenses', {
          body: 'Did you use your credit card today? Record your expenses now to keep track.',
          requireInteraction: true,
          tag: 'daily-expense-reminder'
        })
      } catch {}
    }
  }, [show, isDailyReminder, permission])

  const dismiss = () => {
    setShow(false)
    setIsDailyReminder(false)
  }

  const openPopup = async () => {
    try {
      if (Notification.permission === 'default') {
        const p = await Notification.requestPermission()
        setPermission(p)
      }
    } catch {}
    setIsDailyReminder(false)
    await loadReminder()
    setShow(true)
  }

  return { show, reminderData, dismiss, openPopup, loadReminder, permission, isDailyReminder }
}

export default function ReminderPopup({ show, reminderData, onDismiss, isDailyReminder, permission }) {
  if (!show) return null

  if (isDailyReminder) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.5)', zIndex: 999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16
      }}>
        <div style={{
          background: 'var(--surface)', borderRadius: 'var(--radius)',
          padding: 24, maxWidth: 380, width: 'calc(100% - 32px)',
          boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⏰</div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: 6, fontFamily: 'var(--font)' }}>
            {new Date().getHours() >= 20 ? 'End of Day' : new Date().getHours() >= 18 ? 'Evening' : 'Night'} Reminder
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.5, fontFamily: 'var(--font)' }}>
            Did you or anyone use the credit card today?
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 16 }}>
            Go to the <strong>Add</strong> tab and record your expenses now.
          </p>
          <button className="btn btn-primary" onClick={onDismiss} style={{ width: 'auto', display: 'inline-flex', padding: '10px 32px' }}>
            OK, I will add
          </button>
          <div style={{ marginTop: 12, fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
            Auto-reminds at 6 PM, 8 PM &amp; 10 PM
          </div>
          {permission === 'default' && (
            <div style={{ marginTop: 6, fontSize: '0.6875rem', color: 'var(--primary)', fontWeight: 600 }}>
              Allow notifications for alerts even when tab is closed (Android)
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!reminderData) return null

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16
    }}>
      <div style={{
        background: 'var(--surface)', borderRadius: 'var(--radius)',
        padding: 22, maxWidth: 400, width: 'calc(100% - 32px)',
        boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border)'
      }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>💳</div>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 4, color: 'var(--accent)', fontFamily: 'var(--font)' }}>
          Credit Card Pending Payments
        </h2>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 12 }}>
          {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        <div style={{ marginBottom: 16 }}>
          {reminderData.owing.map(s => (
            <div key={s.person} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}>
              <span style={{ fontWeight: 600 }}>{s.person}</span>
              <span style={{ fontWeight: 700, color: 'var(--accent)' }}>₹{s.remaining.toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '2px solid var(--accent)', fontSize: '0.9375rem', fontWeight: 700 }}>
          <span>Total Remaining</span>
          <span style={{ color: 'var(--accent)' }}>₹{reminderData.total.toFixed(2)}</span>
        </div>
        <button className="btn btn-primary" onClick={onDismiss} style={{ marginTop: 16 }}>
          OK
        </button>
      </div>
    </div>
  )
}
