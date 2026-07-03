const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// ── Health ──
app.get('/api/health', async (_req, res) => {
  try {
    const config = db.getConfig();
    if (!config) return res.status(503).json({ error: 'Service account not configured' });
    const data = await db.collection('people');
    res.json({ ok: true, people: data.length });
  } catch (e) {
    res.status(503).json({ error: e.message });
  }
});

// ── Seed ──
(async () => {
  try {
    const people = await db.collection('people');
    if (people.length === 0) {
      for (const p of ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'])
        await db.addDoc('people', { name: p });
      await db.addDoc('sources', { name: 'HDFC Credit Card', source_type: 'credit_card' });
      await db.addDoc('sources', { name: 'SBI Bank Account', source_type: 'bank' });
    }
  } catch {}
})();

// ── People ──
app.get('/api/people', async (_req, res) => {
  try {
    const data = await db.collection('people');
    res.json(data.map(d => d.name).sort());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/people', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Name required' });
    const existing = await db.getDoc('people', name.trim());
    if (existing) return res.status(409).json({ error: 'Already exists' });
    await db.addDoc('people', { name: name.trim() });
    res.status(201).json({ name: name.trim() });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/people/:name', async (req, res) => {
  try {
    const expenses = await db.queryCollection('expenses', 'person', 'EQUAL', req.params.name);
    if (expenses.length > 0) return res.status(400).json({ error: 'Has expenses' });
    await db.deleteDoc('people', req.params.name);
    res.json({ message: 'Removed' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Sources ──
app.get('/api/sources', async (_req, res) => {
  try {
    const data = await db.collection('sources');
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/sources', async (req, res) => {
  try {
    const { name, source_type } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Name required' });
    if (!['credit_card', 'bank'].includes(source_type)) return res.status(400).json({ error: 'Invalid type' });
    const result = await db.addDoc('sources', { name: name.trim(), source_type });
    res.status(201).json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/sources/:id', async (req, res) => {
  try {
    const src = await db.getDoc('sources', req.params.id);
    if (!src) return res.status(404).json({ error: 'Not found' });
    const expenses = await db.queryCollection('expenses', 'source_name', 'EQUAL', src.name);
    if (expenses.length > 0) return res.status(400).json({ error: 'Has expenses' });
    await db.deleteDoc('sources', req.params.id);
    res.json({ message: 'Removed' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Expenses ──
app.get('/api/expenses', async (req, res) => {
  try {
    const { person, source_type, sort } = req.query;
    const filters = [];
    if (person) filters.push({ field: 'person', op: 'EQUAL', value: person });
    if (source_type) filters.push({ field: 'source_type', op: 'EQUAL', value: source_type });
    const orderField = sort === 'amount' ? 'amount' : 'created_at';
    const orderDir = sort === 'amount' ? 'DESCENDING' : 'DESCENDING';
    const data = await db.queryAll('expenses', filters, orderField, orderDir);
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/expenses', async (req, res) => {
  try {
    const { person, amount, description, notes, source_type, source_name } = req.body;
    if (!person || !amount || !description) return res.status(400).json({ error: 'Required: person, amount, description' });
    const pCheck = await db.getDoc('people', person);
    if (!pCheck) return res.status(400).json({ error: 'Invalid person: ' + person });
    const expense = {
      person, amount: String(parseFloat(amount)), paid_amount: '0',
      description, notes: notes || '',
      source_type: source_type || 'credit_card', source_name: source_name || '',
      created_at: new Date().toISOString()
    };
    const result = await db.addDoc('expenses', expense);
    res.status(201).json({ ...result, amount: parseFloat(result.amount), paid_amount: 0 });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/expenses/:id/pay', async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid amount required' });
    const exp = await db.getDoc('expenses', req.params.id);
    if (!exp) return res.status(404).json({ error: 'Not found' });
    const expAmt = parseFloat(exp.amount);
    const expPaid = parseFloat(exp.paid_amount || '0');
    const remaining = expAmt - expPaid;
    if (amount > remaining) return res.status(400).json({ error: `Exceeds ₹${remaining.toFixed(2)}` });
    await db.updateDoc('expenses', req.params.id, { ...exp, paid_amount: String(expPaid + parseFloat(amount)) });
    await db.addSubDoc('expenses', req.params.id, 'payments', { amount: String(parseFloat(amount)), paid_at: new Date().toISOString() });
    const updated = await db.getDoc('expenses', req.params.id);
    res.json({ ...updated, amount: parseFloat(updated.amount), paid_amount: parseFloat(updated.paid_amount || '0') });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/expenses/:id', async (req, res) => {
  try {
    const exp = await db.getDoc('expenses', req.params.id);
    if (!exp) return res.status(404).json({ error: 'Not found' });
    const { person, amount, description, notes } = req.body;
    if (person) exp.person = person;
    if (amount !== undefined) exp.amount = String(parseFloat(amount));
    if (description) exp.description = description;
    if (notes !== undefined) exp.notes = notes;
    await db.updateDoc('expenses', req.params.id, exp);
    res.json({ ...exp, amount: parseFloat(exp.amount), paid_amount: parseFloat(exp.paid_amount || '0') });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/expenses/:id', async (req, res) => {
  try {
    await db.deleteDoc('expenses', req.params.id);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Summary ──
app.get('/api/summary', async (req, res) => {
  try {
    const { source_type } = req.query;
    const filters = source_type ? [{ field: 'source_type', op: 'EQUAL', value: source_type }] : [];
    const expenses = await db.queryAll('expenses', filters, 'created_at', 'DESCENDING');
    if (!expenses.length) return res.json({ summary: [], expensesByPerson: {}, grand_total: 0, paid_total: 0, remaining_total: 0 });

    const expensesByPerson = {};
    const byPerson = {};
    for (const e of expenses) {
      e.amount = parseFloat(e.amount);
      e.paid_amount = parseFloat(e.paid_amount || '0');
      if (!byPerson[e.person]) byPerson[e.person] = { total: 0, paid: 0, count: 0 };
      byPerson[e.person].total += e.amount;
      byPerson[e.person].paid += e.paid_amount;
      byPerson[e.person].count++;
      if (!expensesByPerson[e.person]) expensesByPerson[e.person] = [];
      expensesByPerson[e.person].push(e);
    }

    for (const person of Object.keys(expensesByPerson)) {
      for (const exp of expensesByPerson[person]) {
        try {
          const payments = await db.listSubcollection('expenses', exp.id, 'payments');
          exp.payments = payments.map(p => ({ ...p, amount: parseFloat(p.amount || '0') }));
        } catch { exp.payments = []; }
      }
    }

    const summary = Object.entries(byPerson).map(([person, d]) => ({
      person, expense_count: d.count,
      total_amount: +d.total.toFixed(2), paid_amount: +d.paid.toFixed(2),
      remaining: +(d.total - d.paid).toFixed(2)
    })).sort((a, b) => b.remaining - a.remaining);

    const grand = +expenses.reduce((s, e) => s + e.amount, 0).toFixed(2);
    const paid = +expenses.reduce((s, e) => s + e.paid_amount, 0).toFixed(2);
    res.json({ summary, expensesByPerson, grand_total: grand, paid_total: paid, remaining_total: +(grand - paid).toFixed(2) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = app;
