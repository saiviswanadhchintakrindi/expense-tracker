const admin = require('firebase-admin');

let db = null;

function getDb() {
  if (db) return db;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_CONFIG;
  if (!raw) {
    console.error('FIREBASE_SERVICE_ACCOUNT not set');
    return null;
  }

  try {
    const serviceAccount = JSON.parse(raw);
    if (serviceAccount.private_key && serviceAccount.private_key.includes('\\n')) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } catch (e) {
    console.error('Firebase init error:', e.message);
    return null;
  }

  db = admin.firestore();
  db.settings({ ignoreUndefinedProperties: true });
  return db;
}

module.exports = { getDb, FieldValue: admin.firestore.FieldValue, Timestamp: admin.firestore.Timestamp };
