import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { Timestamp, addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';

let env;
const hour = 3600 * 1000;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-mercatora',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
    storage: { rules: readFileSync('storage.rules', 'utf8'), host: '127.0.0.1', port: 9199 },
  });
});
afterAll(async () => env?.cleanup());

const as = (uid) => env.authenticatedContext(uid).firestore();
const guest = () => env.unauthenticatedContext().firestore();

const hours = Object.fromEntries(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((d) => [d, { open: '10:00', close: '22:00', closed: false }]));
const shop = (over = {}) => ({ name: 'Kaveri Loom', category: 'Fashion', floor: 'G', unitId: 'G-02', status: 'active', tagline: 'x', description: 'y', hours, ...over });
const product = (shopId, over = {}) => ({ shopId, name: 'Saree', price: 100, stock: 5, status: 'active', ...over });

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users/admin'), { role: 'admin', displayName: 'Admin', email: 'a@x.com', shopIds: [], favorites: [] });
    await setDoc(doc(db, 'users/ownerA'), { role: 'owner', displayName: 'Owner A', email: 'oa@x.com', shopIds: ['shopA'], favorites: [] });
    await setDoc(doc(db, 'users/ownerB'), { role: 'owner', displayName: 'Owner B', email: 'ob@x.com', shopIds: ['shopB'], favorites: [] });
    await setDoc(doc(db, 'users/shopper'), { role: 'shopper', displayName: 'Shopper', email: 's@x.com', shopIds: [], favorites: [] });
    await setDoc(doc(db, 'users/shopper2'), { role: 'shopper', displayName: 'Shopper 2', email: 's2@x.com', shopIds: [], favorites: [] });
    await setDoc(doc(db, 'shops/shopA'), shop());
    await setDoc(doc(db, 'shops/shopB'), shop({ name: 'Other', unitId: 'G-03' }));
    await setDoc(doc(db, 'shops/hidden'), shop({ name: 'Hidden', status: 'inactive', unitId: 'G-04' }));
    await setDoc(doc(db, 'products/pA'), product('shopA'));
    await setDoc(doc(db, 'products/draftA'), product('shopA', { status: 'draft' }));
    await setDoc(doc(db, 'offers/live'), { kind: 'offer', title: 'Live', startsAt: Timestamp.now(), endsAt: Timestamp.fromMillis(Date.now() + hour), published: true, shopId: 'shopA' });
    await setDoc(doc(db, 'offers/draft'), { kind: 'offer', title: 'Draft', startsAt: Timestamp.now(), endsAt: Timestamp.fromMillis(Date.now() + hour), published: false, shopId: 'shopA' });
  });
});

describe('users', () => {
  it('lets someone create their own shopper profile', async () => {
    await assertSucceeds(setDoc(doc(as('newbie'), 'users/newbie'), { displayName: 'N', email: 'n@x.com', role: 'shopper', shopIds: [], favorites: [], createdAt: serverTimestamp() }));
  });
  it('blocks creating a profile with a higher role', async () => {
    await assertFails(setDoc(doc(as('newbie'), 'users/newbie'), { displayName: 'N', email: 'n@x.com', role: 'admin', shopIds: [], favorites: [], createdAt: serverTimestamp() }));
  });
  it('blocks creating a profile with shop links', async () => {
    await assertFails(setDoc(doc(as('newbie'), 'users/newbie'), { displayName: 'N', email: 'n@x.com', role: 'shopper', shopIds: ['shopA'], favorites: [], createdAt: serverTimestamp() }));
  });
  it('blocks creating a profile for someone else', async () => {
    await assertFails(setDoc(doc(as('newbie'), 'users/other'), { displayName: 'N', email: 'n@x.com', role: 'shopper', shopIds: [], favorites: [], createdAt: serverTimestamp() }));
  });
  it('blocks self promotion', async () => {
    await assertFails(updateDoc(doc(as('shopper'), 'users/shopper'), { role: 'admin' }));
    await assertFails(updateDoc(doc(as('ownerA'), 'users/ownerA'), { shopIds: ['shopA', 'shopB'] }));
  });
  it('allows updating favourites and display name', async () => {
    await assertSucceeds(updateDoc(doc(as('shopper'), 'users/shopper'), { favorites: ['shopA'], displayName: 'New' }));
  });
  it('lets only admins change roles', async () => {
    await assertSucceeds(updateDoc(doc(as('admin'), 'users/shopper'), { role: 'owner', shopIds: ['shopA'] }));
  });
  it('hides other people profiles', async () => {
    await assertFails(getDoc(doc(as('shopper'), 'users/shopper2')));
    await assertFails(getDocs(collection(guest(), 'users')));
    await assertSucceeds(getDoc(doc(as('shopper'), 'users/shopper')));
    await assertSucceeds(getDocs(collection(as('admin'), 'users')));
  });
});

describe('shops', () => {
  it('shows live shops to guests but hides archived ones', async () => {
    await assertSucceeds(getDoc(doc(guest(), 'shops/shopA')));
    await assertFails(getDoc(doc(guest(), 'shops/hidden')));
    await assertSucceeds(getDocs(query(collection(guest(), 'shops'), where('status', '==', 'active'))));
    await assertFails(getDocs(collection(guest(), 'shops')));
  });
  it('lets admins and owners see an archived shop they manage', async () => {
    await assertSucceeds(getDoc(doc(as('admin'), 'shops/hidden')));
    await assertSucceeds(getDocs(collection(as('admin'), 'shops')));
  });
  it('only admins create or delete shops', async () => {
    await assertSucceeds(setDoc(doc(as('admin'), 'shops/new'), shop({ unitId: 'G-09' })));
    await assertFails(setDoc(doc(as('ownerA'), 'shops/new2'), shop()));
    await assertFails(setDoc(doc(as('shopper'), 'shops/new3'), shop()));
    await assertFails(deleteDoc(doc(as('ownerA'), 'shops/shopA')));
    await assertSucceeds(deleteDoc(doc(as('admin'), 'shops/shopA')));
  });
  it('rejects invalid shop data even from admins', async () => {
    await assertFails(setDoc(doc(as('admin'), 'shops/bad'), shop({ category: 'Weapons' })));
    await assertFails(setDoc(doc(as('admin'), 'shops/bad'), shop({ floor: '9' })));
    await assertFails(setDoc(doc(as('admin'), 'shops/bad'), shop({ name: '' })));
  });
  it('lets an owner edit only the public profile of their own shop', async () => {
    await assertSucceeds(updateDoc(doc(as('ownerA'), 'shops/shopA'), { tagline: 'New tagline', phone: '1', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(as('ownerA'), 'shops/shopA'), { name: 'Renamed' }));
    await assertFails(updateDoc(doc(as('ownerA'), 'shops/shopA'), { status: 'inactive' }));
    await assertFails(updateDoc(doc(as('ownerA'), 'shops/shopA'), { unitId: 'G-10' }));
    await assertFails(updateDoc(doc(as('ownerA'), 'shops/shopA'), { featured: true }));
    await assertFails(updateDoc(doc(as('ownerA'), 'shops/shopB'), { tagline: 'Not mine' }));
  });
});

describe('products', () => {
  it('shows only live products to the public', async () => {
    await assertSucceeds(getDoc(doc(guest(), 'products/pA')));
    await assertFails(getDoc(doc(guest(), 'products/draftA')));
    await assertSucceeds(getDocs(query(collection(guest(), 'products'), where('shopId', '==', 'shopA'), where('status', '==', 'active'))));
    await assertSucceeds(getDoc(doc(as('ownerA'), 'products/draftA')));
    await assertFails(getDoc(doc(as('ownerB'), 'products/draftA')));
  });
  it('lets owners manage their own catalog only', async () => {
    await assertSucceeds(addDoc(collection(as('ownerA'), 'products'), product('shopA')));
    await assertFails(addDoc(collection(as('ownerA'), 'products'), product('shopB')));
    await assertFails(addDoc(collection(as('shopper'), 'products'), product('shopA')));
    await assertFails(addDoc(collection(guest(), 'products'), product('shopA')));
    await assertSucceeds(updateDoc(doc(as('ownerA'), 'products/pA'), { stock: 3 }));
    await assertFails(updateDoc(doc(as('ownerB'), 'products/pA'), { stock: 0 }));
    await assertSucceeds(deleteDoc(doc(as('ownerA'), 'products/pA')));
  });
  it('lets admins manage any catalog', async () => {
    await assertSucceeds(updateDoc(doc(as('admin'), 'products/pA'), { price: 50 }));
  });
  it('rejects bad numbers', async () => {
    await assertFails(addDoc(collection(as('ownerA'), 'products'), product('shopA', { stock: -1 })));
    await assertFails(addDoc(collection(as('ownerA'), 'products'), product('shopA', { price: -5 })));
    await assertFails(addDoc(collection(as('ownerA'), 'products'), product('shopA', { stock: 1.5 })));
    await assertFails(addDoc(collection(as('ownerA'), 'products'), product('shopA', { status: 'weird' })));
  });
  it('lets clients probe for a missing product without an error', async () => {
    await assertSucceeds(getDoc(doc(guest(), 'products/ghost')));
    await assertSucceeds(getDoc(doc(as('ownerA'), 'products/ghost')));
  });
  it('does not let a product move to another shop', async () => {
    await assertFails(updateDoc(doc(as('ownerA'), 'products/pA'), { shopId: 'shopB' }));
  });
  it('accepts a null original price', async () => {
    await assertSucceeds(addDoc(collection(as('ownerA'), 'products'), product('shopA', { mrp: null })));
  });
});

const reservation = (over = {}) => ({
  shopId: 'shopA', shopName: 'Kaveri Loom', shopperUid: 'shopper', shopperName: 'Shopper', phone: '+91 98765 43210', note: '', pickupWindow: 'Today',
  items: [{ productId: 'pA', name: 'Saree', price: 100, qty: 1, imageUrl: '' }], total: 100, code: 'ABC234', status: 'requested', createdAt: serverTimestamp(), updatedAt: serverTimestamp(), ...over,
});

describe('reservations', () => {
  it('lets a signed in shopper reserve in their own name', async () => {
    await assertSucceeds(addDoc(collection(as('shopper'), 'reservations'), reservation()));
  });
  it('blocks guests and impersonation', async () => {
    await assertFails(addDoc(collection(guest(), 'reservations'), reservation()));
    await assertFails(addDoc(collection(as('shopper2'), 'reservations'), reservation()));
  });
  it('blocks self confirming and bad shapes', async () => {
    await assertFails(addDoc(collection(as('shopper'), 'reservations'), reservation({ status: 'confirmed' })));
    await assertFails(addDoc(collection(as('shopper'), 'reservations'), reservation({ items: [] })));
    await assertFails(addDoc(collection(as('shopper'), 'reservations'), reservation({ code: 'AB' })));
    await assertFails(addDoc(collection(as('shopper'), 'reservations'), reservation({ shopId: 'hidden' })));
    await assertFails(addDoc(collection(as('shopper'), 'reservations'), reservation({ sneaky: true })));
  });

  async function make(status = 'requested') {
    let id;
    await env.withSecurityRulesDisabled(async (ctx) => {
      const ref = await addDoc(collection(ctx.firestore(), 'reservations'), { ...reservation({ status }), createdAt: Timestamp.now(), updatedAt: Timestamp.now() });
      id = ref.id;
    });
    return id;
  }

  it('shows a reservation only to its shopper and the shop staff', async () => {
    const id = await make();
    await assertSucceeds(getDoc(doc(as('shopper'), 'reservations', id)));
    await assertSucceeds(getDoc(doc(as('ownerA'), 'reservations', id)));
    await assertSucceeds(getDoc(doc(as('admin'), 'reservations', id)));
    await assertFails(getDoc(doc(as('shopper2'), 'reservations', id)));
    await assertFails(getDoc(doc(as('ownerB'), 'reservations', id)));
    await assertSucceeds(getDocs(query(collection(as('shopper'), 'reservations'), where('shopperUid', '==', 'shopper'))));
    await assertFails(getDocs(collection(as('shopper'), 'reservations')));
    await assertSucceeds(getDocs(query(collection(as('ownerA'), 'reservations'), where('shopId', '==', 'shopA'))));
  });
  it('lets the shop confirm and move it along, but nobody else', async () => {
    const id = await make();
    await assertSucceeds(updateDoc(doc(as('ownerA'), 'reservations', id), { status: 'confirmed', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(as('ownerB'), 'reservations', id), { status: 'ready' }));
    await assertFails(updateDoc(doc(as('shopper2'), 'reservations', id), { status: 'ready' }));
  });
  it('stops staff from editing money or the code', async () => {
    const id = await make();
    await assertFails(updateDoc(doc(as('ownerA'), 'reservations', id), { total: 1 }));
    await assertFails(updateDoc(doc(as('ownerA'), 'reservations', id), { code: 'ZZZZZZ' }));
  });
  it('lets a shopper withdraw only while it is still requested', async () => {
    const id = await make('requested');
    await assertFails(updateDoc(doc(as('shopper'), 'reservations', id), { status: 'confirmed' }));
    await assertSucceeds(updateDoc(doc(as('shopper'), 'reservations', id), { status: 'cancelled', updatedAt: serverTimestamp() }));
    const held = await make('confirmed');
    await assertFails(updateDoc(doc(as('shopper'), 'reservations', held), { status: 'cancelled' }));
  });
  it('only admins delete', async () => {
    const id = await make();
    await assertFails(deleteDoc(doc(as('ownerA'), 'reservations', id)));
    await assertSucceeds(deleteDoc(doc(as('admin'), 'reservations', id)));
  });
});

const review = (uid, over = {}) => ({ shopId: 'shopA', uid, authorName: 'Shopper', rating: 5, text: 'Great', status: 'published', createdAt: serverTimestamp(), updatedAt: serverTimestamp(), ...over });

describe('reviews', () => {
  it('lets a shopper review once with the right id', async () => {
    await assertSucceeds(setDoc(doc(as('shopper'), 'reviews/shopA_shopper'), review('shopper')));
    await assertFails(setDoc(doc(as('shopper'), 'reviews/random-id'), review('shopper')));
    await assertFails(setDoc(doc(as('shopper2'), 'reviews/shopA_shopper'), review('shopper')));
  });
  it('rejects out of range ratings and forced status', async () => {
    await assertFails(setDoc(doc(as('shopper'), 'reviews/shopA_shopper'), review('shopper', { rating: 6 })));
    await assertFails(setDoc(doc(as('shopper'), 'reviews/shopA_shopper'), review('shopper', { rating: 0 })));
    await assertFails(setDoc(doc(as('shopper'), 'reviews/shopA_shopper'), review('shopper', { status: 'hidden' })));
  });
  it('lets a shopper check for their own missing review', async () => {
    await assertSucceeds(getDoc(doc(as('shopper'), 'reviews/shopA_shopper')));
  });
  it('blocks guests and owners reviewing their own shop', async () => {
    await assertFails(setDoc(doc(guest(), 'reviews/shopA_x'), review('x')));
    await assertFails(setDoc(doc(as('ownerA'), 'reviews/shopA_ownerA'), review('ownerA')));
    await assertSucceeds(setDoc(doc(as('ownerB'), 'reviews/shopA_ownerB'), review('ownerB')));
  });
  async function existing() {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'reviews/shopA_shopper'), { ...review('shopper'), createdAt: Timestamp.now(), updatedAt: Timestamp.now() });
    });
  }
  it('lets authors edit their text but not their identity, and hides hidden reviews from the public', async () => {
    await existing();
    await assertSucceeds(updateDoc(doc(as('shopper'), 'reviews/shopA_shopper'), { rating: 4, text: 'Edited', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(as('shopper'), 'reviews/shopA_shopper'), { uid: 'someone', rating: 4 }));
    await assertFails(updateDoc(doc(as('shopper'), 'reviews/shopA_shopper'), { status: 'hidden' }));
    await assertFails(updateDoc(doc(as('shopper2'), 'reviews/shopA_shopper'), { text: 'Hacked' }));
    await assertSucceeds(updateDoc(doc(as('admin'), 'reviews/shopA_shopper'), { status: 'hidden' }));
    await assertFails(getDoc(doc(guest(), 'reviews/shopA_shopper')));
    await assertSucceeds(getDoc(doc(as('shopper'), 'reviews/shopA_shopper')));
  });
  it('lets the shop owner reply, and only reply', async () => {
    await existing();
    await assertSucceeds(updateDoc(doc(as('ownerA'), 'reviews/shopA_shopper'), { reply: 'Thanks', repliedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(as('ownerA'), 'reviews/shopA_shopper'), { rating: 1 }));
    await assertFails(updateDoc(doc(as('ownerA'), 'reviews/shopA_shopper'), { status: 'hidden' }));
    await assertFails(updateDoc(doc(as('ownerB'), 'reviews/shopA_shopper'), { reply: 'Not mine' }));
  });
  it('lets authors and admins delete', async () => {
    await existing();
    await assertFails(deleteDoc(doc(as('shopper2'), 'reviews/shopA_shopper')));
    await assertSucceeds(deleteDoc(doc(as('shopper'), 'reviews/shopA_shopper')));
  });
});

const offer = (over = {}) => ({ kind: 'offer', title: 'Sale', startsAt: Timestamp.now(), endsAt: Timestamp.fromMillis(Date.now() + hour), published: true, shopId: 'shopA', ...over });

describe('offers', () => {
  it('shows published offers publicly and drafts only to staff', async () => {
    await assertSucceeds(getDoc(doc(guest(), 'offers/live')));
    await assertFails(getDoc(doc(guest(), 'offers/draft')));
    await assertSucceeds(getDoc(doc(as('ownerA'), 'offers/draft')));
    await assertSucceeds(getDocs(query(collection(guest(), 'offers'), where('published', '==', true))));
  });
  it('lets owners manage their own offers and admins manage mall wide ones', async () => {
    await assertSucceeds(addDoc(collection(as('ownerA'), 'offers'), offer()));
    await assertFails(addDoc(collection(as('ownerA'), 'offers'), offer({ shopId: 'shopB' })));
    await assertFails(addDoc(collection(as('ownerA'), 'offers'), offer({ shopId: null })));
    await assertSucceeds(addDoc(collection(as('admin'), 'offers'), offer({ shopId: null })));
    await assertFails(addDoc(collection(as('shopper'), 'offers'), offer()));
  });
  it('blocks owners from reassigning an offer to another shop', async () => {
    await assertFails(updateDoc(doc(as('ownerA'), 'offers/live'), { shopId: 'shopB' }));
  });
  it('rejects an end before the start', async () => {
    await assertFails(addDoc(collection(as('admin'), 'offers'), offer({ endsAt: Timestamp.fromMillis(Date.now() - hour) })));
  });
});

describe('audit log', () => {
  const entry = (uid, over = {}) => ({ action: 'TEST', details: 'x', entity: 'shop', entityId: 'a', performedBy: 'a@x.com', uid, timestamp: serverTimestamp(), ...over });
  it('lets staff append, never edit or delete', async () => {
    let id;
    await assertSucceeds(addDoc(collection(as('admin'), 'logs'), entry('admin')));
    await assertSucceeds(addDoc(collection(as('ownerA'), 'logs'), entry('ownerA')));
    await env.withSecurityRulesDisabled(async (ctx) => {
      id = (await addDoc(collection(ctx.firestore(), 'logs'), { ...entry('admin'), timestamp: Timestamp.now() })).id;
    });
    await assertFails(updateDoc(doc(as('admin'), 'logs', id), { details: 'tampered' }));
    await assertFails(deleteDoc(doc(as('admin'), 'logs', id)));
  });
  it('blocks shoppers, guests and forged identity or time', async () => {
    await assertFails(addDoc(collection(as('shopper'), 'logs'), entry('shopper')));
    await assertFails(addDoc(collection(guest(), 'logs'), entry('x')));
    await assertFails(addDoc(collection(as('admin'), 'logs'), entry('someoneElse')));
    await assertFails(addDoc(collection(as('admin'), 'logs'), entry('admin', { timestamp: Timestamp.fromMillis(0) })));
  });
  it('is readable only by admins', async () => {
    await assertSucceeds(getDocs(collection(as('admin'), 'logs')));
    await assertFails(getDocs(collection(as('ownerA'), 'logs')));
    await assertFails(getDocs(collection(guest(), 'logs')));
  });
});

describe('settings and everything else', () => {
  it('settings are public to read and admin only to write', async () => {
    await assertSucceeds(getDoc(doc(guest(), 'settings/mall')));
    await assertSucceeds(setDoc(doc(as('admin'), 'settings/mall'), { name: 'M' }));
    await assertFails(setDoc(doc(as('ownerA'), 'settings/mall'), { name: 'M' }));
  });
  it('unknown collections are closed', async () => {
    await assertFails(getDoc(doc(as('admin'), 'secrets/x')));
    await assertFails(setDoc(doc(as('admin'), 'secrets/x'), { a: 1 }));
  });
});
