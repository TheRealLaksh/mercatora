import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase.js';

/**
 * Adds an audit entry to a write batch or transaction so the log and the change
 * either both land or both fail. Rules make the log append only.
 */
export function stageAudit(writer, action, details, entity = '', entityId = '') {
  const user = auth.currentUser;
  if (!user) return;
  writer.set(doc(collection(db, 'logs')), {
    action,
    details: String(details).slice(0, 400),
    entity,
    entityId,
    performedBy: user.email ?? 'unknown',
    uid: user.uid,
    timestamp: serverTimestamp(),
  });
}
