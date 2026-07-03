import { useState } from 'react'
import { getAvatarColor, getInitials } from '../colors'

function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      timeZone: 'Asia/Kolkata'
    })
  } catch {
    return dateStr
  }
}

function PaymentSection({ expense, onPay }) {
  const [amount, setAmount] = useState('')
  const [paying, setPaying] = useState(false)
  const remaining = expense.amount - expense.paid_amount
  const isFullyPaid = remaining <= 0

  const handlePay = async () => {
    const val = parseFloat(amount)
    if (!val || val <= 0) return
    setPaying(true)
    await onPay(expense.id, val)
    setAmount('')
    setPaying(false)
  }

  return (
    <div style={{ marginTop: 8, padding: '10px 0 0', borderTop: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', fontSize: '0.8125rem' }}>
        <span>
          <span style={{ color: 'var(--text-dim)' }}>Total: </span>
          <strong>₹{expense.amount.toFixed(2)}</strong>
        </span>
        {expense.paid_amount > 0 && (
          <span>
            <span style={{ color: 'var(--success)' }}>Paid: </span>
            <strong style={{ color: 'var(--success)' }}>₹{expense.paid_amount.toFixed(2)}</strong>
          </span>
        )}
        <span>
          <span style={{ color: isFullyPaid ? 'var(--success)' : 'var(--danger)' }}>Remaining: </span>
          <strong style={{ color: isFullyPaid ? 'var(--success)' : 'var(--danger)' }}>
            ₹{Math.max(0, remaining).toFixed(2)}
          </strong>
        </span>
      </div>

      {/* Progress bar */}
      <div style={{
        marginTop: 6,
        height: 6,
        borderRadius: 3,
        background: '#e2e5ee',
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          width: `${Math.min(100, (expense.paid_amount / expense.amount) * 100)}%`,
          background: isFullyPaid ? 'var(--success)' : 'var(--primary)',
          borderRadius: 3,
          transition: 'width 0.3s'
        }} />
      </div>

      {!isFullyPaid && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Max ₹${remaining.toFixed(2)}`}
            min="0.01"
            max={remaining}
            step="0.01"
            style={{
              flex: 1,
              minWidth: 100,
              padding: '8px 10px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8125rem',
              fontFamily: 'inherit'
            }}
          />
          <button
            onClick={handlePay}
            disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > remaining || paying}
            style={{
              padding: '8px 14px',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--success)',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.75rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
              opacity: (!amount || parseFloat(amount) <= 0 || paying) ? 0.5 : 1
            }}
          >
            {paying ? '...' : 'Pay'}
          </button>
        </div>
      )}

      {isFullyPaid && (
        <div style={{ marginTop: 8, fontSize: '0.8125rem', fontWeight: 600, color: 'var(--success)' }}>
          Fully paid
        </div>
      )}
    </div>
  )
}

export default function ExpenseList({ expenses, people, loading, filterPerson, onFilterChange, filterSource, onSourceFilterChange, sources, onDelete, onPay }) {
  const [expandedId, setExpandedId] = useState(null)

  return (
    <>
      <div className="filter-bar">
        <select value={filterSource} onChange={(e) => onSourceFilterChange(e.target.value)}>
          <option value="">All sources</option>
          <option value="credit_card">Credit Cards</option>
          <option value="bank">Bank Accounts</option>
        </select>
        <select value={filterPerson} onChange={(e) => onFilterChange(e.target.value)}>
          <option value="">All people</option>
          {people.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className="card">
        {loading ? (
          <div className="empty-state"><p>Loading...</p></div>
        ) : expenses.length === 0 ? (
          <div className="empty-state">
            <div className="icon">&#x1f4cb;</div>
            <p>No expenses recorded yet.</p>
          </div>
        ) : (
          <ul className="expense-list">
            {expenses.map((exp) => {
              const isExpanded = expandedId === exp.id
              return (
                <li key={exp.id} className="expense-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div
                      className="avatar"
                      style={{ background: getAvatarColor(exp.person, people) }}
                    >
                      {getInitials(exp.person)}
                    </div>
                    <div className="expense-info" style={{ cursor: 'pointer' }} onClick={() => setExpandedId(isExpanded ? null : exp.id)}>
                      <div className="person-name">
                        {exp.person}
                        {exp.paid_amount >= exp.amount && (
                          <span style={{ marginLeft: 8, fontSize: '0.6875rem', fontWeight: 600, color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: 10 }}>PAID</span>
                        )}
                      </div>
                      <div className="description">{exp.description}</div>
                      <div className="meta" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {formatDate(exp.created_at)}
                        {exp.source_name && (
                          <span style={{
                            fontSize: '0.6875rem', fontWeight: 500, color: exp.source_type === 'credit_card' ? '#7c3aed' : '#0891b2',
                            background: exp.source_type === 'credit_card' ? '#ede9fe' : '#cffafe',
                            padding: '1px 6px', borderRadius: 8
                          }}>
                            {exp.source_type === 'credit_card' ? '💳' : '🏦'} {exp.source_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="expense-amount" style={{ cursor: 'pointer' }} onClick={() => setExpandedId(isExpanded ? null : exp.id)}>
                      -₹{exp.amount.toFixed(2)}
                    </div>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => onDelete(exp.id)}
                      title="Delete expense"
                    >
                      &#x2715;
                    </button>
                  </div>
                  {isExpanded && (
                    <PaymentSection expense={exp} onPay={onPay} />
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </>
  )
}
