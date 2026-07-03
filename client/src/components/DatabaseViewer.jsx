import { useState, useEffect } from 'react'

const API = '/api'

export default function DatabaseViewer() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('people')
  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/admin/data?collection=${tab}`)
      if (!res.ok) throw new Error(await res.text())
      setData(await res.json())
    } catch (e) {
      setError(e.message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [tab])

  if (error) {
    return (
      <div className="card">
        <div className="empty-state">
          <p style={{ color: 'var(--danger)' }}>Error: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {['people', 'sources', 'expenses', 'payments'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '7px 16px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
              background: tab === t ? 'var(--primary)' : 'var(--surface)',
              color: tab === t ? '#fff' : 'var(--text)',
              fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer',
              fontFamily: 'inherit', textTransform: 'capitalize'
            }}
          >
            {t}
          </button>
        ))}
        <button
          onClick={fetchData}
          style={{
            padding: '7px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
            background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer',
            fontSize: '0.875rem', fontFamily: 'inherit', marginLeft: 'auto'
          }}
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="empty-state"><p>Loading...</p></div>
      ) : data && data.length === 0 ? (
        <div className="empty-state"><p>No records in {tab}</p></div>
      ) : data ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
            <thead>
              <tr>
                {Object.keys(data[0]).filter(k => k !== 'payments').map(k => (
                  <th key={k} style={{
                    padding: '8px 10px', textAlign: 'left', borderBottom: '2px solid var(--border)',
                    color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase',
                    fontSize: '0.6875rem', letterSpacing: 0.5, whiteSpace: 'nowrap'
                  }}>
                    {k}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={row.id || i} style={{ borderBottom: '1px solid var(--border)' }}>
                  {Object.entries(row).filter(([k]) => k !== 'payments').map(([k, v]) => (
                    <td key={k} style={{
                      padding: '6px 10px', color: 'var(--text)',
                      maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                    }}>
                      {v === null ? 'null' : typeof v === 'object' ? JSON.stringify(v) : String(v)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            {data.length} record{data.length !== 1 ? 's' : ''}
          </div>
        </div>
      ) : null}
    </div>
  )
}
