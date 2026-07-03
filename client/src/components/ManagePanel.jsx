import { useState } from 'react'

function PeopleSection({ people, onAdd, onDelete, onRefresh }) {
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    const ok = await onAdd(name.trim())
    if (ok) setName('')
    setSubmitting(false)
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>People</h3>
        <button className="btn btn-sm" style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }} onClick={onRefresh}>Refresh</button>
      </div>
      <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder="Add a person..."
          style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', fontFamily: 'inherit' }}
        />
        <button type="submit" className="btn btn-primary" disabled={!name.trim() || submitting} style={{ width: 'auto', padding: '8px 16px' }}>
          {submitting ? '...' : 'Add'}
        </button>
      </form>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {people.map(p => (
          <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.875rem', fontWeight: 500 }}>
            {p}
            <button onClick={() => onDelete(p)} style={{ border: 'none', background: 'transparent', color: 'var(--danger)', cursor: 'pointer', fontSize: '1rem', padding: '0 2px', lineHeight: 1 }} title={`Remove ${p}`}>&times;</button>
          </div>
        ))}
      </div>
    </div>
  )
}

function SourcesSection({ sources, onAdd, onDelete, onRefresh }) {
  const [name, setName] = useState('')
  const [sourceType, setSourceType] = useState('credit_card')
  const [submitting, setSubmitting] = useState(false)

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    const ok = await onAdd(name.trim(), sourceType)
    if (ok) setName('')
    setSubmitting(false)
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Payment Sources</h3>
        <button className="btn btn-sm" style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }} onClick={onRefresh}>Refresh</button>
      </div>
      <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <select value={sourceType} onChange={e => setSourceType(e.target.value)} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', fontFamily: 'inherit', background: 'var(--surface)' }}>
          <option value="credit_card">Credit Card</option>
          <option value="bank">Bank Account</option>
        </select>
        <input
          type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder={sourceType === 'credit_card' ? 'Card name...' : 'Bank name...'}
          style={{ flex: 1, minWidth: 160, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', fontFamily: 'inherit' }}
        />
        <button type="submit" className="btn btn-primary" disabled={!name.trim() || submitting} style={{ width: 'auto', padding: '8px 16px' }}>
          {submitting ? '...' : 'Add'}
        </button>
      </form>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {sources.map(s => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.875rem', fontWeight: 500 }}>
            <span>{s.source_type === 'credit_card' ? '💳' : '🏦'} {s.name}</span>
            <button onClick={() => onDelete(s.id)} style={{ border: 'none', background: 'transparent', color: 'var(--danger)', cursor: 'pointer', fontSize: '1rem', padding: '0 2px', lineHeight: 1 }} title={`Remove ${s.name}`}>&times;</button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ManagePanel(props) {
  return (
    <>
      <PeopleSection
        people={props.people}
        onAdd={props.onAddPerson}
        onDelete={props.onDeletePerson}
        onRefresh={props.onRefreshPeople}
      />
      <SourcesSection
        sources={props.sources}
        onAdd={props.onAddSource}
        onDelete={props.onDeleteSource}
        onRefresh={props.onRefreshSources}
      />
    </>
  )
}
