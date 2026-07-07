const webpush = require('web-push');

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || '';

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails('mailto:expense@tracker.app', VAPID_PUBLIC, VAPID_PRIVATE);
}

const subscriptions = [];

function addSubscription(sub) {
  const exists = subscriptions.find(s => s.endpoint === sub.endpoint);
  if (!exists) subscriptions.push(sub);
  return subscriptions.length;
}

function removeSubscription(endpoint) {
  const idx = subscriptions.findIndex(s => s.endpoint === endpoint);
  if (idx >= 0) subscriptions.splice(idx, 1);
}

async function sendToAll(payload) {
  if (!VAPID_PUBLIC) return { sent: 0, error: 'VAPID keys not configured' };
  const str = JSON.stringify(payload);
  let sent = 0, failed = 0;

  const toRemove = [];
  for (const sub of [...subscriptions]) {
    try {
      await webpush.sendNotification(sub, str);
      sent++;
    } catch (e) {
      if (e.statusCode === 410 || e.statusCode === 404) toRemove.push(sub.endpoint);
      else failed++;
    }
  }
  toRemove.forEach(removeSubscription);
  return { sent, failed, total: subscriptions.length };
}

function getStats() {
  return { subscriptions: subscriptions.length, hasVapidKeys: !!(VAPID_PUBLIC && VAPID_PRIVATE) };
}

module.exports = { addSubscription, removeSubscription, sendToAll, getStats };
