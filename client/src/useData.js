import { useState, useEffect, useCallback } from 'react'

const API = '/api'

export default function useData() {
  const [expenses, setExpenses] = useState([])
  const [people, setPeople] = useState([])
  const [sources, setSources] = useState([])
  const [summary, setSummary] = useState(null)
  const [toast, setToast] = useState(null)
  const [filterPerson, setFilterPerson] = useState('')
  const [filterSource, setFilterSource] = useState('')

  const showToast = (msg, isErr) => {
    setToast({ message: msg, isError: isErr })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchAll = useCallback(async (fp, fs) => {
    try {
      const params = new URLSearchParams()
      if (fp) params.set('person', fp)
      if (fs) params.set('source_type', fs)

      const [eRes, pRes, sRes, sumRes] = await Promise.all([
        fetch(`${API}/expenses?${params}`),
        fetch(`${API}/people`),
        fetch(`${API}/sources`),
        fetch(`${API}/summary?${params}`)
      ])
      setExpenses(await eRes.json())
      setPeople(await pRes.json())
      setSources(await sRes.json())
      setSummary(await sumRes.json())
    } catch {}
  }, [])

  useEffect(() => { fetchAll(filterPerson, filterSource) }, [fetchAll, filterPerson, filterSource])

  const addExpense = async (expense) => {
    try {
      const res = await fetch(`${API}/expenses`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(expense)
      })
      if (!res.ok) { const err = await res.json(); showToast(err.error, true); return }
      showToast('Expense added!')
      setFilterPerson('')
      setFilterSource('')
      await fetchAll('', '')
    } catch { showToast('Failed', true) }
  }

  const deleteExpense = async (id) => {
    try {
      await fetch(`${API}/expenses/${id}`, { method: 'DELETE' })
      showToast('Deleted!')
      await fetchAll(filterPerson, filterSource)
    } catch { showToast('Failed', true) }
  }

  const recordPayment = async (id, amount) => {
    try {
      const res = await fetch(`${API}/expenses/${id}/pay`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount })
      })
      if (!res.ok) { const err = await res.json(); showToast(err.error, true); return }
      showToast(`Paid ₹${amount.toFixed(2)}!`)
      await fetchAll(filterPerson, filterSource)
    } catch { showToast('Failed', true) }
  }

  const addPerson = async (name) => {
    try {
      const res = await fetch(`${API}/people`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name })
      })
      if (!res.ok) { const err = await res.json(); showToast(err.error, true); return false }
      showToast(`${name} added!`)
      setPeople(prev => [...prev, name].sort())
      fetchAll(filterPerson, filterSource)
      return true
    } catch { showToast('Failed', true); return false }
  }

  const deletePerson = async (name) => {
    try {
      const res = await fetch(`${API}/people/${encodeURIComponent(name)}`, { method: 'DELETE' })
      if (!res.ok) { const err = await res.json(); showToast(err.error, true); return }
      showToast(`${name} removed!`)
      setPeople(prev => prev.filter(p => p !== name))
    } catch { showToast('Failed', true) }
  }

  const addSource = async (name, source_type) => {
    try {
      const res = await fetch(`${API}/sources`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, source_type })
      })
      if (!res.ok) { const err = await res.json(); showToast(err.error, true); return false }
      showToast(`${name} added!`)
      fetchAll(filterPerson, filterSource)
      return true
    } catch { showToast('Failed', true); return false }
  }

  const deleteSource = async (id) => {
    try {
      const res = await fetch(`${API}/sources/${id}`, { method: 'DELETE' })
      if (!res.ok) { const err = await res.json(); showToast(err.error, true); return }
      showToast('Removed!')
      fetchAll(filterPerson, filterSource)
    } catch { showToast('Failed', true) }
  }

  return {
    expenses, people, sources, summary, toast,
    filterPerson, filterSource, setFilterPerson, setFilterSource,
    addExpense, deleteExpense, recordPayment,
    addPerson, deletePerson, addSource, deleteSource,
    syncFromServer: () => fetchAll(filterPerson, filterSource)
  }
}
