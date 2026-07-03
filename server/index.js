const express = require('express');
const path = require('path');
const app = require('../api/index');
const PORT = process.env.PORT || 3001;

app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));

app.get('/{*path}', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
