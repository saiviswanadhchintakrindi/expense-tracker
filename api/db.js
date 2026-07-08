const crypto = require('crypto');

let config = null;
let accessToken = null;
let tokenExpiry = 0;

function getConfig() {
  if (config) return config;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;
  try {
    const sa = JSON.parse(raw);
    if (sa.private_key && sa.private_key.includes('\\n')) {
      sa.private_key = sa.private_key.replace(/\\n/g, '\n');
    }
    config = sa;
    return sa;
  } catch { return null; }
}

async function getAccessToken() {
  const sa = getConfig();
  if (!sa) throw new Error('Service account not configured');
  if (accessToken && Date.now() < tokenExpiry) return accessToken;

  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: sa.token_uri,
    exp: now + 3600,
    iat: now
  };

  const enc = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const jwt = enc(header) + '.' + enc(claim);
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(jwt);
  const sig = sign.sign(sa.private_key, 'base64url');
  const signed = jwt + '.' + sig;

  const res = await fetch(sa.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${signed}`
  });
  const data = await res.json();
  accessToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return accessToken;
}

const PROJECT = 'expense-tracking-2906c';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

async function firestore(method, path, body) {
  const token = await getAccessToken();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  if (res.status === 204 || res.headers.get('content-length') === '0') return null;
  return res.json();
}

function fromDoc(doc) {
  const fields = doc.fields || {};
  const result = { id: doc.name.split('/').pop() };
  for (const [k, v] of Object.entries(fields)) {
    if (v.integerValue !== undefined) result[k] = parseInt(v.integerValue);
    else if (v.doubleValue !== undefined) result[k] = v.doubleValue;
    else if (v.stringValue !== undefined) {
      const s = v.stringValue;
      result[k] = !isNaN(s) && s !== '' ? parseFloat(s) : s;
    }
    else if (v.booleanValue !== undefined) result[k] = v.booleanValue;
    else if (v.timestampValue !== undefined) result[k] = v.timestampValue;
    else if (v.nullValue !== undefined) result[k] = null;
  }
  return result;
}

function toFields(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) fields[k] = { nullValue: null };
    else if (typeof v === 'number' && !isNaN(v)) fields[k] = { doubleValue: v };
    else if (typeof v === 'boolean') fields[k] = { booleanValue: v };
    else if (typeof v === 'string') fields[k] = { stringValue: v };
    else fields[k] = { stringValue: String(v) };
  }
  return fields;
}

async function collection(name) {
  const data = await firestore('GET', `/${name}`);
  return (data.documents || []).map(fromDoc);
}

async function getDoc(collectionName, docId) {
  try {
    const data = await firestore('GET', `/${collectionName}/${docId}`);
    return data ? fromDoc(data) : null;
  } catch (e) {
    if (e.message?.includes('404') || e.message?.includes('NOT_FOUND')) return null;
    throw e;
  }
}

async function addDoc(collectionName, obj) {
  const body = { fields: toFields(obj) };
  const data = await firestore('POST', `/${collectionName}`, body);
  return { id: data.name.split('/').pop(), ...obj };
}

async function updateDoc(collectionName, docId, obj) {
  const body = { fields: toFields(obj) };
  await firestore('PATCH', `/${collectionName}/${docId}`, body);
}

async function deleteDoc(collectionName, docId) {
  await firestore(
    "DELETE",
    `/${collectionName}/${encodeURIComponent(docId)}`
  );
}

async function listSubcollection(parentCol, parentId, subCol) {
  const data = await firestore('GET', `/${parentCol}/${parentId}/${subCol}`);
  return (data.documents || []).map(fromDoc);
}

async function addSubDoc(parentCol, parentId, subCol, obj) {
  const body = { fields: toFields(obj) };
  await firestore('POST', `/${parentCol}/${parentId}/${subCol}`, body);
}

async function setDoc(collectionName, docId, obj) {
  const body = { fields: toFields(obj) };

  try {
    // Try updating the document first
    await firestore(
      "PATCH",
      `/${collectionName}/${encodeURIComponent(docId)}`,
      body
    );
  } catch (e) {
    // If it doesn't exist, create it
    if (
      e.message.includes("NOT_FOUND") ||
      e.message.includes("404")
    ) {
      await firestore(
        "POST",
        `/${collectionName}?documentId=${encodeURIComponent(docId)}`,
        body
      );
    } else {
      throw e;
    }
  }

  return { id: docId, ...obj };
}
module.exports = {
  collection, getDoc, addDoc, updateDoc, deleteDoc,
  listSubcollection, addSubDoc, setDoc, getConfig
};
