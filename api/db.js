const admin = require('firebase-admin');

let db = null;

function getDb() {
  if (db) return db;

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_CONFIG;

  if (!serviceAccount) {
    console.error('FIREBASE_SERVICE_ACCOUNT env var not set');
    return null;
  }

  try {
    const cred = JSON.parse(serviceAccount);
    admin.initializeApp({ credential: admin.credential.cert(cred) });
  } catch {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  }

  db = admin.firestore();
  db.settings({ ignoreUndefinedProperties: true });
  return db;
}

module.exports = { getDb, FieldValue: admin.firestore.FieldValue, Timestamp: admin.firestore.Timestamp };
