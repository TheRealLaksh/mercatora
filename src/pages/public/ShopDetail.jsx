import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Globe, Mail, MapPinned, Phone, Search, Tag } from 'lucide-react';
import { ShopCover, ShopLogo } from '../../components/art/Art.jsx';
import { RatingBadge } from '../../components/ui/Stars.jsx';
import FavoriteButton from '../../components/shop/FavoriteButton.jsx';
import OpenBadge from '../../components/shop/OpenBadge.jsx';
import HoursList from '../../components/shop/HoursList.jsx';
import ProductCard from '../../components/shop/ProductCard.jsx';
import ProductModal from '../../components/shop/ProductModal.jsx';
import OfferCard from '../../components/shop/OfferCard.jsx';
import Reviews from '../../components/shop/Reviews.jsx';
import { floorLabel } from '../../components/shop/ShopCard.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { Chips } from '../../components/ui/Tabs.jsx';
import { EmptyState, PageLoader, Skeleton } from '../../components/ui/Feedback.jsx';
import { useShops } from '../../context/ShopsContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCollection, useDocument } from '../../hooks/useFirestore.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { shopProductsQuery } from '../../services/products.js';
import { shopOffersQuery, isCurrent } from '../../services/offers.js';
import { doc } from 'firebase/firestore';
import { db } from '../../lib/firebase.js';
import { Package } from 'lucide-react';

export default function ShopDetail() {
  const { id } = useParams();
  const { byId, ratings, loading: shopsLoading } = useShops();
  const { isAdmin, isOwner, shopIds } = useAuth();
  const listed = byId[id];
  // A shop that is not public (archived or pending) can still be opened by the staff who manage it.
  const staffCanSee = isAdmin || (isOwner && shopIds.includes(id));
  const direct = useDocument(() => (!listed && staffCanSee ? doc(db, 'shops', id) : null), [id, listed, staffCanSee]);
  const shop = listed ?? direct.data;

  useDocumentTitle(shop?.name);
  const products = useCollection(() => shopProductsQuery(id), [id]);
  const offers = useCollection(() => shopOffersQuery(id), [id]);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [open, setOpen] = useState(null);

  const categories = useMemo(() => [...new Set(products.data.map((p) => p.category).filter(Boolean))].sort(), [products.data]);
  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    return products.data
      .filter((p) => (cat === 'all' || p.category === cat) && (!term || `${p.name} ${p.description} ${p.category}`.toLowerCase().includes(term)))
      .sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0) || a.name.localeCompare(b.name));
  }, [products.data, q, cat]);
  const liveOffers = offers.data.filter((o) => isCurrent(o));

  if (shopsLoading || direct.loading) return <PageLoader label="Loading store" />;
  if (!shop) {
    return (
      <div className="container-x py-24">
        <EmptyState
          icon={Package}
          title="We could not find that store"
          body="It may have moved, closed, or the link is wrong."
          action={<Button as={Link} to="/stores">Browse all stores</Button>}
        />
      </div>
    );
  }

  const r = ratings[shop.id];
  const website = shop.website ? (shop.website.startsWith('http') ? shop.website : `https://${shop.website}`) : null;

  return (
    <article>
      <div className="relative h-[16rem] overflow-hidden bg-sunken sm:h-[22rem]">
        <ShopCover shop={shop} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#16130e]/55 to-transparent" aria-hidden="true" />
        <div className="container-x absolute inset-x-0 top-5 flex items-center justify-between">
          <Link to="/stores" className="inline-flex items-center gap-1.5 rounded-full bg-paper/90 px-3.5 py-2 text-sm font-medium text-ink backdrop-blur hover:bg-paper">
            <ArrowLeft className="size-4" aria-hidden="true" /> All stores
          </Link>
          <FavoriteButton shop={shop} className="!size-10" />
        </div>
      </div>

      <div className="container-x">
        <header className="relative -mt-14 flex flex-col gap-5 sm:-mt-16 sm:flex-row sm:items-end">
          <ShopLogo shop={shop} className="size-28 border-4 border-paper text-4xl shadow-md sm:size-32" rounded="rounded-3xl" />
          <div className="min-w-0 flex-1 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="brass">{shop.category}</Badge>
              {shop.status !== 'active' && <Badge tone="warn">Not visible to the public</Badge>}
            </div>
            <h1 className="display mt-2 text-5xl text-ink sm:text-6xl">{shop.name}</h1>
            {shop.tagline && <p className="mt-1.5 text-lg text-ink-2">{shop.tagline}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pb-2">
            <a href="#reviews" className="rounded outline-offset-4"><RatingBadge avg={r?.avg ?? 0} count={r?.count ?? 0} /></a>
            <OpenBadge hours={shop.hours} long />
          </div>
        </header>

        <div className="mt-12 grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-8">
            {shop.description && (
              <section aria-labelledby="about-title">
                <h2 id="about-title" className="sr-only">About</h2>
                <p className="max-w-2xl whitespace-pre-line text-lg leading-relaxed text-ink-2">{shop.description}</p>
                {shop.tags?.length > 0 && (
                  <ul className="mt-5 flex flex-wrap gap-2">
                    {shop.tags.map((t) => <li key={t}><Badge>{t}</Badge></li>)}
                  </ul>
                )}
              </section>
            )}

            {liveOffers.length > 0 && (
              <section className="mt-14" aria-labelledby="deals-title">
                <h2 id="deals-title" className="display flex items-center gap-3 text-4xl text-ink"><Tag className="size-6 text-brass" aria-hidden="true" /> On now</h2>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">{liveOffers.map((o) => <OfferCard key={o.id} offer={o} compact />)}</div>
              </section>
            )}

            <section className="mt-14" aria-labelledby="products-title">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <h2 id="products-title" className="display text-4xl text-ink">Shop the range</h2>
                {products.data.length > 6 && (
                  <div className="relative w-full sm:w-72">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
                    <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search this store" aria-label="Search this store" className="h-10 w-full rounded-full border border-line-strong bg-surface pl-10 pr-4 text-sm focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass-fill/40" />
                  </div>
                )}
              </div>
              {categories.length > 1 && (
                <div className="mt-5">
                  <Chips label="Product category" value={cat} onChange={setCat} items={[{ id: 'all', label: 'All' }, ...categories.map((c) => ({ id: c, label: c }))]} />
                </div>
              )}
              <div className="mt-8">
                {products.loading ? (
                  <div className="grid grid-cols-2 gap-5 md:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="aspect-square" />)}</div>
                ) : products.data.length === 0 ? (
                  <EmptyState icon={Package} title="Nothing listed yet" body="This store has not published its range online. Pop in to see what is on the shelves." />
                ) : visible.length === 0 ? (
                  <EmptyState icon={Search} title="No products match" body="Try another word or category." />
                ) : (
                  <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3">
                    {visible.map((p) => <ProductCard key={p.id} product={p} shop={shop} onOpen={setOpen} />)}
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-6 lg:col-span-4">
            <div className="rounded-2xl border border-line bg-surface p-6">
              <h2 className="eyebrow mb-4">Find us</h2>
              <p className="flex items-start gap-3 text-sm text-ink">
                <MapPinned className="mt-0.5 size-4 shrink-0 text-brass" aria-hidden="true" />
                <span>{floorLabel(shop.floor)}, unit {shop.unitId}</span>
              </p>
              <Button as={Link} to={`/map?floor=${shop.floor}&shop=${shop.id}`} variant="outline" size="sm" className="mt-4 w-full">
                Show on the floor map
              </Button>
              <ul className="mt-6 space-y-3 border-t border-line pt-5 text-sm">
                {shop.phone && <li className="flex items-center gap-3"><Phone className="size-4 text-muted" aria-hidden="true" /><a href={`tel:${shop.phone.replace(/\s/g, '')}`} className="text-ink hover:underline">{shop.phone}</a></li>}
                {shop.email && <li className="flex items-center gap-3"><Mail className="size-4 text-muted" aria-hidden="true" /><a href={`mailto:${shop.email}`} className="break-all text-ink hover:underline">{shop.email}</a></li>}
                {website && <li className="flex items-center gap-3"><Globe className="size-4 text-muted" aria-hidden="true" /><a href={website} target="_blank" rel="noopener noreferrer" className="break-all text-ink hover:underline">{shop.website.replace(/^https?:\/\//, '')}</a></li>}
                {!shop.phone && !shop.email && !website && <li className="text-muted">No contact details listed.</li>}
              </ul>
            </div>
            <div className="rounded-2xl border border-line bg-surface p-6">
              <h2 className="eyebrow mb-3">Opening hours</h2>
              <HoursList hours={shop.hours} />
            </div>
          </aside>
        </div>

        <div className="mt-24 border-t border-line pt-16">
          <Reviews shop={shop} />
        </div>
      </div>

      {open && <ProductModal product={open} shop={shop} onClose={() => setOpen(null)} />}
    </article>
  );
}
