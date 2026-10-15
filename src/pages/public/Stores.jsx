import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, Store, X } from 'lucide-react';
import ShopCard, { ShopCardSkeleton } from '../../components/shop/ShopCard.jsx';
import { Chips, Segmented } from '../../components/ui/Tabs.jsx';
import { EmptyState, ErrorState } from '../../components/ui/Feedback.jsx';
import Button from '../../components/ui/Button.jsx';
import { useShops } from '../../context/ShopsContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useDebounced } from '../../hooks/useDebounced.js';
import { CATEGORIES, FLOORS } from '../../lib/constants.js';
import { getOpenStatus } from '../../lib/hours.js';
import { plural } from '../../lib/format.js';
import { useState } from 'react';

const SORTS = [
  { id: 'name', label: 'A to Z' },
  { id: 'rating', label: 'Top rated' },
  { id: 'floor', label: 'By floor' },
];

export default function Stores() {
  useDocumentTitle('Stores');
  const { shops, ratings, loading, error } = useShops();
  const { settings } = useSettings();
  const [params, setParams] = useSearchParams();
  const urlQ = params.get('q') ?? '';
  const [q, setQ] = useState(urlQ);
  const dq = useDebounced(q, 150);
  const cat = params.get('cat') ?? 'all';
  const floor = params.get('floor') ?? 'all';
  const sort = params.get('sort') ?? 'name';
  const openOnly = params.get('open') === '1';

  function setParam(key, value, fallback = 'all') {
    const next = new URLSearchParams(params);
    if (!value || value === fallback) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  }

  // keep the URL in sync with the search box (debounced)
  if (dq !== urlQ && dq === q) setParam('q', dq, '');

  const filtered = useMemo(() => {
    const term = dq.trim().toLowerCase();
    const now = new Date();
    let list = shops.filter((s) => {
      if (cat !== 'all' && s.category !== cat) return false;
      if (floor !== 'all' && s.floor !== floor) return false;
      if (openOnly && !getOpenStatus(s.hours, now, settings.timezone).isOpen) return false;
      if (!term) return true;
      return [s.name, s.category, s.tagline, s.description, ...(s.tags ?? [])].filter(Boolean).join(' ').toLowerCase().includes(term);
    });
    if (sort === 'rating') list = [...list].sort((a, b) => (ratings[b.id]?.avg ?? 0) - (ratings[a.id]?.avg ?? 0) || a.name.localeCompare(b.name));
    if (sort === 'floor') list = [...list].sort((a, b) => a.floor.localeCompare(b.floor) || a.name.localeCompare(b.name));
    return list;
  }, [shops, dq, cat, floor, openOnly, sort, ratings, settings.timezone]);

  const filtersOn = cat !== 'all' || floor !== 'all' || openOnly || dq;
  const clear = () => {
    setQ('');
    setParams({}, { replace: true });
  };

  return (
    <div className="container-x pb-8 pt-12 sm:pt-16">
      <header className="max-w-3xl">
        <p className="eyebrow">The directory</p>
        <h1 className="display mt-3 text-6xl text-ink sm:text-7xl">All stores</h1>
        <p className="mt-4 text-lg text-ink-2">Search by name, category or what you are after. Filter by floor, or see only what is open right now.</p>
      </header>

      <div className="sticky top-[4.5rem] z-20 -mx-4 mt-10 border-y border-line bg-paper/90 px-4 py-4 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        <div className="mx-auto flex max-w-[78rem] flex-col gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-[1.1rem] -translate-y-1/2 text-muted" aria-hidden="true" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search stores, categories, brands"
                aria-label="Search stores"
                className="h-12 w-full rounded-full border border-line-strong bg-surface pl-11 pr-4 text-sm text-ink placeholder:text-muted focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass-fill/40"
              />
            </div>
            <Segmented
              label="Floor"
              value={floor}
              onChange={(v) => setParam('floor', v)}
              items={[{ id: 'all', label: 'All floors' }, ...FLOORS.map((f) => ({ id: f.id, label: f.id === 'G' ? 'Ground' : `L${f.id}` }))]}
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <Chips label="Category" value={cat} onChange={(v) => setParam('cat', v)} items={[{ id: 'all', label: 'All' }, ...CATEGORIES.map((c) => ({ id: c.id, label: c.id }))]} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <label className="inline-flex cursor-pointer items-center gap-2 text-ink-2">
              <input type="checkbox" checked={openOnly} onChange={(e) => setParam('open', e.target.checked ? '1' : '', '')} className="size-4 accent-[var(--moss)]" />
              Open now
            </label>
            <label className="inline-flex items-center gap-2 text-ink-2">
              <SlidersHorizontal className="size-4" aria-hidden="true" />
              <span className="sr-only">Sort by</span>
              <select value={sort} onChange={(e) => setParam('sort', e.target.value, 'name')} className="rounded-md border border-line-strong bg-surface px-2 py-1 text-sm text-ink">
                {SORTS.map((s) => (<option key={s.id} value={s.id}>{s.label}</option>))}
              </select>
            </label>
            <p className="ml-auto text-muted tabular" aria-live="polite">{loading ? 'Loading' : plural(filtered.length, 'store')}</p>
            {filtersOn && (
              <button type="button" onClick={clear} className="inline-flex items-center gap-1 font-medium text-brass hover:underline">
                <X className="size-3.5" aria-hidden="true" /> Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-12">
        {error ? (
          <ErrorState title="The directory could not load" />
        ) : loading ? (
          <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 9 }, (_, i) => <ShopCardSkeleton key={i} />)}</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Store}
            title="No stores match"
            body="Try a different word, or remove a filter."
            action={<Button variant="outline" onClick={clear}>Clear filters</Button>}
          />
        ) : (
          <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s) => <ShopCard key={s.id} shop={s} as="h2" />)}
          </div>
        )}
      </div>
    </div>
  );
}
