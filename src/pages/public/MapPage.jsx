import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowUpRight, Search } from 'lucide-react';
import FloorMap, { tint } from '../../components/map/FloorMap.jsx';
import { Segmented } from '../../components/ui/Tabs.jsx';
import Button from '../../components/ui/Button.jsx';
import OpenBadge from '../../components/shop/OpenBadge.jsx';
import { ShopLogo } from '../../components/art/Art.jsx';
import { Skeleton } from '../../components/ui/Feedback.jsx';
import { useShops } from '../../context/ShopsContext.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { CATEGORIES, FLOORS } from '../../lib/constants.js';
import { getFloorPlan } from '../../lib/floorPlans.js';

export default function MapPage() {
  useDocumentTitle('Floor map');
  const { shops, loading } = useShops();
  const [params, setParams] = useSearchParams();
  const shopParam = params.get('shop');
  const floorParam = params.get('floor');
  const [query, setQuery] = useState('');

  const focused = shops.find((s) => s.id === shopParam);
  const floor = floorParam && FLOORS.some((f) => f.id === floorParam) ? floorParam : focused?.floor ?? 'G';
  const selected = focused && focused.floor === floor ? focused : null;

  const plan = getFloorPlan(floor);
  const onFloor = useMemo(() => shops.filter((s) => s.floor === floor), [shops, floor]);
  const vacant = plan.units.length - onFloor.length;
  const matches = useMemo(() => {
    const t = query.trim().toLowerCase();
    if (!t) return [];
    return shops.filter((s) => `${s.name} ${s.category}`.toLowerCase().includes(t)).slice(0, 6);
  }, [query, shops]);

  useEffect(() => {
    if (shopParam && !loading && !focused) {
      const next = new URLSearchParams(params);
      next.delete('shop');
      setParams(next, { replace: true });
    }
  }, [shopParam, loading, focused, params, setParams]);

  function setFloor(f) {
    const next = new URLSearchParams();
    next.set('floor', f);
    setParams(next, { replace: true });
  }
  function pick(shop) {
    setParams({ floor: shop.floor, shop: shop.id }, { replace: true });
    setQuery('');
  }
  const usedCats = CATEGORIES.filter((c) => onFloor.some((s) => s.category === c.id));

  return (
    <div className="container-x pb-8 pt-12 sm:pt-16">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">Wayfinding</p>
          <h1 className="display mt-3 text-6xl text-ink sm:text-7xl">Floor map</h1>
          <p className="mt-3 max-w-xl text-lg text-ink-2">Tap a store to see its details. Search to jump straight to it.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a store"
            aria-label="Find a store on the map"
            className="h-12 w-full rounded-full border border-line-strong bg-surface pl-11 pr-4 text-sm focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass-fill/40"
          />
          {matches.length > 0 && (
            <ul className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-line bg-surface shadow-lg" role="listbox" aria-label="Matching stores">
              {matches.map((s) => (
                <li key={s.id} role="option" aria-selected={false}>
                  <button type="button" onClick={() => pick(s)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-sunken">
                    <span className="font-medium text-ink">{s.name}</span>
                    <span className="text-xs text-muted">{s.floor === 'G' ? 'Ground' : `Level ${s.floor}`}, {s.unitId}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </header>

      <div className="mt-10">
        <Segmented label="Choose a floor" value={floor} onChange={setFloor} items={FLOORS.map((f) => ({ id: f.id, label: f.name }))} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        <section className="rounded-3xl border border-line bg-surface p-3 sm:p-5 lg:col-span-8" aria-label={`${plan.name} plan`}>
          {loading ? <Skeleton className="aspect-[5/3]" /> : <FloorMap floorId={floor} shops={shops} selectedId={selected?.id} highlightId={shopParam} onSelect={pick} />}
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 px-2 text-xs text-ink-2">
            {usedCats.map((c) => (
              <span key={c.id} className="inline-flex items-center gap-2">
                <span className="size-3 rounded-sm border border-line-strong" style={{ background: tint(c.id) }} aria-hidden="true" />
                {c.id}
              </span>
            ))}
            <span className="inline-flex items-center gap-2"><span className="size-3 rounded-sm border border-dashed border-line-strong" aria-hidden="true" />Available</span>
          </div>
        </section>

        <aside className="lg:col-span-4" aria-live="polite">
          {selected ? (
            <div className="anim-pop rounded-3xl border border-line bg-surface p-6">
              <div className="flex items-start gap-4">
                <ShopLogo shop={selected} className="size-16 text-2xl" />
                <div className="min-w-0">
                  <p className="eyebrow">{selected.category}</p>
                  <h2 className="display mt-1 text-3xl leading-tight text-ink">{selected.name}</h2>
                </div>
              </div>
              {selected.tagline && <p className="mt-4 text-sm text-ink-2">{selected.tagline}</p>}
              <dl className="mt-5 space-y-2 border-t border-line pt-5 text-sm">
                <div className="flex justify-between"><dt className="text-muted">Location</dt><dd className="text-ink">{plan.name}, {selected.unitId}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Status</dt><dd><OpenBadge hours={selected.hours} long /></dd></div>
              </dl>
              <Button as={Link} to={`/stores/${selected.id}`} className="mt-6 w-full">
                Visit store page <ArrowUpRight className="size-4" aria-hidden="true" />
              </Button>
              <button type="button" onClick={() => setParams({ floor }, { replace: true })} className="mt-3 w-full text-center text-xs text-muted hover:text-ink">
                Clear selection
              </button>
            </div>
          ) : (
            <div className="rounded-3xl border border-line bg-surface p-6">
              <h2 className="display text-3xl text-ink">{plan.name}</h2>
              <p className="mt-1 text-sm text-muted">{plan.blurb}</p>
              <p className="mt-3 text-xs text-muted tabular">{onFloor.length} stores &middot; {vacant} units available</p>
              <ul className="mt-5 max-h-[26rem] divide-y divide-line overflow-y-auto pr-1">
                {onFloor.length === 0 && !loading && <li className="py-4 text-sm text-muted">No stores on this floor yet.</li>}
                {onFloor.map((s) => (
                  <li key={s.id}>
                    <button type="button" onClick={() => pick(s)} className="flex w-full items-center gap-3 py-3 text-left transition hover:opacity-70">
                      <span className="size-2.5 shrink-0 rounded-full" style={{ background: tint(s.category), outline: '1px solid var(--line-strong)' }} aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{s.name}</span>
                      <span className="text-xs text-muted tabular">{s.unitId}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
