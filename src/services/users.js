import { arrayRemove, arrayUnion, collection, doc, query, serverTimestamp, updateDoc, where, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase.js';
import { stageAudit } from './audit.js';

export const usersQuery = () => collection(db, 'users');
export const ownersQuery = () => query(collection(db, 'users'), where('role', '==', 'owner'));

export async function updateDisplayName(uid, displayName) {
  await updateDoc(doc(db, 'users', uid), { displayName: displayName.trim() });
}

export async function setFavorite(uid, shopId, on) {
  await updateDoc(doc(db, 'users', uid), { favorites: on ? arrayUnion(shopId) : arrayRemove(shopId) });
}

export async function mergeFavorites(uid, shopIds) {
  if (!shopIds.length) return;
  await updateDoc(doc(db, 'users', uid), { favorites: arrayUnion(...shopIds) });
}

/** Admin only. Rules enforce this; the UI also hides the control from everyone else. */
export async function setUserAccess(target, { role, shopIds }) {
  if (role === 'owner' && shopIds.length === 0) {
    throw new Error('Link at least one store before making someone a store owner.');
  }
  const batch = writeBatch(db);
  batch.update(doc(db, 'users', target.id), {
    role,
    shopIds: role === 'owner' ? shopIds : [],
    updatedAt: serverTimestamp(),
  });
  stageAudit(batch, 'USER_ACCESS_CHANGED', `${target.email} is now ${role}${role === 'owner' ? ` for ${shopIds.length} store(s)` : ''}`, 'user', target.id);
  await batch.commit();
}
