import { getAvatarColor, getInitials } from '../colors'

function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      timeZone: 'Asia/Kolkata'
    })
  } catch { return dateStr }
}

export default function SummaryDashboard({ summary, filterSource, onSourceFilterChange }) {
  if (!summary) {
    return <div className="card"><div className="empty-state"><p>Loading...</p></div></div>
  }

  const { summary: items, expensesByPerson = {}, remaining_total, grand_total, paid_total } = summary

  if (!items || items.length === 0) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="icon">&#x1f4ca;</div>
          <p>No expenses recorded yet.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="filter-bar">
        <select value={filterSource} onChange={e => onSourceFilterChange(e.target.value)}>
          <option value="">All sources</option>
          <option value="credit_card">Credit Cards</option>
          <option value="bank">Bank Accounts</option>
        </select>
      </div>

      {items.map(item => {
        const personExpenses = expensesByPerson[item.person] || []
        return (
          <div key={item.person} className="card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: getAvatarColor(item.person, items.map(s => s.person)), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8125rem', color: '#fff', flexShrink: 0 }}>
                  {getInitials(item.person)}
                </div>
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>{item.person}</span>
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: '0.8125rem', flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--text-dim)' }}>Taken: <strong style={{ color: 'var(--text)' }}>₹{item.total_amount.toFixed(2)}</strong></span>
                <span style={{ color: 'var(--text-dim)' }}>Paid: <strong style={{ color: 'var(--success)' }}>₹{item.paid_amount.toFixed(2)}</strong></span>
                <span style={{ color: 'var(--text-dim)' }}>Remaining: <strong style={{ color: item.remaining <= 0 ? 'var(--success)' : 'var(--danger)' }}>₹{item.remaining.toFixed(2)}</strong></span>
              </div>
            </div>

            {personExpenses.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                {personExpenses.map(e => (
                  <div key={e.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: '0.8125rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: 'var(--text)' }}>{e.description}</div>
                        {e.notes && <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 2 }}>{e.notes}</div>}
                        <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginTop: 3 }}>
                          Taken: {formatDate(e.created_at)}
                          {e.source_name && (
                            <span style={{ marginLeft: 8, fontSize: '0.6875rem', fontWeight: 500, color: e.source_type === 'credit_card' ? '#7c3aed' : '#0891b2', background: e.source_type === 'credit_card' ? '#ede9fe' : '#cffafe', padding: '1px 6px', borderRadius: 8 }}>
                              {e.source_type === 'credit_card' ? '💳' : '🏦'} {e.source_name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontWeight: 700, color: 'var(--danger)', fontSize: '0.9375rem' }}>₹{e.amount.toFixed(2)}</div>
                      </div>
                    </div>

                    {e.payments && e.payments.length > 0 && (
                      <div style={{ marginTop: 6, paddingLeft: 8, borderLeft: '2px solid var(--success)' }}>
                        {e.payments.map(p => (
                          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', padding: '2px 0' }}>
                            <span style={{ color: 'var(--success)' }}>Paid: {formatDate(p.paid_at)}</span>
                            <span style={{ fontWeight: 600, color: 'var(--success)' }}>₹{p.amount.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {e.paid_amount < e.amount && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: 3, fontWeight: 600 }}>
                        Remaining: ₹{(e.amount - e.paid_amount).toFixed(2)}
                      </div>
                    )}
                    {e.paid_amount >= e.amount && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: 3, fontWeight: 600 }}>
                        Fully paid ✓
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      <div className="grand-total">
        <div className="label">Total Remaining to Collect</div>
        <div className="value">₹{remaining_total.toFixed(2)}</div>
      </div>
    </>
  )
}
