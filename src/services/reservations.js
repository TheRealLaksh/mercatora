import {
  collection,
  doc,
  getDoc,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase.js';
import { pickupCode } from '../lib/code.js';
import { groupByShop } from '../lib/cartMath.js';
import { ValidationError, hasErrors, validateContact } from '../lib/schemas.js';
import { stageAudit } from './audit.js';

export const myReservationsQuery = (uid) => query(collection(db, 'reservations'), where('shopperUid', '==', uid));
export const shopReservationsQuery = (shopId) => query(collection(db, 'reservations'), where('shopId', '==', shopId));
export const allReservationsQuery = () => collection(db, 'reservations');

/**
 * Turns the bag into one reservation per store. Prices and stock are re-read from
 * Firestore so a stale bag can never reserve something that has sold out or changed price.
 * Returns { created: [{id, shopName, code, total}], problems: [string] }.
 */
export async function createReservations({ items, contact, pickupWindow }) {
  const user = auth.currentUser;
  if (!user) throw new Error('Sign in to reserve.');
  const errors = validateContact(contact);
  if (hasErrors(errors)) throw new ValidationError(errors);
  if (!items.length) throw new Error('Your bag is empty.');

  const problems = [];
  const fresh = [];
  for (const item of items) {
    const snap = await getDoc(doc(db, 'products', item.productId));
    const p = snap.exists() ? snap.data() : null;
    if (!p || p.status !== 'active') {
      problems.push(`${item.name} is no longer available.`);
      continue;
    }
    if (p.stock < 1) {
      problems.push(`${item.name} is out of stock.`);
      continue;
    }
    const qty = Math.min(item.qty, p.stock);
    if (qty < item.qty) problems.push(`Only ${p.stock} of ${item.name} left, so we reserved ${qty}.`);
    fresh.push({ ...item, name: p.name, price: p.price, qty, imageUrl: p.imageUrl ?? '', shopId: p.shopId });
  }
  if (!fresh.length) throw new Error(problems[0] ?? 'Nothing in your bag can be reserved.');

  const groups = groupByShop(fresh);
  const batch = writeBatch(db);
  const created = [];
  for (const g of groups) {
    const ref = doc(collection(db, 'reservations'));
    const code = pickupCode();
    batch.set(ref, {
      shopId: g.shopId,
      shopName: g.shopName,
      shopperUid: user.uid,
      shopperName: contact.name.trim(),
      phone: contact.phone.trim(),
      note: contact.note?.trim() ?? '',
      pickupWindow: pickupWindow ?? '',
      items: g.items.map((i) => ({
        productId: i.productId,
        name: i.name,
        price: i.price,
        qty: i.qty,
        imageUrl: i.imageUrl ?? '',
      })),
      total: g.total,
      code,
      status: 'requested',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    created.push({ id: ref.id, shopName: g.shopName, code, total: g.total });
  }
  await batch.commit();
  return { created, problems };
}

export async function cancelOwn(reservationId) {
  await updateDoc(doc(db, 'reservations', reservationId), { status: 'cancelled', updatedAt: serverTimestamp() });
}

export const TRANSITIONS = {
  requested: ['confirmed', 'cancelled'],
  confirmed: ['ready', 'cancelled', 'expired'],
  ready: ['collected', 'cancelled', 'expired'],
  collected: [],
  cancelled: [],
  expired: [],
};

const HOLDS_STOCK = new Set(['confirmed', 'ready']);

/**
 * Staff action. Confirming holds stock by decrementing it; cancelling or expiring a held
 * reservation puts it back. All inside one transaction with its audit entry.
 */
export async function moveReservation(reservationId, next, { staffNote } = {}) {
  await runTransaction(db, async (tx) => {
    const ref = doc(db, 'reservations', reservationId);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('That reservation no longer exists.');
    const r = snap.data();
    if (!TRANSITIONS[r.status]?.includes(next)) {
      throw new Error(`A ${r.status} reservation cannot become ${next}.`);
    }

    const needsStock = r.status === 'requested' && next === 'confirmed';
    const releasesStock = HOLDS_STOCK.has(r.status) && (next === 'cancelled' || next === 'expired');
    const productSnaps = needsStock || releasesStock ? await Promise.all(r.items.map((i) => tx.get(doc(db, 'products', i.productId)))) : [];

    if (needsStock) {
      productSnaps.forEach((ps, idx) => {
        const item = r.items[idx];
        if (!ps.exists()) throw new Error(`${item.name} has been removed from the catalog.`);
        if (ps.data().stock < item.qty) {
          throw new Error(`Not enough stock for ${item.name}. ${ps.data().stock} left, ${item.qty} requested.`);
        }
      });
      productSnaps.forEach((ps, idx) => {
        tx.update(ps.ref, { stock: ps.data().stock - r.items[idx].qty, updatedAt: serverTimestamp() });
      });
    }
    if (releasesStock) {
      productSnaps.forEach((ps, idx) => {
        if (ps.exists()) tx.update(ps.ref, { stock: ps.data().stock + r.items[idx].qty, updatedAt: serverTimestamp() });
      });
    }

    tx.update(ref, {
      status: next,
      updatedAt: serverTimestamp(),
      ...(staffNote !== undefined ? { staffNote } : {}),
    });
    stageAudit(tx, `RESERVATION_${next.toUpperCase()}`, `${r.shopName}, code ${r.code}, ${r.items.length} item(s)`, 'reservation', reservationId);
  });
}
