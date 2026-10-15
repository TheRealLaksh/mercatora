import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCollection } from '../../hooks/useFirestore.js';
import { allShopsQuery } from '../../services/shops.js';

const ConsoleContext = createContext(null);

/**
 * Admins see every store. Owners only see the stores linked to their account, loaded one document
 * at a time because rules authorise by document id, not by query.
 */
export function ConsoleProvider({ children }) {
  const { isAdmin, shopIds } = useAuth();
  const adminShops = useCollection(() => (isAdmin ? allShopsQuery() : null), [isAdmin]);
  const [ownerShops, setOwnerShops] = useState({});
  const [ownerLoading, setOwnerLoading] = useState(!isAdmin && shopIds.length > 0);
  const [activeShopId, setActive] = useState(() => {
    try {
      return sessionStorage.getItem('mercatora:console:shop') ?? '';
    } catch {
      return '';
    }
  });

  const idsKey = shopIds.join(',');
  useEffect(() => {
    if (isAdmin || shopIds.length === 0) {
      setOwnerShops({});
      setOwnerLoading(false);
      return undefined;
    }
    setOwnerLoading(true);
    let pending = shopIds.length;
    const unsubs = shopIds.map((id) =>
      onSnapshot(
        doc(db, 'shops', id),
        (snap) => {
          setOwnerShops((m) => {
            const next = { ...m };
            if (snap.exists()) next[id] = { id, ...snap.data() };
            else delete next[id];
            return next;
          });
          pending = Math.max(0, pending - 1);
          if (pending === 0) setOwnerLoading(false);
        },
        () => {
          pending = Math.max(0, pending - 1);
          if (pending === 0) setOwnerLoading(false);
        },
      ),
    );
    return () => unsubs.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, idsKey]);

  const shops = useMemo(() => {
    const list = isAdmin ? adminShops.data : Object.values(ownerShops);
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [isAdmin, adminShops.data, ownerShops]);

  const activeShop = shops.find((s) => s.id === activeShopId) ?? (isAdmin ? null : shops[0] ?? null);

  const value = useMemo(
    () => ({
      shops,
      byId: Object.fromEntries(shops.map((s) => [s.id, s])),
      loading: isAdmin ? adminShops.loading : ownerLoading,
      activeShop,
      activeShopId: activeShop?.id ?? '',
      setActiveShopId: (id) => {
        setActive(id);
        try {
          sessionStorage.setItem('mercatora:console:shop', id);
        } catch {
          /* ignore */
        }
      },
    }),
    [shops, isAdmin, adminShops.loading, ownerLoading, activeShop],
  );

  return <ConsoleContext.Provider value={value}>{children}</ConsoleContext.Provider>;
}

export const useConsole = () => useContext(ConsoleContext);
