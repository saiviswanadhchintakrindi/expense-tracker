const admin = require('firebase-admin');

let db = null;
let initError = null;

function getFieldValue() {
  return admin.firestore.FieldValue;
}

function getDb() {
  if (db) return db;
  if (initError) return null;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_CONFIG;
  if (!raw) {
    initError = 'FIREBASE_SERVICE_ACCOUNT not set';
    return null;
  }

  try {
    const serviceAccount = JSON.parse(raw);
    if (serviceAccount.private_key && serviceAccount.private_key.includes('\\n')) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    try {
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    } catch (e) {
      if (!e.message?.includes('already exists')) throw e;
    }
    db = admin.firestore();
    db.settings({ ignoreUndefinedProperties: true });
    return db;
  } catch (e) {
    initError = e.message;
    return null;
  }
}

function getInitError() { return initError; }

module.exports = { getDb, getFieldValue, getInitError };
