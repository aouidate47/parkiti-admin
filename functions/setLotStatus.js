// functions/setLotStatus.js
//
// Callable Cloud Function: the ONLY way the owner console changes anything.
// It re-checks the owner role server-side (never trust the client token
// alone) and writes an audit trail alongside the status change.
//
// Deploy: add this file's export to your functions/index.js, e.g.
//   exports.setLotStatus = require('./setLotStatus').setLotStatus;
// then: firebase deploy --only functions:setLotStatus

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

if (!admin.apps.length) admin.initializeApp();

exports.setLotStatus = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Sign in required.');
  }

  const { lotId, status } = request.data || {};
  if (!lotId || !['active', 'suspended'].includes(status)) {
    throw new HttpsError('invalid-argument', 'lotId and a valid status ("active" | "suspended") are required.');
  }

  // Re-verify owner role server-side — do not trust a client-set claim alone.
  const callerDoc = await admin.firestore().collection('users').doc(uid).get();
  if (callerDoc.data()?.role !== 'owner') {
    throw new HttpsError('permission-denied', 'Only owner accounts can change lot status.');
  }

  await admin.firestore().collection('parkingLots').doc(lotId).update({
    status,
    statusUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    statusUpdatedBy: uid,
  });

  return { success: true, lotId, status };
});
