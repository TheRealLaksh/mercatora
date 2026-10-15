import { describe, expect, it } from 'vitest';
import { addToBag, bagCount, bagTotal, groupByShop, removeFromBag, sanitiseBag, setQty } from './cartMath.js';

const p = (id, shop, price, stock = 10) => ({ productId: id, shopId: shop, shopName: shop.toUpperCase(), name: `Item ${id}`, price, stock });

describe('bag math', () => {
  it('adds and merges items', () => {
    let bag = addToBag([], p('a', 's1', 100));
    bag = addToBag(bag, p('a', 's1', 100));
    expect(bag).toHaveLength(1);
    expect(bag[0].qty).toBe(2);
  });

  it('never exceeds stock', () => {
    let bag = addToBag([], p('a', 's1', 100, 2), 5);
    expect(bag[0].qty).toBe(2);
    bag = addToBag(bag, p('a', 's1', 100, 2));
    expect(bag[0].qty).toBe(2);
  });

  it('refuses sold out products', () => {
    expect(addToBag([], p('a', 's1', 100, 0))).toEqual([]);
  });

  it('caps quantity at ten', () => {
    const bag = addToBag([], p('a', 's1', 100, 50), 99);
    expect(bag[0].qty).toBe(10);
  });

  it('sets, clamps and removes quantities', () => {
    let bag = addToBag([], p('a', 's1', 100, 3));
    bag = setQty(bag, 'a', 9);
    expect(bag[0].qty).toBe(3);
    bag = setQty(bag, 'a', 0);
    expect(bag).toEqual([]);
  });

  it('totals and counts', () => {
    const bag = [{ ...p('a', 's1', 100), qty: 2 }, { ...p('b', 's2', 50), qty: 3 }];
    expect(bagCount(bag)).toBe(5);
    expect(bagTotal(bag)).toBe(350);
    expect(removeFromBag(bag, 'a')).toHaveLength(1);
  });

  it('groups by shop with subtotals', () => {
    const bag = [{ ...p('a', 's1', 100), qty: 1 }, { ...p('b', 's2', 50), qty: 2 }, { ...p('c', 's1', 10), qty: 1 }];
    const groups = groupByShop(bag);
    expect(groups.map((g) => g.shopId)).toEqual(['s1', 's2']);
    expect(groups[0].total).toBe(110);
    expect(groups[0].items).toHaveLength(2);
  });

  it('drops malformed stored data', () => {
    expect(sanitiseBag('nope')).toEqual([]);
    expect(sanitiseBag([{ productId: 'a' }, { ...p('b', 's1', 10), qty: 2 }, { ...p('c', 's1', 10), qty: 99 }])).toHaveLength(2);
    expect(sanitiseBag([{ ...p('c', 's1', 10), qty: 99 }])[0].qty).toBe(10);
  });
});
