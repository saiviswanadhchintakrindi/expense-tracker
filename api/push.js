const webpush = require("web-push");
const db = require("./db");

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || "";

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(
    "mailto:expense@tracker.app",
    VAPID_PUBLIC,
    VAPID_PRIVATE
  );
}

const COLLECTION = "pushSubscriptions";

function endpointId(endpoint) {
  return encodeURIComponent(endpoint);
}

async function addSubscription(sub) {
  const id = endpointId(sub.endpoint);

  await db.setDoc(COLLECTION, id, {
    endpoint: sub.endpoint,
    keys: JSON.stringify(sub.keys)
  });

  const stats = await getStats();
  return stats.subscriptions;
}

async function removeSubscription(endpoint) {
  try {
    await db.deleteDoc(COLLECTION, endpointId(endpoint));
  } catch (_) {}
}

async function getSubscriptions() {
  const docs = await db.collection(COLLECTION);

  return docs.map(doc => ({
    endpoint: doc.endpoint,
    keys: JSON.parse(doc.keys)
  }));
}

async function sendToAll(payload) {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    return {
      sent: 0,
      failed: 0,
      total: 0,
      error: "VAPID keys not configured"
    };
  }

  const subscriptions = await getSubscriptions();

  let sent = 0;
  let failed = 0;

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(sub, JSON.stringify(payload));
      sent++;
    } catch (e) {
      failed++;

      if (e.statusCode === 404 || e.statusCode === 410) {
        await removeSubscription(sub.endpoint);
      }

      console.error(e);
    }
  }

  return {
    sent,
    failed,
    total: subscriptions.length
  };
}

async function getStats() {
  const docs = await db.collection(COLLECTION);

  return {
    subscriptions: docs.length,
    hasVapidKeys: !!(VAPID_PUBLIC && VAPID_PRIVATE)
  };
}

module.exports = {
  addSubscription,
  removeSubscription,
 sendToAll,
  getStats
};
