import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, it } from 'vitest';

// Storage rules look up the caller's role in Firestore (cross-service). Some sandboxes cannot route that
// lookup between the two emulators, which makes every positive case fail for reasons unrelated to the
// rules. Run with RUN_STORAGE_RULES=1 on a normal machine or in CI.
const enabled = process.env.RUN_STORAGE_RULES === '1';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getBytes, deleteObject } from 'firebase/storage';

let env;
beforeAll(async () => {
  if (!enabled) return;
  env = await initializeTestEnvironment({
    projectId: 'demo-mercatora',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
    storage: { rules: readFileSync('storage.rules', 'utf8'), host: '127.0.0.1', port: 9199 },
  });
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users/admin'), { role: 'admin', shopIds: [] });
    await setDoc(doc(db, 'users/ownerA'), { role: 'owner', shopIds: ['shopA'] });
    await setDoc(doc(db, 'users/shopper'), { role: 'shopper', shopIds: [] });
  });
});
afterAll(async () => env?.cleanup());

const st = (uid) => (uid ? env.authenticatedContext(uid).storage() : env.unauthenticatedContext().storage());
const png = new Uint8Array([137, 80, 78, 71]);
const meta = { contentType: 'image/png' };

describe.skipIf(!enabled)('storage rules', () => {
  it('lets an owner upload to their own shop folder', async () => {
    await assertSucceeds(uploadBytes(ref(st('ownerA'), 'media/shops/shopA/logo.png'), png, meta));
    await assertSucceeds(uploadBytes(ref(st('ownerA'), 'media/products/shopA/p.png'), png, meta));
    await assertSucceeds(uploadBytes(ref(st('ownerA'), 'media/offers/shopA/o.png'), png, meta));
  });
  it('blocks owners from other shops and mall wide offers', async () => {
    await assertFails(uploadBytes(ref(st('ownerA'), 'media/shops/shopB/logo.png'), png, meta));
    await assertFails(uploadBytes(ref(st('ownerA'), 'media/offers/mall/o.png'), png, meta));
  });
  it('lets admins upload anywhere', async () => {
    await assertSucceeds(uploadBytes(ref(st('admin'), 'media/offers/mall/o.png'), png, meta));
    await assertSucceeds(uploadBytes(ref(st('admin'), 'media/shops/shopB/logo.png'), png, meta));
  });
  it('blocks shoppers and guests', async () => {
    await assertFails(uploadBytes(ref(st('shopper'), 'media/shops/shopA/x.png'), png, meta));
    await assertFails(uploadBytes(ref(st(null), 'media/shops/shopA/x.png'), png, meta));
  });
  it('blocks non images and oversized files', async () => {
    await assertFails(uploadBytes(ref(st('ownerA'), 'media/shops/shopA/x.html'), png, { contentType: 'text/html' }));
    await assertFails(uploadBytes(ref(st('ownerA'), 'media/shops/shopA/big.png'), new Uint8Array(5 * 1024 * 1024 + 10), meta));
  });
  it('is public to read, and closed elsewhere', async () => {
    await assertSucceeds(getBytes(ref(st(null), 'media/shops/shopA/logo.png')));
    await assertFails(uploadBytes(ref(st('admin'), 'random/file.png'), png, meta));
  });
  it('lets staff delete in scope only', async () => {
    await assertSucceeds(deleteObject(ref(st('ownerA'), 'media/shops/shopA/logo.png')));
    await assertFails(deleteObject(ref(st('ownerA'), 'media/shops/shopB/logo.png')));
  });
});
