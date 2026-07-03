const express = require('express');
const cors = require('cors');
const { getDb, getFieldValue } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

function serialize(doc) {
  const d = doc.data();
  const result = { id: doc.id, ...d };
  if (d.created_at && d.created_at.toDate) result.created_at = d.created_at.toDate().toISOString();
  if (d.paid_at && d.paid_at.toDate) result.paid_at = d.paid_at.toDate().toISOString();
  return result;
}

// ── Health / Debug ──
app.get('/api/health', async (_req, res) => {
  try {
    const db = getDb();
    if (!db) return res.status(503).json({
      error: 'DB not configured',
      hasEnv: !!(process.env.FIREBASE_SERVICE_ACCOUNT),
      envLen: (process.env.FIREBASE_SERVICE_ACCOUNT || '').length
    });
    const snap = await db.collection('people').limit(1).get();
    res.json({ ok: true, people: snap.size });
  } catch (e) {
    res.status(503).json({ error: 'DB unreachable', detail: e.message });
  }
});

// ── Seed ──
(async () => {
  const db = getDb();
  if (!db) return;
  const snap = await db.collection('people').limit(1).get();
  if (snap.empty) {
    for (const p of ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'])
      await db.collection('people').doc(p).set({ name: p });
    await db.collection('sources').add({ name: 'HDFC Credit Card', source_type: 'credit_card' });
    await db.collection('sources').add({ name: 'SBI Bank Account', source_type: 'bank' });
  }
})();

// ── People ──
app.get('/api/people', async (_req, res) => {
  const db = getDb();
  if (!db) return res.status(503).json({ error: 'DB not configured' });
  const snap = await db.collection('people').orderBy('name').get();
  res.json(snap.docs.map(d => d.data().name));
});

app.post('/api/people', async (req, res) => {
  const db = getDb();
  if (!db) return res.status(503).json({ error: 'DB not configured' });
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name required' });
  const doc = await db.collection('people').doc(name.trim()).get();
  if (doc.exists) return res.status(409).json({ error: 'Already exists' });
  await db.collection('people').doc(name.trim()).set({ name: name.trim() });
  res.status(201).json({ name: name.trim() });
});

app.delete('/api/people/:name', async (req, res) => {
  const db = getDb();
  if (!db) return res.status(503).json({ error: 'DB not configured' });
  const snap = await db.collection('expenses').where('person', '==', req.params.name).limit(1).get();
  if (!snap.empty) return res.status(400).json({ error: 'Has expenses' });
  await db.collection('people').doc(req.params.name).delete();
  res.json({ message: 'Removed' });
});

// ── Sources ──
app.get('/api/sources', async (_req, res) => {
  const db = getDb();
  if (!db) return res.status(503).json({ error: 'DB not configured' });
  const snap = await db.collection('sources').orderBy('name').get();
  res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
});

app.post('/api/sources', async (req, res) => {
  const db = getDb();
  if (!db) return res.status(503).json({ error: 'DB not configured' });
  const { name, source_type } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name required' });
  if (!['credit_card', 'bank'].includes(source_type)) return res.status(400).json({ error: 'Invalid type' });
  const snap = await db.collection('sources').where('name', '==', name.trim()).limit(1).get();
  if (!snap.empty) return res.status(409).json({ error: 'Already exists' });
  const ref = await db.collection('sources').add({ name: name.trim(), source_type });
  res.status(201).json({ id: ref.id, name: name.trim(), source_type });
});

app.delete('/api/sources/:id', async (req, res) => {
  const db = getDb();
  if (!db) return res.status(503).json({ error: 'DB not configured' });
  const doc = await db.collection('sources').doc(req.params.id).get();
  if (!doc.exists) return res.status(404).json({ error: 'Not found' });
  const snap = await db.collection('expenses').where('source_name', '==', doc.data().name).limit(1).get();
  if (!snap.empty) return res.status(400).json({ error: 'Has expenses' });
  await db.collection('sources').doc(req.params.id).delete();
  res.json({ message: 'Removed' });
});

// ── Expenses ──
app.get('/api/expenses', async (req, res) => {
  const db = getDb();
  if (!db) return res.status(503).json({ error: 'DB not configured' });
  let query = db.collection('expenses');
  const { person, source_type, sort } = req.query;
  if (person) query = query.where('person', '==', person);
  if (source_type) query = query.where('source_type', '==', source_type);
  if (sort === 'amount') query = query.orderBy('amount', 'desc');
  else query = query.orderBy('created_at', 'desc');
  const snap = await query.get();
  res.json(snap.docs.map(serialize));
});

app.post('/api/expenses', async (req, res) => {
  try {
    const db = getDb();
    if (!db) return res.status(503).json({ error: 'DB not configured' });
    const { person, amount, description, notes, source_type, source_name } = req.body;
    if (!person || !amount || !description) return res.status(400).json({ error: 'Required: person, amount, description' });

    const pDoc = await db.collection('people').doc(person).get();
    if (!pDoc.exists) return res.status(400).json({ error: 'Invalid person: ' + person });

    const expense = {
      person, amount: parseFloat(amount), paid_amount: 0,
      description, notes: notes || '',
      source_type: source_type || 'credit_card', source_name: source_name || '',
      created_at: getFieldValue().serverTimestamp()
    };
    const ref = await db.collection('expenses').add(expense);
    res.status(201).json({
      id: ref.id, ...expense,
      created_at: new Date().toISOString(),
      paid_amount: 0
    });
  } catch (e) {
    console.error('Add expense:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/expenses/:id/pay', async (req, res) => {
  const db = getDb();
  if (!db) return res.status(503).json({ error: 'DB not configured' });
  const { amount } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid amount required' });
  const doc = await db.collection('expenses').doc(req.params.id).get();
  if (!doc.exists) return res.status(404).json({ error: 'Not found' });
  const exp = doc.data();
  const remaining = exp.amount - (exp.paid_amount || 0);
  if (amount > remaining) return res.status(400).json({ error: `Exceeds ₹${remaining.toFixed(2)}` });
  await db.collection('expenses').doc(req.params.id).update({ paid_amount: getFieldValue().increment(parseFloat(amount)) });
  await db.collection('expenses').doc(req.params.id).collection('payments').add({
    amount: parseFloat(amount), paid_at: getFieldValue().serverTimestamp()
  });
  const updated = await db.collection('expenses').doc(req.params.id).get();
  res.json(serialize(updated));
});

app.put('/api/expenses/:id', async (req, res) => {
  const db = getDb();
  if (!db) return res.status(503).json({ error: 'DB not configured' });
  const doc = await db.collection('expenses').doc(req.params.id).get();
  if (!doc.exists) return res.status(404).json({ error: 'Not found' });
  const { person, amount, description, notes } = req.body;
  const update = {};
  if (person) update.person = person;
  if (amount !== undefined) update.amount = parseFloat(amount);
  if (description) update.description = description;
  if (notes !== undefined) update.notes = notes;
  await db.collection('expenses').doc(req.params.id).update(update);
  const updated = await db.collection('expenses').doc(req.params.id).get();
  res.json(serialize(updated));
});

app.delete('/api/expenses/:id', async (req, res) => {
  const db = getDb();
  if (!db) return res.status(503).json({ error: 'DB not configured' });
  const payments = await db.collection('expenses').doc(req.params.id).collection('payments').get();
  const batch = db.batch();
  payments.docs.forEach(d => batch.delete(d.ref));
  batch.delete(db.collection('expenses').doc(req.params.id));
  await batch.commit();
  res.json({ message: 'Deleted' });
});

// ── Summary ──
app.get('/api/summary', async (req, res) => {
  const db = getDb();
  if (!db) return res.status(503).json({ error: 'DB not configured' });
  let query = db.collection('expenses');
  if (req.query.source_type) query = query.where('source_type', '==', req.query.source_type);
  const snap = await query.get();
  const all = snap.docs.map(serialize);
  if (!all.length) return res.json({ summary: [], expensesByPerson: {}, grand_total: 0, paid_total: 0, remaining_total: 0 });

  const paymentsByExpense = {};
  for (const e of all) {
    const pSnap = await db.collection('expenses').doc(e.id).collection('payments').orderBy('paid_at', 'desc').get();
    paymentsByExpense[e.id] = pSnap.docs.map(d => {
      const p = { id: d.id, ...d.data() };
      if (p.paid_at && p.paid_at.toDate) p.paid_at = p.paid_at.toDate().toISOString();
      return p;
    });
  }

  const byPerson = {};
  const expensesByPerson = {};
  for (const e of all) {
    if (!byPerson[e.person]) byPerson[e.person] = { total: 0, paid: 0, count: 0 };
    byPerson[e.person].total += e.amount;
    byPerson[e.person].paid += e.paid_amount || 0;
    byPerson[e.person].count++;
    if (!expensesByPerson[e.person]) expensesByPerson[e.person] = [];
    expensesByPerson[e.person].push({ ...e, payments: paymentsByExpense[e.id] || [] });
  }

  const summary = Object.entries(byPerson).map(([person, d]) => ({
    person, expense_count: d.count, total_amount: +d.total.toFixed(2),
    paid_amount: +d.paid.toFixed(2), remaining: +(d.total - d.paid).toFixed(2)
  })).sort((a, b) => b.remaining - a.remaining);

  const grand = +all.reduce((s, e) => s + e.amount, 0).toFixed(2);
  const paid = +all.reduce((s, e) => s + (e.paid_amount || 0), 0).toFixed(2);
  res.json({ summary, expensesByPerson, grand_total: grand, paid_total: paid, remaining_total: +(grand - paid).toFixed(2) });
});

module.exports = app;
