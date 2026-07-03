import { useState, useEffect, useCallback, useRef } from 'react'

const API = '/api'

function dataToSummary(data, sourceType) {
  let expenses = [...data.expenses]
  let payments = [...data.payments]
  if (sourceType) expenses = expenses.filter(e => e.source_type === sourceType)
  const expenseIds = new Set(expenses.map(e => e.id))
  payments = payments.filter(p => expenseIds.has(p.expense_id))

  const byPerson = {}
  for (const e of expenses) {
    if (!byPerson[e.person]) byPerson[e.person] = { total: 0, paid: 0, count: 0 }
    byPerson[e.person].total += e.amount
    byPerson[e.person].paid += e.paid_amount || 0
    byPerson[e.person].count++
  }

  const expensesByPerson = {}
  for (const e of expenses) {
    if (!expensesByPerson[e.person]) expensesByPerson[e.person] = []
    expensesByPerson[e.person].push({ ...e, payments: payments.filter(p => p.expense_id === e.id) })
  }

  const summary = Object.entries(byPerson).map(([person, d]) => ({
    person, expense_count: d.count,
    total_amount: +d.total.toFixed(2), paid_amount: +d.paid.toFixed(2),
    remaining: +(d.total - d.paid).toFixed(2)
  })).sort((a, b) => b.remaining - a.remaining)

  const grand = +expenses.reduce((s, e) => s + e.amount, 0).toFixed(2)
  const paid = +expenses.reduce((s, e) => s + (e.paid_amount || 0), 0).toFixed(2)
  return { summary, expensesByPerson, grand_total: grand, paid_total: paid, remaining_total: +(grand - paid).toFixed(2) }
}

export default function useData() {
  const [expenses, setExpenses] = useState([])
  const [people, setPeople] = useState([])
  const [sources, setSources] = useState([])
  const [summary, setSummary] = useState(null)
  const [toast, setToast] = useState(null)
  const filterPerson = useRef('')
  const filterSource = useRef('')

  const showToast = useCallback((msg, isErr) => {
    setToast({ message: msg, isError: isErr })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const fetchAll = useCallback(async () => {
    try {
      const [eRes, pRes, sRes] = await Promise.all([
        fetch(`${API}/expenses`),
        fetch(`${API}/people`),
        fetch(`${API}/sources`)
      ])
      let expenses = await eRes.json()
      if (filterPerson.current) expenses = expenses.filter(e => e.person === filterPerson.current)
      if (filterSource.current) expenses = expenses.filter(e => e.source_type === filterSource.current)
      expenses.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      setExpenses(expenses)
      setPeople(await pRes.json())
      setSources(await sRes.json())

      const sumRes = await fetch(`${API}/summary`)
      setSummary(await sumRes.json())
    } catch {}
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  useEffect(() => {
    const interval = setInterval(fetchAll, 5000)
    return () => clearInterval(interval)
  }, [fetchAll])

  const setFilterPerson = (v) => { filterPerson.current = v; fetchAll() }
  const setFilterSource = (v) => { filterSource.current = v; fetchAll() }

  const addExpense = async (expense) => {
    try {
      const res = await fetch(`${API}/expenses`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expense)
      })
      if (!res.ok) { const err = await res.json(); showToast(err.error, true); return }
      showToast('Expense added!')
      await fetchAll()
    } catch { showToast('Failed to add', true) }
  }

  const deleteExpense = async (id) => {
    try {
      await fetch(`${API}/expenses/${id}`, { method: 'DELETE' })
      showToast('Expense deleted!')
      await fetchAll()
    } catch { showToast('Failed to delete', true) }
  }

  const recordPayment = async (id, amount) => {
    try {
      const res = await fetch(`${API}/expenses/${id}/pay`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      })
      if (!res.ok) { const err = await res.json(); showToast(err.error, true); return }
      showToast(`Payment of \u20B9${amount.toFixed(2)} recorded!`)
      await fetchAll()
    } catch { showToast('Failed to record payment', true) }
  }

  const addPerson = async (name) => {
    try {
      const res = await fetch(`${API}/people`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      })
      if (!res.ok) { const err = await res.json(); showToast(err.error, true); return false }
      showToast(`${name} added!`)
      await fetchAll()
      return true
    } catch { showToast('Failed', true); return false }
  }

  const deletePerson = async (name) => {
    try {
      const res = await fetch(`${API}/people/${encodeURIComponent(name)}`, { method: 'DELETE' })
      if (!res.ok) { const err = await res.json(); showToast(err.error, true); return }
      showToast(`${name} removed!`)
      await fetchAll()
    } catch { showToast('Failed', true) }
  }

  const addSource = async (name, source_type) => {
    try {
      const res = await fetch(`${API}/sources`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, source_type })
      })
      if (!res.ok) { const err = await res.json(); showToast(err.error, true); return false }
      showToast(`${name} added!`)
      await fetchAll()
      return true
    } catch { showToast('Failed', true); return false }
  }

  const deleteSource = async (id) => {
    try {
      const res = await fetch(`${API}/sources/${id}`, { method: 'DELETE' })
      if (!res.ok) { const err = await res.json(); showToast(err.error, true); return }
      showToast('Source removed!')
      await fetchAll()
    } catch { showToast('Failed', true) }
  }

  return {
    expenses, people, sources, summary, toast,
    filterPerson: filterPerson.current, filterSource: filterSource.current,
    setFilterPerson, setFilterSource,
    addExpense, deleteExpense, recordPayment,
    addPerson, deletePerson, addSource, deleteSource,
    syncFromServer: fetchAll
  }
}
