const admin = require('firebase-admin');

let db = null;
let initialized = false;

function getDb() {
  if (db) return db;
  if (initialized) return null;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_CONFIG;
  if (!raw) {
    console.error('FIREBASE_SERVICE_ACCOUNT not set');
    initialized = true;
    return null;
  }

  try {
    const serviceAccount = JSON.parse(raw);
    if (serviceAccount.private_key && serviceAccount.private_key.includes('\\n')) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    if (!admin.apps.length) {
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    }
    db = admin.firestore();
    db.settings({ ignoreUndefinedProperties: true });
    return db;
  } catch (e) {
    console.error('Firebase init error:', e.message);
    initialized = true;
    return null;
  }
}

function getFieldValue() {
  return admin.firestore.FieldValue;
}

module.exports = { getDb, getFieldValue };
