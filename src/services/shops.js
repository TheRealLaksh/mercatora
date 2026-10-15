import { collection, doc, getDocs, query, serverTimestamp, where, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase.js';
import { ValidationError, clean, hasErrors, validateShop } from '../lib/schemas.js';
import { normaliseUrl } from '../lib/validate.js';
import { stageAudit } from './audit.js';

export const publicShopsQuery = () => query(collection(db, 'shops'), where('status', '==', 'active'));
export const allShopsQuery = () => collection(db, 'shops');

function shape(d) {
  return clean({
    name: d.name?.trim(),
    category: d.category,
    floor: d.floor,
    unitId: d.unitId,
    tagline: d.tagline?.trim() ?? '',
    description: d.description?.trim() ?? '',
    phone: d.phone?.trim() ?? '',
    email: d.email?.trim() ?? '',
    website: normaliseUrl(d.website ?? ''),
    logoUrl: d.logoUrl ?? '',
    coverUrl: d.coverUrl ?? '',
    hours: d.hours,
    tags: (d.tags ?? []).map((t) => t.trim()).filter(Boolean).slice(0, 8),
    featured: Boolean(d.featured),
    ownerName: d.ownerName?.trim() || '',
    status: d.status ?? 'active',
  });
}

export async function createShop(data, id = null) {
  const errors = validateShop(data);
  if (hasErrors(errors)) throw new ValidationError(errors);
  const ref = id ? doc(db, 'shops', id) : doc(collection(db, 'shops'));
  const payload = { ...shape(data), createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
  const batch = writeBatch(db);
  batch.set(ref, payload);
  stageAudit(batch, 'SHOP_CREATED', `${payload.name} on floor ${payload.floor}, unit ${payload.unitId}`, 'shop', ref.id);
  await batch.commit();
  return ref.id;
}

/** Admins can change anything. Owners are limited by rules to the fields in OWNER_FIELDS. */
export const OWNER_FIELDS = ['tagline', 'description', 'hours', 'phone', 'email', 'website', 'logoUrl', 'coverUrl', 'tags'];

export async function updateShop(id, data, { ownerOnly = false } = {}) {
  const errors = validateShop(data, { ownerOnly });
  if (hasErrors(errors)) throw new ValidationError(errors);
  const full = shape(data);
  const patch = ownerOnly ? Object.fromEntries(OWNER_FIELDS.map((k) => [k, full[k]]).filter(([, v]) => v !== undefined)) : full;
  const batch = writeBatch(db);
  batch.update(doc(db, 'shops', id), { ...patch, updatedAt: serverTimestamp() });
  stageAudit(batch, 'SHOP_UPDATED', `${data.name ?? id} updated${ownerOnly ? ' by owner' : ''}`, 'shop', id);
  await batch.commit();
}

export async function setShopStatus(shop, status) {
  const batch = writeBatch(db);
  batch.update(doc(db, 'shops', shop.id), { status, updatedAt: serverTimestamp() });
  stageAudit(batch, status === 'active' ? 'SHOP_RESTORED' : 'SHOP_ARCHIVED', shop.name, 'shop', shop.id);
  await batch.commit();
}

async function deleteAll(refs) {
  for (let i = 0; i < refs.length; i += 400) {
    const batch = writeBatch(db);
    refs.slice(i, i + 400).forEach((r) => batch.delete(r));
    await batch.commit();
  }
}

/** Removes the shop and everything that hangs off it, and unlinks its owners. */
export async function deleteShopCascade(shop) {
  const byShop = (name) => getDocs(query(collection(db, name), where('shopId', '==', shop.id)));
  const [products, offers, reviews, reservations, owners] = await Promise.all([
    byShop('products'),
    byShop('offers'),
    byShop('reviews'),
    byShop('reservations'),
    getDocs(query(collection(db, 'users'), where('shopIds', 'array-contains', shop.id))),
  ]);
  const refs = [...products.docs, ...offers.docs, ...reviews.docs, ...reservations.docs].map((d) => d.ref);
  await deleteAll(refs);

  const batch = writeBatch(db);
  owners.docs.forEach((d) => {
    const remaining = (d.data().shopIds ?? []).filter((s) => s !== shop.id);
    batch.update(d.ref, { shopIds: remaining, role: remaining.length ? 'owner' : 'shopper' });
  });
  batch.delete(doc(db, 'shops', shop.id));
  stageAudit(
    batch,
    'SHOP_DELETED',
    `${shop.name} deleted with ${products.size} products, ${reviews.size} reviews, ${offers.size} offers`,
    'shop',
    shop.id,
  );
  await batch.commit();
  return { products: products.size, reviews: reviews.size, offers: offers.size, reservations: reservations.size };
}
