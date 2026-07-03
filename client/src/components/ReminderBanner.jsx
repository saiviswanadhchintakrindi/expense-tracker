import { useState, useEffect, useCallback } from 'react'

const API = '/api'

export function useReminder() {
  const [show, setShow] = useState(false)
  const [reminderData, setReminder] = useState(null)
  const [notified, setNotified] = useState(false)
  const [permission, setPermission] = useState('default')

  useEffect(() => {
    try { setPermission(Notification.permission) } catch {}
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
      const day = now.getDate()
      const hour = now.getHours()
      if (day === 30 && hour === 10 && !notified) {
        setNotified(true)
        loadReminder()
        setShow(true)
      }
      if (hour !== 10) setNotified(false)
    }
    check()
    const interval = setInterval(check, 60000)
    return () => clearInterval(interval)
  }, [notified, loadReminder])

  useEffect(() => {
    if (show && reminderData && permission === 'granted') {
      const body = reminderData.owing.map(s => `${s.person}: ₹${s.remaining.toFixed(2)}`).join('\n')
      try {
        new Notification('💳 Credit Card Payment Reminder', {
          body: `Remaining: ₹${reminderData.total.toFixed(2)}\n\n${body}`,
          requireInteraction: true
        })
      } catch {}
    }
  }, [show, reminderData, permission])

  const dismiss = () => setShow(false)

  const openPopup = async () => {
    try {
      if (Notification.permission === 'default') {
        const p = await Notification.requestPermission()
        setPermission(p)
      }
    } catch {}
    await loadReminder()
    setShow(true)
  }

  return { show, reminderData, dismiss, openPopup, loadReminder, permission }
}

export default function ReminderPopup({ show, reminderData, onDismiss }) {
  if (!show || !reminderData) return null

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16
    }}>
      <div style={{
        background: 'var(--surface)', borderRadius: 'var(--radius)',
        padding: '20px', maxWidth: 400, width: 'calc(100% - 32px)',
        boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)'
      }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>💳</div>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 4, color: 'var(--danger)' }}>
          Credit Card Payment Reminder
        </h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 12 }}>
          Remaining payments ({new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}):
        </p>
        <div style={{ marginBottom: 16 }}>
          {reminderData.owing.map(s => (
            <div key={s.person} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}>
              <span style={{ fontWeight: 600 }}>{s.person}</span>
              <span style={{ fontWeight: 700, color: 'var(--danger)' }}>₹{s.remaining.toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '2px solid var(--danger)', fontSize: '0.9375rem', fontWeight: 700 }}>
          <span>Total Remaining</span>
          <span style={{ color: 'var(--danger)' }}>₹{reminderData.total.toFixed(2)}</span>
        </div>
        <button className="btn btn-primary" onClick={onDismiss} style={{ marginTop: 16 }}>
          OK, Got it
        </button>
        <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center' }}>
          Auto-notifies on 30th at 10 AM
        </div>
      </div>
    </div>
  )
}
