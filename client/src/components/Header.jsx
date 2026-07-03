import { useState } from 'react'

export default function Header({ tab, onTabChange, onBellClick, reminderTotal, dark, onToggleTheme, onSync }) {
  const [syncing, setSyncing] = useState(false)

  const handleSync = async () => {
    if (syncing || !onSync) return
    setSyncing(true)
    await onSync()
    setTimeout(() => setSyncing(false), 1000)
  }
  const tabs = [
    { key: 'add', label: 'Add' },
    { key: 'list', label: 'Expenses' },
    { key: 'summary', label: 'Summary' },
    { key: 'manage', label: 'Manage' },
    { key: 'db', label: 'DB' }
  ]

  return (
    <header className="app-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="logo-icon">&#x1f4b3;</span>
        <h1>Expense Tracker</h1>
        <button
          onClick={onToggleTheme}
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            background: 'var(--toggle-bg)',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.875rem',
            width: 36, height: 36,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s'
          }}
        >
          {dark ? '\u2600' : '\u263D'}
        </button>
        <button
          onClick={onBellClick}
          title="Credit card payment reminder"
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontSize: '1.25rem', position: 'relative', padding: '4px 6px',
            borderRadius: 'var(--radius-sm)', lineHeight: 1
          }}
        >
          {'\uD83D\uDD14'}
          {reminderTotal > 0 && (
            <span style={{
              position: 'absolute', top: -2, right: -4,
              background: 'var(--danger)', color: '#fff',
              fontSize: '0.5625rem', fontWeight: 700,
              minWidth: 16, height: 16, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 4px'
            }}>
              {'\u20B9'}
            </span>
          )}
        </button>
        {onSync && (
          <button
            onClick={handleSync}
            title="Sync data across devices"
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontSize: '1rem', padding: '4px 6px', borderRadius: 'var(--radius-sm)',
              lineHeight: 1, opacity: syncing ? 0.5 : 1
            }}
          >
            {syncing ? '\u23F3' : '\uD83D\uDD04'}
          </button>
        )}
      </div>
      <nav className="nav-tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`nav-tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => onTabChange(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </header>
  )
}
