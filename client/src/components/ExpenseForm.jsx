import { useState, useEffect } from 'react'

export default function ExpenseForm({ people, sources, onSubmit }) {
  const creditCards = sources.filter(s => s.source_type === 'credit_card')
  const banks = sources.filter(s => s.source_type === 'bank')

  const [form, setForm] = useState({
    person: '',
    amount: '',
    description: '',
    notes: '',
    source_type: 'credit_card',
    source_name: creditCards.length > 0 ? creditCards[0].name : ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (form.source_type === 'credit_card' && creditCards.length > 0) {
      setForm(f => ({ ...f, source_name: creditCards[0].name }))
    } else if (form.source_type === 'bank' && banks.length > 0) {
      setForm(f => ({ ...f, source_name: banks[0].name }))
    }
  }, [form.source_type])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

  const handleSourceTypeChange = (e) => {
    setForm({ ...form, source_type: e.target.value, source_name: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.person || !form.amount || !form.description) return
    setSubmitting(true)
    await onSubmit({
      person: form.person,
      amount: parseFloat(form.amount),
      description: form.description,
      notes: form.notes,
      source_type: form.source_type,
      source_name: form.source_name
    })
    setForm({
      person: '', amount: '', description: '', notes: '',
      source_type: form.source_type,
      source_name: form.source_type === 'credit_card' && creditCards.length > 0 ? creditCards[0].name : (form.source_type === 'bank' && banks.length > 0 ? banks[0].name : '')
    })
    setSubmitting(false)
  }

  const isValid = form.person && form.amount && parseFloat(form.amount) > 0 && form.description

  const currentSources = form.source_type === 'credit_card' ? creditCards : banks

  return (
    <form className="card" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Payment Source</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: '0.875rem' }}>
            <input type="radio" name="source_type" value="credit_card" checked={form.source_type === 'credit_card'} onChange={handleSourceTypeChange} />
            Credit Card
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: '0.875rem' }}>
            <input type="radio" name="source_type" value="bank" checked={form.source_type === 'bank'} onChange={handleSourceTypeChange} />
            Bank Account
          </label>
        </div>
        {currentSources.length > 0 ? (
          <select name="source_name" value={form.source_name} onChange={handleChange} required>
            <option value="">Select {form.source_type === 'credit_card' ? 'card' : 'account'}...</option>
            {currentSources.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
        ) : (
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-dim)' }}>
            No {form.source_type === 'credit_card' ? 'credit cards' : 'bank accounts'} added. Go to Manage tab.
          </p>
        )}
      </div>

      <div className="form-group">
        <label>Who used the card?</label>
        <select name="person" value={form.person} onChange={handleChange} required>
          <option value="">Select person...</option>
          {people.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Amount (₹)</label>
          <input type="number" name="amount" value={form.amount} onChange={handleChange} placeholder="0.00" min="0.01" step="0.01" required />
        </div>
        <div className="form-group">
          <label>Date & Time</label>
          <input type="text" value={now.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })} disabled style={{ opacity: 0.6 }} />
        </div>
      </div>

      <div className="form-group">
        <label>Description / Purpose</label>
        <input type="text" name="description" value={form.description} onChange={handleChange} placeholder="e.g. Groceries, Gas, Dinner..." required />
      </div>

      <div className="form-group">
        <label>Notes (optional)</label>
        <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Any additional details..." />
      </div>

      <button type="submit" className="btn btn-primary" disabled={!isValid || submitting || !form.source_name}>
        {submitting ? 'Adding...' : 'Add Expense'}
      </button>
    </form>
  )
}
