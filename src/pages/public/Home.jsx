import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { collection, limit, query, where } from 'firebase/firestore';
import { ArrowRight, ArrowUpRight, Car, Clock, MapPin } from 'lucide-react';
import { db } from '../../lib/firebase.js';
import Button from '../../components/ui/Button.jsx';
import ShopCard, { ShopCardSkeleton } from '../../components/shop/ShopCard.jsx';
import OfferCard from '../../components/shop/OfferCard.jsx';
import ProductCard from '../../components/shop/ProductCard.jsx';
import ProductModal from '../../components/shop/ProductModal.jsx';
import { ArtCover, SmartImage } from '../../components/art/Art.jsx';
import { useState } from 'react';
import { useShops } from '../../context/ShopsContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useCollection } from '../../hooks/useFirestore.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { publishedOffersQuery, isCurrent } from '../../services/offers.js';
import { CATEGORIES, FLOORS } from '../../lib/constants.js';
import { formatDayHours, todayKey } from '../../lib/hours.js';
import { plural } from '../../lib/format.js';

const HERO_PHOTO = 'https://images.unsplash.com/photo-1519567241046-7f570eee3c9f?auto=format&fit=crop&w=1400&q=80';

export default function Home() {
  useDocumentTitle('');
  const { shops, ratings, loading } = useShops();
  const { settings, mallStatus } = useSettings();
  const status = mallStatus();
  const [product, setProduct] = useState(null);

  const offers = useCollection(() => publishedOffersQuery(), []);
  const products = useCollection(() => query(collection(db, 'products'), where('status', '==', 'active'), limit(40)), []);

  const featured = useMemo(() => {
    const flagged = shops.filter((s) => s.featured);
    const rest = shops
      .filter((s) => !s.featured)
      .sort((a, b) => (ratings[b.id]?.avg ?? 0) - (ratings[a.id]?.avg ?? 0));
    return [...flagged, ...rest].slice(0, 6);
  }, [shops, ratings]);

  const current = useMemo(
    () =>
      offers.data
        .filter((o) => isCurrent(o))
        .sort((a, b) => a.startsAt.seconds - b.startsAt.seconds)
        .slice(0, 3),
    [offers.data],
  );

  const shopById = useMemo(() => Object.fromEntries(shops.map((s) => [s.id, s])), [shops]);
  const arrivals = useMemo(
    () =>
      products.data
        .filter((p) => shopById[p.shopId] && p.stock > 0)
        .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
        .slice(0, 8),
    [products.data, shopById],
  );

  const floorStats = FLOORS.map((f) => {
    const onFloor = shops.filter((s) => s.floor === f.id);
    const cats = [...new Set(onFloor.map((s) => s.category))].slice(0, 3);
    return { ...f, count: onFloor.length, cats };
  });

  const today = todayKey(new Date(), settings.timezone);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="container-x grid items-center gap-12 pb-16 pt-10 lg:grid-cols-12 lg:gap-10 lg:pb-24 lg:pt-16">
          <div className="anim-fade-up lg:col-span-7">
            <p className="eyebrow flex items-center gap-2">
              <MapPin className="size-3.5" aria-hidden="true" /> {settings.city}
            </p>
            <h1 className="display mt-5 text-[3.4rem] text-ink sm:text-[5rem] lg:text-[6.4rem]">
              Everything you love, <em className="text-brass">under one roof.</em>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-2">
              {plural(shops.length || 40, 'store')} across four floors. Fashion, beauty, electronics, dining and a cinema, with parking that is on us when you shop.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button as={Link} to="/stores" size="lg">
                Browse stores <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
              <Button as={Link} to="/map" size="lg" variant="outline">
                Find it on the map
              </Button>
            </div>
            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-line pt-6">
              <div>
                <dt className="text-xs text-muted">Stores</dt>
                <dd className="display tabular text-4xl text-ink">{shops.length || '40+'}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Floors</dt>
                <dd className="display tabular text-4xl text-ink">4</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Today</dt>
                <dd className="display text-4xl text-ink">{formatDayHours(settings.hours[today]).replace(/ (AM|PM)/g, '$1').toLowerCase()}</dd>
              </div>
            </dl>
          </div>

          <div className="anim-fade-up relative lg:col-span-5" style={{ animationDelay: '0.12s' }}>
            <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-t-[999px] rounded-b-3xl bg-sunken shadow-lg">
              <SmartImage
                src={HERO_PHOTO}
                alt="Inside the Mercatora atrium"
                className="h-full w-full object-cover"
                fetchpriority="high"
                loading="eager"
                fallback={<ArtCover seed="mercatora-hero" category="Home" label="Mercatora" />}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#16130e]/55 via-transparent to-transparent" aria-hidden="true" />
            </div>
            <div className="absolute -left-3 bottom-10 rounded-2xl border border-line bg-surface/95 p-4 shadow-md backdrop-blur sm:-left-8">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                <span className={`size-2 rounded-full ${status.isOpen ? 'bg-ok' : 'bg-muted'}`} aria-hidden="true" />
                {status.isOpen ? 'Open now' : 'Closed right now'}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                <Clock className="size-3" aria-hidden="true" /> {status.text}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee */}
      <div className="overflow-hidden border-y border-line bg-sunken py-4" aria-hidden="true">
        <div className="marquee-track flex w-max gap-10 whitespace-nowrap">
          {[...CATEGORIES, ...CATEGORIES, ...CATEGORIES, ...CATEGORIES].map((c, i) => (
            <span key={i} className="display flex items-center gap-10 text-3xl text-ink-2">
              {c.id}
              <span className="size-1.5 rotate-45 bg-brass-fill" />
            </span>
          ))}
        </div>
      </div>

      {/* Featured */}
      <section className="container-x pt-24" aria-labelledby="featured-title">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Featured</p>
            <h2 id="featured-title" className="display mt-3 text-5xl text-ink sm:text-6xl">Stores to start with</h2>
          </div>
          <Link to="/stores" className="hidden items-center gap-1.5 text-sm font-medium text-ink underline-offset-4 hover:underline sm:inline-flex">
            View all stores <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-12 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }, (_, i) => <ShopCardSkeleton key={i} />)
            : featured.map((s, i) => <ShopCard key={s.id} shop={s} className="anim-fade-up" style={{ animationDelay: `${i * 60}ms` }} />)}
        </div>
        {!loading && featured.length === 0 && <p className="mt-10 text-muted">Stores will appear here once they are onboarded.</p>}
      </section>

      {/* Floors */}
      <section className="container-x pt-28" aria-labelledby="floors-title">
        <p className="eyebrow">Browse by floor</p>
        <h2 id="floors-title" className="display mt-3 text-5xl text-ink sm:text-6xl">Four floors, one easy loop</h2>
        <ul className="mt-12 grid overflow-hidden rounded-3xl border border-line bg-surface sm:grid-cols-2 lg:grid-cols-4">
          {floorStats.map((f, i) => (
            <li key={f.id} className={`border-line ${i > 0 ? 'border-t sm:border-t-0' : ''} ${i % 2 === 1 ? 'sm:border-l' : ''} ${i >= 2 ? 'sm:border-t' : ''} lg:border-t-0 ${i > 0 ? 'lg:border-l' : ''}`}>
              <Link to={`/stores?floor=${f.id}`} className="group flex h-full flex-col p-7 transition hover:bg-sunken">
                <span className="display text-8xl leading-none text-brass-fill transition group-hover:text-brass">{f.id}</span>
                <h3 className="mt-6 text-lg font-semibold text-ink">{f.name}</h3>
                <p className="mt-1 text-sm text-ink-2">{f.blurb}</p>
                <p className="mt-6 text-xs text-muted">
                  {plural(f.count, 'store')}
                  {f.cats.length > 0 && <> &middot; {f.cats.join(', ')}</>}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-ink">
                  Explore <ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* What's on */}
      {current.length > 0 && (
        <section className="container-x pt-28" aria-labelledby="on-title">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="eyebrow">What's on</p>
              <h2 id="on-title" className="display mt-3 text-5xl text-ink sm:text-6xl">Offers and events</h2>
            </div>
            <Link to="/whats-on" className="hidden items-center gap-1.5 text-sm font-medium text-ink underline-offset-4 hover:underline sm:inline-flex">
              See everything <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {current.map((o) => <OfferCard key={o.id} offer={o} compact />)}
          </div>
        </section>
      )}

      {/* New arrivals */}
      {arrivals.length > 0 && (
        <section className="container-x pt-28" aria-labelledby="new-title">
          <p className="eyebrow">Reserve online, collect in store</p>
          <h2 id="new-title" className="display mt-3 text-5xl text-ink sm:text-6xl">New on the shelves</h2>
          <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4">
            {arrivals.map((p) => (
              <ProductCard key={p.id} product={p} shop={shopById[p.shopId]} onOpen={setProduct} />
            ))}
          </div>
        </section>
      )}
      {product && <ProductModal product={product} shop={shopById[product.shopId]} onClose={() => setProduct(null)} />}

      {/* Visit band */}
      <section className="container-x pt-28">
        <div className="relative overflow-hidden rounded-[2rem] bg-ink px-8 py-14 text-paper sm:px-14 sm:py-20">
          <svg className="pointer-events-none absolute -right-10 -top-10 h-80 w-80 text-brass-fill opacity-25" viewBox="0 0 64 64" fill="none" aria-hidden="true">
            <path d="M12 50V30a8 8 0 0 1 16 0v20M24 50V26a8 8 0 0 1 16 0v24M36 50V30a8 8 0 0 1 16 0v20" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <div className="relative grid gap-10 md:grid-cols-2 md:items-end">
            <div>
              <p className="eyebrow !text-brass-fill">Plan your visit</p>
              <h2 className="display mt-4 text-5xl sm:text-6xl">Park free, stay a while.</h2>
              <p className="mt-5 max-w-md text-paper/75">{settings.parking.rates}</p>
              <Button as={Link} to="/visit" variant="accent" size="lg" className="mt-8">
                Hours, parking and directions <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
            <dl className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <dt className="flex items-center gap-2 text-paper/60"><Clock className="size-4" aria-hidden="true" /> Today</dt>
                <dd className="mt-1 text-2xl tabular">{formatDayHours(settings.hours[today])}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-2 text-paper/60"><Car className="size-4" aria-hidden="true" /> Parking</dt>
                <dd className="mt-1 text-2xl tabular">{settings.parking.capacity.toLocaleString('en-IN')} bays</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>
    </>
  );
}
