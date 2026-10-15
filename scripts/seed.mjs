// Seeds the LOCAL Firebase emulators only. It refuses to run against production.
// Usage: npm run emulators   (in one terminal)   then   npm run seed
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';
import { DEFAULT_SETTINGS } from '../src/lib/constants.js';
import { PASSWORD, PEOPLE, REVIEW_TEXT, SHOPS } from './seed-data.mjs';

const PROJECT = 'demo-mercatora';
const HOST = process.env.EMULATOR_HOST || '127.0.0.1';
process.env.FIRESTORE_EMULATOR_HOST = `${HOST}:8080`;
process.env.FIREBASE_AUTH_EMULATOR_HOST = `${HOST}:9099`;
process.env.GCLOUD_PROJECT = PROJECT;

initializeApp({ projectId: PROJECT });
const auth = getAuth();
const db = getFirestore();

// Deterministic pseudo random so every seed run builds the same mall.
let s = 20261015;
const rand = () => {
  s = (s * 1664525 + 1013904223) % 4294967296;
  return s / 4294967296;
};
const pick = (arr) => arr[Math.floor(rand() * arr.length)];

const day = 86400000;
const now = Date.now();
const ts = (offsetDays, hour = 10) => {
  const d = new Date(now + offsetDays * day);
  d.setHours(hour, 0, 0, 0);
  return Timestamp.fromDate(d);
};

async function reachable() {
  try {
    const res = await fetch(`http://${HOST}:8080/`);
    return res.ok || res.status === 404;
  } catch {
    return false;
  }
}

async function wipe() {
  await fetch(`http://${HOST}:8080/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: 'DELETE' });
  await fetch(`http://${HOST}:9099/emulator/v1/projects/${PROJECT}/accounts`, { method: 'DELETE' });
}

async function writeAll(ops) {
  for (let i = 0; i < ops.length; i += 400) {
    const batch = db.batch();
    ops.slice(i, i + 400).forEach(([ref, data]) => batch.set(ref, data));
    await batch.commit();
  }
}

async function main() {
  if (!(await reachable())) {
    console.error(`Could not reach the Firestore emulator at ${HOST}:8080. Run "npm run emulators" first.`);
    process.exit(1);
  }
  console.log('Clearing the emulators');
  await wipe();

  // ---- people ----
  console.log('Creating accounts');
  const uids = {};
  for (const p of PEOPLE) {
    const u = await auth.createUser({ email: p.email, password: PASSWORD, displayName: p.name, emailVerified: true });
    uids[p.key] = u.uid;
  }

  // ---- shops ----
  console.log('Creating stores and products');
  const ops = [];
  const shopIds = {};
  const productIdsByShop = {};
  for (const sh of SHOPS) {
    const ref = db.collection('shops').doc();
    shopIds[sh.key] = ref.id;
    const unitId = `${sh.floor}-${String(sh.unit).padStart(2, '0')}`;
    ops.push([
      ref,
      {
        name: sh.name,
        category: sh.category,
        floor: sh.floor,
        unitId,
        tagline: sh.tagline,
        description: sh.description,
        phone: sh.phone ?? '',
        email: sh.email ?? '',
        website: sh.website ?? '',
        logoUrl: '',
        coverUrl: '',
        tags: sh.tags ?? [],
        featured: Boolean(sh.featured),
        ownerName: PEOPLE.find((p) => p.shops?.includes(sh.key))?.name ?? '',
        status: 'active',
        hours: sh.hours,
        createdAt: Timestamp.fromDate(new Date(now - (60 - SHOPS.indexOf(sh)) * day)),
        updatedAt: FieldValue.serverTimestamp(),
      },
    ]);
    productIdsByShop[sh.key] = [];
    sh.products.forEach(([name, category, price, mrp, stock, description], i) => {
      const pref = db.collection('products').doc();
      const data = {
          shopId: ref.id,
          name,
          category,
          description,
          price,
          mrp,
          stock,
          imageUrl: '',
          status: 'active',
          createdAt: Timestamp.fromDate(new Date(now - (SHOPS.indexOf(sh) * 5 + i) * 3600 * 1000)),
          updatedAt: FieldValue.serverTimestamp(),
        };
      productIdsByShop[sh.key].push({ id: pref.id, name, price, data });
      ops.push([pref, data]);
    });
  }
  // a draft and an archived product so the console filters have something to show
  const draftRef = db.collection('products').doc();
  ops.push([draftRef, { shopId: shopIds.kaveri, name: 'Bridal banarasi saree (coming soon)', category: 'Sarees', description: 'Photography in progress.', price: 56000, mrp: null, stock: 2, imageUrl: '', status: 'draft', createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() }]);

  // ---- users ----
  for (const p of PEOPLE) {
    ops.push([
      db.collection('users').doc(uids[p.key]),
      {
        displayName: p.name,
        email: p.email,
        role: p.role,
        shopIds: (p.shops ?? []).map((k) => shopIds[k]),
        favorites: p.key === 'shopper' ? [shopIds.kaveri, shopIds.pages, shopIds.roasters] : [],
        createdAt: Timestamp.fromDate(new Date(now - 30 * day)),
      },
    ]);
  }

  // ---- reviews ----
  console.log('Creating reviews');
  const reviewers = PEOPLE.filter((p) => p.role === 'shopper' && p.key !== 'shopper');
  const bias = { kaveri: 5, lumen: 5, pages: 5, masala: 5, casa: 4, voltix: 4, cinema: 4, salon: 3 };
  for (const sh of SHOPS) {
    const n = 3 + Math.floor(rand() * 3);
    const chosen = [...reviewers].sort(() => rand() - 0.5).slice(0, Math.min(n, reviewers.length));
    for (const [i, r] of chosen.entries()) {
      const base = bias[sh.key] ?? 4;
      const rating = Math.max(2, Math.min(5, base + (rand() < 0.35 ? -1 : 0) + (rand() < 0.15 ? 1 : 0)));
      const id = `${shopIds[sh.key]}_${uids[r.key]}`;
      ops.push([
        db.collection('reviews').doc(id),
        {
          shopId: shopIds[sh.key],
          uid: uids[r.key],
          authorName: r.name,
          rating,
          text: pick(REVIEW_TEXT[rating]),
          status: 'published',
          createdAt: Timestamp.fromDate(new Date(now - (5 + i * 7 + Math.floor(rand() * 20)) * day)),
          updatedAt: FieldValue.serverTimestamp(),
          ...(sh.key === 'kaveri' && i === 0 ? { reply: 'Thank you so much. Our weavers will be delighted to hear this.', repliedAt: FieldValue.serverTimestamp() } : {}),
        },
      ]);
    }
  }

  // ---- offers and events ----
  console.log('Creating offers and events');
  const offer = (o) => [db.collection('offers').doc(), { published: true, imageUrl: '', location: '', code: '', description: '', shopId: null, shopName: '', createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(), ...o }];
  ops.push(
    offer({ kind: 'offer', title: 'Festive Fortnight', description: 'Up to 40% off across fashion, home and electronics, plus free gift wrapping at every store.', startsAt: ts(-3), endsAt: ts(11, 23), location: 'All floors', code: 'FESTIVE40' }),
    offer({ kind: 'event', title: 'Diwali Lights Weekend', description: 'Live sitar, rangoli workshops and a lantern parade through the atrium. Free entry, all ages.', startsAt: ts(2, 17), endsAt: ts(3, 22), location: 'Atrium, Ground Floor' }),
    offer({ kind: 'offer', title: 'Handloom Fortnight, 20% off sarees', description: 'Meet the weavers and enjoy 20% off every handloom saree for two weeks.', startsAt: ts(-1), endsAt: ts(13, 21), shopId: shopIds.kaveri, shopName: 'Kaveri Loom', location: 'Ground Floor' }),
    offer({ kind: 'offer', title: 'Exchange and upgrade', description: 'Trade in any working phone and get up to Rs 8,000 off a new one.', startsAt: ts(0), endsAt: ts(20, 22), shopId: shopIds.voltix, shopName: 'Voltix', code: 'TRADEUP' }),
    offer({ kind: 'event', title: 'Chef\'s table: the pepper menu', description: 'Seven courses built around black pepper, with wine pairings. Limited to twelve guests.', startsAt: ts(6, 19), endsAt: ts(6, 22), shopId: shopIds.masala, shopName: 'Masala Library', location: 'Level 2' }),
    offer({ kind: 'event', title: 'Second Saturday reading', description: 'A local author reads from their new novel, followed by a signing.', startsAt: ts(5, 17), endsAt: ts(5, 19), shopId: shopIds.pages, shopName: 'Pages & Paper', location: 'Level 2' }),
    offer({ kind: 'offer', title: 'Buy two scoops, get one free', description: 'Every weekday after 3 PM.', startsAt: ts(-2), endsAt: ts(9, 23), shopId: shopIds.gelato, shopName: 'Gelato Lane' }),
    offer({ kind: 'offer', title: 'Midweek movie pass', description: 'Two tickets for the price of one, Monday to Wednesday.', startsAt: ts(0), endsAt: ts(25, 23), shopId: shopIds.cinema, shopName: 'Grand Screens Cinema', code: 'MIDWEEK' }),
    offer({ kind: 'event', title: 'Winter Market', description: 'Seventy independent makers, hot chocolate and live acoustic sets.', startsAt: ts(21, 11), endsAt: ts(23, 21), location: 'Atrium, Ground Floor' }),
    offer({ kind: 'offer', title: 'Monsoon Sale', description: 'Ended last month.', startsAt: ts(-40), endsAt: ts(-20), location: 'All floors' }),
    offer({ kind: 'offer', title: 'Draft: New Year preview', description: 'Not yet published.', published: false, startsAt: ts(30), endsAt: ts(40), location: 'All floors' }),
  );

  // ---- reservations ----
  console.log('Creating reservations');
  const mkRes = (shopKey, picks, status, ageHours, code, extra = {}) => {
    const items = picks.map(([idx, qty]) => {
      const p = productIdsByShop[shopKey][idx];
      // confirmed and ready reservations hold stock, exactly like the app does
      if (status === 'confirmed' || status === 'ready') p.data.stock -= qty;
      return { productId: p.id, name: p.name, price: p.price, qty, imageUrl: '' };
    });
    const sh = SHOPS.find((x) => x.key === shopKey);
    return [
      db.collection('reservations').doc(),
      {
        shopId: shopIds[shopKey],
        shopName: sh.name,
        shopperUid: uids[extra.who ?? 'shopper'],
        shopperName: PEOPLE.find((p) => p.key === (extra.who ?? 'shopper')).name,
        phone: '+91 98200 11223',
        note: extra.note ?? '',
        pickupWindow: 'Today, 4 PM to 9 PM',
        items,
        total: items.reduce((a, i) => a + i.price * i.qty, 0),
        code,
        status,
        createdAt: Timestamp.fromDate(new Date(now - ageHours * 3600 * 1000)),
        updatedAt: Timestamp.fromDate(new Date(now - (ageHours - 1) * 3600 * 1000)),
        ...(extra.staffNote ? { staffNote: extra.staffNote } : {}),
      },
    ];
  };
  ops.push(
    mkRes('kaveri', [[1, 1], [2, 2]], 'requested', 2, 'KV7P2M', { note: 'Gift wrap please.' }),
    mkRes('kaveri', [[3, 1]], 'requested', 5, 'KV9X4R', { who: 'aarav' }),
    mkRes('pages', [[0, 2], [2, 1]], 'ready', 20, 'PG4K8T', { staffNote: 'Ready at the front counter.' }),
    mkRes('roasters', [[0, 1]], 'collected', 72, 'RT2N6B'),
    mkRes('voltix', [[3, 2]], 'requested', 1, 'VX3H5C', { who: 'diya' }),
    mkRes('masala', [[1, 1], [2, 1]], 'confirmed', 3, 'MS6D2Q', { who: 'kabir' }),
    mkRes('casa', [[2, 1]], 'cancelled', 96, 'CN8F3W'),
  );

  // ---- settings and logs ----
  ops.push([db.collection('settings').doc('mall'), { ...DEFAULT_SETTINGS, updatedAt: FieldValue.serverTimestamp() }]);
  const logs = [
    ['SETTINGS_UPDATED', 'Mall information updated', 'settings', 'mall'],
    ['SHOP_CREATED', 'Kaveri Loom on floor G, unit G-02', 'shop', shopIds.kaveri],
    ['SHOP_CREATED', 'Voltix on floor 1, unit 1-02', 'shop', shopIds.voltix],
    ['USER_ACCESS_CHANGED', 'owner.kaveri@mercatora.test is now owner for 1 store(s)', 'user', uids['owner-kaveri']],
    ['PRODUCT_CREATED', 'Kanchipuram silk saree, wine and gold added', 'product', productIdsByShop.kaveri[0].id],
  ];
  logs.forEach(([action, details, entity, entityId], i) => {
    ops.push([db.collection('logs').doc(), { action, details, entity, entityId, performedBy: 'admin@mercatora.test', uid: uids.admin, timestamp: Timestamp.fromDate(new Date(now - (logs.length - i) * 3600 * 1000 * 5)) }]);
  });

  await writeAll(ops);

  console.log(`\nSeeded ${SHOPS.length} stores, ${SHOPS.reduce((n, x) => n + x.products.length, 0) + 1} products, ${PEOPLE.length} accounts.`);
  console.log(`\nSign in at http://localhost:5173 (run "npm run dev:emu") with the password ${PASSWORD}:`);
  for (const p of PEOPLE.slice(0, 5)) console.log(`  ${p.role.padEnd(8)} ${p.email}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
