import { Timestamp, collection, doc, query, serverTimestamp, where, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase.js';
import { ValidationError, clean, hasErrors, validateOffer } from '../lib/schemas.js';
import { stageAudit } from './audit.js';

export const publishedOffersQuery = () => query(collection(db, 'offers'), where('published', '==', true));
export const shopOffersQuery = (shopId) =>
  query(collection(db, 'offers'), where('shopId', '==', shopId), where('published', '==', true));
export const staffShopOffersQuery = (shopId) => query(collection(db, 'offers'), where('shopId', '==', shopId));
export const allOffersQuery = () => collection(db, 'offers');

export function isCurrent(offer, now = new Date()) {
  const end = offer.endsAt?.toDate?.() ?? new Date(offer.endsAt);
  return end >= now;
}

export async function saveOffer(data, id = null) {
  const errors = validateOffer(data);
  if (hasErrors(errors)) throw new ValidationError(errors);
  const payload = clean({
    kind: data.kind,
    title: data.title.trim(),
    description: data.description?.trim() ?? '',
    shopId: data.shopId || null,
    shopName: data.shopId ? data.shopName ?? '' : '',
    imageUrl: data.imageUrl ?? '',
    location: data.location?.trim() ?? '',
    code: data.code?.trim().toUpperCase() ?? '',
    startsAt: Timestamp.fromDate(new Date(data.startsAt)),
    endsAt: Timestamp.fromDate(new Date(data.endsAt)),
    published: Boolean(data.published),
  });
  const batch = writeBatch(db);
  const ref = id ? doc(db, 'offers', id) : doc(collection(db, 'offers'));
  if (id) {
    batch.update(ref, { ...payload, updatedAt: serverTimestamp() });
    stageAudit(batch, 'OFFER_UPDATED', payload.title, 'offer', id);
  } else {
    batch.set(ref, { ...payload, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    stageAudit(batch, 'OFFER_CREATED', payload.title, 'offer', ref.id);
  }
  await batch.commit();
  return ref.id;
}

export async function deleteOffer(offer) {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'offers', offer.id));
  stageAudit(batch, 'OFFER_DELETED', offer.title, 'offer', offer.id);
  await batch.commit();
}

export async function setOfferPublished(offer, published) {
  const batch = writeBatch(db);
  batch.update(doc(db, 'offers', offer.id), { published, updatedAt: serverTimestamp() });
  stageAudit(batch, published ? 'OFFER_PUBLISHED' : 'OFFER_UNPUBLISHED', offer.title, 'offer', offer.id);
  await batch.commit();
}
