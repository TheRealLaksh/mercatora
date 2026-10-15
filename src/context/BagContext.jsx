import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { addToBag, bagCount, bagTotal, groupByShop, removeFromBag, sanitiseBag, setQty } from '../lib/cartMath.js';
import { readStorage, writeStorage } from '../hooks/useLocalStorage.js';

const KEY = 'mercatora:bag:v2';
const BagContext = createContext(null);

export function BagProvider({ children }) {
  const [items, setItems] = useState(() => sanitiseBag(readStorage(KEY, [])));
  const [open, setOpen] = useState(false);

  useEffect(() => {
    writeStorage(KEY, items);
  }, [items]);

  // Keep several tabs in sync.
  useEffect(() => {
    const on = (e) => {
      if (e.key === KEY) setItems(sanitiseBag(readStorage(KEY, [])));
    };
    window.addEventListener('storage', on);
    return () => window.removeEventListener('storage', on);
  }, []);

  const add = useCallback((product, shop, qty = 1) => {
    setItems((list) =>
      addToBag(
        list,
        {
          productId: product.id,
          shopId: product.shopId,
          shopName: shop?.name ?? product.shopName ?? 'Store',
          name: product.name,
          price: product.price,
          stock: product.stock,
          imageUrl: product.imageUrl ?? '',
          category: product.category ?? '',
        },
        qty,
      ),
    );
  }, []);

  const value = useMemo(
    () => ({
      items,
      count: bagCount(items),
      total: bagTotal(items),
      groups: groupByShop(items),
      open,
      openBag: () => setOpen(true),
      closeBag: () => setOpen(false),
      add,
      setQty: (id, qty) => setItems((l) => setQty(l, id, qty)),
      remove: (id) => setItems((l) => removeFromBag(l, id)),
      clear: () => setItems([]),
      has: (id) => items.some((i) => i.productId === id),
    }),
    [items, open, add],
  );

  return <BagContext.Provider value={value}>{children}</BagContext.Provider>;
}

export function useBag() {
  const ctx = useContext(BagContext);
  if (!ctx) throw new Error('useBag must be used inside BagProvider');
  return ctx;
}
