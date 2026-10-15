import { describe, expect, it } from 'vitest';
import { emptyWeek } from './hours.js';
import { clean, hasErrors, validateContact, validateOffer, validateProduct, validateReview, validateShop } from './schemas.js';

const goodShop = { name: 'Test', category: 'Fashion', floor: 'G', unitId: 'G-02', hours: emptyWeek() };

describe('validateShop', () => {
  it('accepts a valid shop', () => expect(hasErrors(validateShop(goodShop))).toBe(false));
  it('requires the core fields', () => {
    const e = validateShop({});
    expect(Object.keys(e)).toEqual(expect.arrayContaining(['name', 'category', 'floor', 'unitId']));
  });
  it('rejects a unit on another floor', () => expect(validateShop({ ...goodShop, unitId: '1-02' }).unitId).toBeDefined());
  it('rejects bad contact details', () => {
    const e = validateShop({ ...goodShop, email: 'nope', phone: '12', website: 'not a url' });
    expect(Object.keys(e)).toEqual(expect.arrayContaining(['email', 'phone', 'website']));
  });
  it('owner mode skips tenancy fields', () => expect(hasErrors(validateShop({ tagline: 'Hi' }, { ownerOnly: true }))).toBe(false));
});

describe('validateProduct', () => {
  const good = { shopId: 's', name: 'Tee', price: '499', stock: '5' };
  it('accepts a valid product', () => expect(hasErrors(validateProduct(good))).toBe(false));
  it('rejects negatives and fractions of stock', () => {
    expect(validateProduct({ ...good, price: '-1' }).price).toBeDefined();
    expect(validateProduct({ ...good, stock: '1.5' }).stock).toBeDefined();
    expect(validateProduct({ ...good, stock: '-2' }).stock).toBeDefined();
  });
  it('rejects an original price below the selling price', () => expect(validateProduct({ ...good, mrp: '100' }).mrp).toBeDefined());
  it('allows a blank original price', () => expect(validateProduct({ ...good, mrp: '' }).mrp).toBeUndefined());
  it('requires a store', () => expect(validateProduct({ ...good, shopId: '' }).shopId).toBeDefined());
});

describe('validateOffer', () => {
  const good = { kind: 'offer', title: 'Sale', startsAt: new Date('2026-10-01'), endsAt: new Date('2026-10-02') };
  it('accepts a valid offer', () => expect(hasErrors(validateOffer(good))).toBe(false));
  it('rejects an end before the start', () => expect(validateOffer({ ...good, endsAt: new Date('2026-09-01') }).endsAt).toBeDefined());
  it('rejects missing dates', () => expect(validateOffer({ ...good, startsAt: null }).startsAt).toBeDefined());
});

describe('other validators', () => {
  it('review rating must be 1 to 5', () => {
    expect(validateReview({ rating: 0 }).rating).toBeDefined();
    expect(validateReview({ rating: 5 }).rating).toBeUndefined();
    expect(validateReview({ rating: 3.5 }).rating).toBeDefined();
  });
  it('contact needs a name and a phone', () => {
    expect(Object.keys(validateContact({}))).toEqual(['name', 'phone']);
    expect(hasErrors(validateContact({ name: 'A', phone: '+91 98765 43210' }))).toBe(false);
  });
  it('clean strips undefined only', () => expect(clean({ a: 1, b: undefined, c: null, d: '' })).toEqual({ a: 1, c: null, d: '' }));
});
