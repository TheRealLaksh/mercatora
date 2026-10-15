import { MAX_BAG_QTY } from './constants.js';

/**
 * Bag helpers. A bag item is
 * { productId, shopId, shopName, name, price, qty, stock, imageUrl, category }.
 * All functions are pure and return a new array.
 */

export function addToBag(items, product, qty = 1) {
  const limit = Math.min(MAX_BAG_QTY, Number.isFinite(product.stock) ? product.stock : MAX_BAG_QTY);
  if (limit <= 0) return items;
  const existing = items.find((i) => i.productId === product.productId);
  if (existing) {
    return items.map((i) =>
      i.productId === product.productId
        ? { ...i, ...product, qty: Math.min(limit, i.qty + qty) }
        : i,
    );
  }
  return [...items, { ...product, qty: Math.min(limit, qty) }];
}

export function setQty(items, productId, qty) {
  if (qty <= 0) return items.filter((i) => i.productId !== productId);
  return items.map((i) => {
    if (i.productId !== productId) return i;
    const limit = Math.min(MAX_BAG_QTY, Number.isFinite(i.stock) ? i.stock : MAX_BAG_QTY);
    return { ...i, qty: Math.min(limit, qty) };
  });
}

export function removeFromBag(items, productId) {
  return items.filter((i) => i.productId !== productId);
}

export function bagCount(items) {
  return items.reduce((n, i) => n + i.qty, 0);
}

export function bagTotal(items) {
  return items.reduce((sum, i) => sum + i.price * i.qty, 0);
}

/** Groups by shop, preserving first seen order. */
export function groupByShop(items) {
  const map = new Map();
  for (const item of items) {
    if (!map.has(item.shopId)) {
      map.set(item.shopId, { shopId: item.shopId, shopName: item.shopName, items: [], total: 0 });
    }
    const g = map.get(item.shopId);
    g.items.push(item);
    g.total += item.price * item.qty;
  }
  return [...map.values()];
}

/** Safe parse of whatever is in storage. Drops anything malformed. */
export function sanitiseBag(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (i) =>
        i &&
        typeof i.productId === 'string' &&
        typeof i.shopId === 'string' &&
        typeof i.name === 'string' &&
        Number.isFinite(i.price) &&
        Number.isInteger(i.qty) &&
        i.qty > 0,
    )
    .map((i) => ({ ...i, qty: Math.min(i.qty, MAX_BAG_QTY) }));
}
