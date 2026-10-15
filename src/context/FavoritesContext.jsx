import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { mergeFavorites, setFavorite } from '../services/users.js';
import { readStorage, writeStorage } from '../hooks/useLocalStorage.js';
import { useToast } from './ToastContext.jsx';

const KEY = 'mercatora:favorites:v2';
const FavoritesContext = createContext(null);

/** Guests keep favourites on the device. Signed in shoppers keep them on their account and the two are merged at sign in. */
export function FavoritesProvider({ children }) {
  const { user, favorites: remote, loading } = useAuth();
  const toast = useToast();
  const [local, setLocal] = useState(() => readStorage(KEY, []));
  const merged = useRef(null);

  useEffect(() => {
    if (loading || !user || merged.current === user.uid) return;
    merged.current = user.uid;
    if (local.length) {
      mergeFavorites(user.uid, local)
        .then(() => {
          setLocal([]);
          writeStorage(KEY, []);
        })
        .catch((e) => console.error('Could not merge favourites', e));
    }
  }, [user, loading, local]);

  const ids = user ? remote : local;

  const toggle = useCallback(
    async (shopId) => {
      const on = !ids.includes(shopId);
      if (user) {
        try {
          await setFavorite(user.uid, shopId, on);
        } catch {
          toast.error('Could not update your favourites. Try again.');
          return;
        }
      } else {
        const next = on ? [...local, shopId] : local.filter((x) => x !== shopId);
        setLocal(next);
        writeStorage(KEY, next);
      }
      toast.success(on ? 'Saved to your favourites.' : 'Removed from your favourites.');
    },
    [ids, user, local, toast],
  );

  const value = useMemo(() => ({ ids, toggle, has: (id) => ids.includes(id) }), [ids, toggle]);
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export const useFavorites = () => useContext(FavoritesContext);
