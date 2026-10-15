import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { collection, limit, orderBy, query } from 'firebase/firestore';
import { AlertTriangle, ArrowUpRight, ClipboardList, Package, Star, Store } from 'lucide-react';
import { db } from '../../lib/firebase.js';
import { PageHeader, Panel, StatCard } from '../../components/console/ui.jsx';
import { useConsole } from '../../components/console/ConsoleContext.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { EmptyState, Skeleton } from '../../components/ui/Feedback.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCollection } from '../../hooks/useFirestore.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { allProductsQuery, staffProductsQuery } from '../../services/products.js';
import { allReservationsQuery, shopReservationsQuery } from '../../services/reservations.js';
import { allReviewsQuery, staffShopReviewsQuery } from '../../services/reviews.js';
import { LOW_STOCK, RESERVATION_STATUS } from '../../lib/constants.js';
import { formatDate, inr, plural, relativeTime, toDate } from '../../lib/format.js';

function lastDays(n) {
  const out = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push(d);
  }
  return out;
}

function ReservationChart({ reservations }) {
  const days = lastDays(14);
  const counts = days.map((d) => {
    const next = new Date(d);
    next.setDate(d.getDate() + 1);
    return reservations.filter((r) => {
      const t = toDate(r.createdAt);
      return t && t >= d && t < next;
    }).length;
  });
  const max = Math.max(3, ...counts);
  const total = counts.reduce((a, b) => a + b, 0);
  const W = 560;
  const H = 150;
  const bw = W / days.length;
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H + 24}`} className="h-auto w-full" role="img" aria-label={`Reservations over the last 14 days. ${total} in total, busiest day ${Math.max(...counts)}.`}>
        {[0.25, 0.5, 0.75, 1].map((g) => (
          <line key={g} x1="0" x2={W} y1={H - H * g} y2={H - H * g} stroke="var(--line)" strokeDasharray="3 4" />
        ))}
        {counts.map((c, i) => {
          const h = (c / max) * (H - 8);
          return (
            <g key={days[i].toISOString()}>
              <rect x={i * bw + 6} y={H - h} width={bw - 12} height={Math.max(h, 2)} rx="4" fill={c ? 'var(--moss)' : 'var(--line)'} opacity={i === days.length - 1 ? 1 : 0.82}>
                <title>{`${formatDate(days[i])}: ${plural(c, 'reservation')}`}</title>
              </rect>
              {(i % 2 === 1 || i === days.length - 1) && (
                <text x={i * bw + bw / 2} y={H + 16} textAnchor="middle" fontSize="10" fill="var(--muted)">
                  {days[i].getDate()}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-1 text-xs text-muted">{plural(total, 'reservation')} in the last 14 days</figcaption>
    </figure>
  );
}

export default function Dashboard() {
  useDocumentTitle('Console');
  const { isAdmin, displayName } = useAuth();
  const { shops, activeShopId, activeShop, loading: shopsLoading } = useConsole();

  const products = useCollection(
    () => (isAdmin ? allProductsQuery() : activeShopId ? staffProductsQuery(activeShopId) : null),
    [isAdmin, activeShopId],
  );
  const reservations = useCollection(
    () => (isAdmin ? allReservationsQuery() : activeShopId ? shopReservationsQuery(activeShopId) : null),
    [isAdmin, activeShopId],
  );
  const reviews = useCollection(
    () => (isAdmin ? allReviewsQuery() : activeShopId ? staffShopReviewsQuery(activeShopId) : null),
    [isAdmin, activeShopId],
  );
  const logs = useCollection(
    () => (isAdmin ? query(collection(db, 'logs'), orderBy('timestamp', 'desc'), limit(8)) : null),
    [isAdmin],
  );

  const stats = useMemo(() => {
    const live = products.data.filter((p) => p.status === 'active');
    const low = live.filter((p) => p.stock <= LOW_STOCK);
    const pending = reservations.data.filter((r) => r.status === 'requested');
    const active = reservations.data.filter((r) => ['confirmed', 'ready'].includes(r.status));
    const pub = reviews.data.filter((r) => r.status === 'published');
    const avg = pub.length ? pub.reduce((s, r) => s + r.rating, 0) / pub.length : 0;
    const value = reservations.data.filter((r) => r.status === 'collected').reduce((s, r) => s + r.total, 0);
    return { live, low, pending, active, avg, reviewCount: pub.length, value };
  }, [products.data, reservations.data, reviews.data]);

  const loading = shopsLoading || products.loading || reservations.loading;

  if (!isAdmin && !shopsLoading && shops.length === 0) {
    return (
      <>
        <PageHeader eyebrow="Console" title={`Hello, ${displayName.split(' ')[0]}`} />
        <EmptyState icon={Store} title="No store is linked to your account" body="Ask a mall administrator to link your account to your store. Once they do, your store's tools appear here." />
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={isAdmin ? 'Mall overview' : activeShop?.name ?? 'Your store'}
        title={`Hello, ${displayName.split(' ')[0]}`}
        description={isAdmin ? 'Everything across the mall at a glance.' : 'Requests, stock and reviews for your store.'}
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {isAdmin ? (
            <StatCard label="Live stores" value={shops.filter((s) => s.status === 'active').length} hint={`${shops.length} onboarded in total`} icon={Store} />
          ) : (
            <StatCard label="Collected value" value={inr(stats.value)} hint="Reservations picked up" icon={Store} />
          )}
          <StatCard label="Live products" value={stats.live.length} hint={stats.low.length ? `${stats.low.length} low on stock` : 'Stock levels look healthy'} icon={Package} tone={stats.low.length ? 'warn' : 'default'} />
          <StatCard label="Waiting for you" value={stats.pending.length} hint={`${stats.active.length} confirmed or ready`} icon={ClipboardList} tone={stats.pending.length ? 'danger' : 'default'} />
          <StatCard label="Average rating" value={stats.reviewCount ? stats.avg.toFixed(1) : 'No ratings'} hint={plural(stats.reviewCount, 'review')} icon={Star} />
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="Reservations" className="lg:col-span-2">
          <ReservationChart reservations={reservations.data} />
        </Panel>

        <Panel title="Needs attention" action={<Link to="/console/reservations" className="inline-flex items-center gap-1 text-xs font-medium text-brass hover:underline">Open <ArrowUpRight className="size-3" aria-hidden="true" /></Link>}>
          {stats.pending.length === 0 && stats.low.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">All clear. Nothing needs you right now.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {stats.pending.slice(0, 4).map((r) => (
                <li key={r.id} className="flex items-start gap-3">
                  <ClipboardList className="mt-0.5 size-4 shrink-0 text-clay" aria-hidden="true" />
                  <Link to="/console/reservations" className="min-w-0 flex-1 hover:underline">
                    <span className="font-medium text-ink">{r.shopperName}</span> requested {plural(r.items.length, 'item')} from {r.shopName}
                    <span className="block text-xs text-muted">{relativeTime(r.createdAt)} · {inr(r.total)}</span>
                  </Link>
                </li>
              ))}
              {stats.low.slice(0, 4).map((p) => (
                <li key={p.id} className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden="true" />
                  <Link to="/console/products" className="min-w-0 flex-1 hover:underline">
                    <span className="font-medium text-ink">{p.name}</span>
                    <span className="block text-xs text-muted">{p.stock === 0 ? 'Out of stock' : `${p.stock} left`}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={isAdmin ? 'Recent activity' : 'Latest reservations'} className="lg:col-span-3" pad={false}>
          {isAdmin ? (
            logs.loading ? <div className="p-5"><Skeleton className="h-32" /></div> : logs.data.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted">No activity yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {logs.data.map((l) => (
                  <li key={l.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-sm">
                    <Badge tone="neutral" className="font-mono !text-[0.68rem]">{l.action}</Badge>
                    <span className="min-w-0 flex-1 truncate text-ink-2">{l.details}</span>
                    <span className="text-xs text-muted">{l.performedBy} · {relativeTime(l.timestamp)}</span>
                  </li>
                ))}
              </ul>
            )
          ) : reservations.data.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted">No reservations yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {[...reservations.data].sort((a, b) => (b.updatedAt?.seconds ?? 0) - (a.updatedAt?.seconds ?? 0)).slice(0, 6).map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-sm">
                  <Badge tone={RESERVATION_STATUS[r.status]?.tone} dot>{RESERVATION_STATUS[r.status]?.label}</Badge>
                  <span className="min-w-0 flex-1 truncate text-ink-2">{r.shopperName}, {plural(r.items.length, 'item')}, {inr(r.total)}</span>
                  <span className="text-xs text-muted">{relativeTime(r.updatedAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
