import { collection, deleteDoc, doc, getDoc, query, serverTimestamp, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore';
import { auth, db } from '../lib/firebase.js';
import { ValidationError, hasErrors, validateReview } from '../lib/schemas.js';
import { stageAudit } from './audit.js';

export const reviewId = (shopId, uid) => `${shopId}_${uid}`;

/** All published reviews. The directory aggregates these into ratings. */
export const publishedReviewsQuery = () => query(collection(db, 'reviews'), where('status', '==', 'published'));
export const shopReviewsQuery = (shopId) =>
  query(collection(db, 'reviews'), where('shopId', '==', shopId), where('status', '==', 'published'));
export const staffShopReviewsQuery = (shopId) => query(collection(db, 'reviews'), where('shopId', '==', shopId));
export const allReviewsQuery = () => collection(db, 'reviews');

export async function getMyReview(shopId, uid) {
  const snap = await getDoc(doc(db, 'reviews', reviewId(shopId, uid)));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function saveReview({ shopId, rating, text, authorName }) {
  const user = auth.currentUser;
  if (!user) throw new Error('Sign in to leave a review.');
  const body = { rating, text: (text ?? '').trim() };
  const errors = validateReview(body);
  if (hasErrors(errors)) throw new ValidationError(errors);
  const ref = doc(db, 'reviews', reviewId(shopId, user.uid));
  const existing = await getDoc(ref);
  if (existing.exists()) {
    await updateDoc(ref, { ...body, updatedAt: serverTimestamp() });
  } else {
    await setDoc(ref, {
      shopId,
      uid: user.uid,
      authorName: authorName || user.displayName || 'A shopper',
      ...body,
      status: 'published',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

export async function deleteMyReview(shopId) {
  const user = auth.currentUser;
  await deleteDoc(doc(db, 'reviews', reviewId(shopId, user.uid)));
}

export async function setReviewStatus(review, status) {
  const batch = writeBatch(db);
  batch.update(doc(db, 'reviews', review.id), { status });
  stageAudit(batch, status === 'hidden' ? 'REVIEW_HIDDEN' : 'REVIEW_RESTORED', `Review by ${review.authorName}`, 'review', review.id);
  await batch.commit();
}

export async function adminDeleteReview(review) {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'reviews', review.id));
  stageAudit(batch, 'REVIEW_DELETED', `Review by ${review.authorName}`, 'review', review.id);
  await batch.commit();
}

export async function replyToReview(review, reply) {
  await updateDoc(doc(db, 'reviews', review.id), { reply: reply.trim(), repliedAt: serverTimestamp() });
}
