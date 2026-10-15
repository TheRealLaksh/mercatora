/** Builds { [shopId]: { avg, count } } from a list of published reviews. */
export function aggregateRatings(reviews) {
  const acc = {};
  for (const r of reviews) {
    if (!r.shopId || !Number.isFinite(r.rating)) continue;
    const a = (acc[r.shopId] ??= { sum: 0, count: 0, avg: 0 });
    a.sum += r.rating;
    a.count += 1;
  }
  for (const a of Object.values(acc)) a.avg = a.count ? Math.round((a.sum / a.count) * 10) / 10 : 0;
  return acc;
}

export function distribution(reviews) {
  const buckets = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const r of reviews) if (buckets[r.rating] !== undefined) buckets[r.rating] += 1;
  return buckets;
}
