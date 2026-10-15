import { createContext, useContext, useMemo } from 'react';
import { useCollection } from '../hooks/useFirestore.js';
import { publicShopsQuery } from '../services/shops.js';
import { publishedReviewsQuery } from '../services/reviews.js';
import { aggregateRatings } from '../lib/ratings.js';

const ShopsContext = createContext({ shops: [], byId: {}, ratings: {}, loading: true, error: null });

/** One shared subscription to live stores and published review scores for every public page. */
export function ShopsProvider({ children }) {
  const shopsState = useCollection(() => publicShopsQuery(), []);
  const reviewsState = useCollection(() => publishedReviewsQuery(), []);

  const value = useMemo(() => {
    const shops = [...shopsState.data].sort((a, b) => a.name.localeCompare(b.name));
    return {
      shops,
      byId: Object.fromEntries(shops.map((s) => [s.id, s])),
      ratings: aggregateRatings(reviewsState.data),
      loading: shopsState.loading,
      error: shopsState.error,
    };
  }, [shopsState, reviewsState.data]);

  return <ShopsContext.Provider value={value}>{children}</ShopsContext.Provider>;
}

export const useShops = () => useContext(ShopsContext);
