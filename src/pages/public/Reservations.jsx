import { useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useConfirm } from '../../context/ConfirmContext.jsx';
import { useCollection } from '../../hooks/useFirestore.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { cancelOwn, myReservationsQuery } from '../../services/reservations.js';
import { PageLoader, EmptyState, ErrorState } from '../../components/ui/Feedback.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { ACTIVE_RESERVATION, RESERVATION_STATUS } from '../../lib/constants.js';
import { formatDateTime, inr } from '../../lib/format.js';

const STEPS = ['requested', 'confirmed', 'ready', 'collected'];

function Progress({ status }) {
  const idx = STEPS.indexOf(status);
  if (idx === -1) return null;
  return (
    <ol className="mt-5 flex items-center gap-2" aria-label="Progress">
      {STEPS.map((s, i) => (
        <li key={s} className="flex flex-1 items-center gap-2 last:flex-none">
          <span className={`grid size-6 shrink-0 place-items-center rounded-full text-[0.65rem] font-semibold ${i <= idx ? 'bg-moss text-paper' : 'bg-sunken text-muted'}`}>{i + 1}</span>
          <span className={`hidden text-xs sm:block ${i <= idx ? 'text-ink' : 'text-muted'}`}>{RESERVATION_STATUS[s].label}</span>
          {i < STEPS.length - 1 && <span className={`h-px flex-1 ${i < idx ? 'bg-moss' : 'bg-line'}`} />}
        </li>
      ))}
    </ol>
  );
}

export default function Reservations() {
  useDocumentTitle('My reservations');
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const { data, loading, error } = useCollection(() => (user ? myReservationsQuery(user.uid) : null), [user?.uid]);

  const sorted = useMemo(() => [...data].sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)), [data]);
  const active = sorted.filter((r) => ACTIVE_RESERVATION.includes(r.status));
  const past = sorted.filter((r) => !ACTIVE_RESERVATION.includes(r.status));

  if (authLoading) return <PageLoader />;
  if (!user) return <Navigate to="/login" state={{ from: '/reservations' }} replace />;

  async function cancel(r) {
    if (!(await confirm({ title: 'Cancel this reservation?', body: `Your request to ${r.shopName} will be withdrawn.`, confirmLabel: 'Cancel reservation', cancelLabel: 'Keep it', tone: 'danger' }))) return;
    try {
      await cancelOwn(r.id);
      toast.success('Reservation cancelled.');
    } catch {
      toast.error('Could not cancel. The store may have just confirmed it. Contact them directly.');
    }
  }

  const Card = ({ r }) => (
    <li className="rounded-2xl border border-line bg-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to={`/stores/${r.shopId}`} className="display text-3xl text-ink underline-offset-4 hover:underline">{r.shopName}</Link>
          <p className="mt-1 text-xs text-muted">Requested {formatDateTime(r.createdAt)}{r.pickupWindow ? ` · ${r.pickupWindow}` : ''}</p>
        </div>
        <Badge tone={RESERVATION_STATUS[r.status]?.tone} dot>{RESERVATION_STATUS[r.status]?.label}</Badge>
      </div>
      <Progress status={r.status} />
      <p className="mt-4 text-sm text-ink-2">{RESERVATION_STATUS[r.status]?.hint}</p>
      <div className="mt-5 grid gap-5 sm:grid-cols-[1fr_auto]">
        <ul className="divide-y divide-line text-sm">
          {r.items.map((i) => (
            <li key={i.productId} className="flex justify-between gap-4 py-2"><span className="text-ink">{i.qty} x {i.name}</span><span className="text-ink-2 tabular">{inr(i.price * i.qty)}</span></li>
          ))}
          <li className="flex justify-between gap-4 py-2 font-semibold text-ink"><span>Total to pay at store</span><span className="tabular">{inr(r.total)}</span></li>
        </ul>
        {ACTIVE_RESERVATION.includes(r.status) && (
          <div className="rounded-xl bg-sunken px-6 py-4 text-center sm:self-start">
            <p className="text-xs uppercase tracking-wider text-muted">Pickup code</p>
            <p className="display mt-1 text-4xl tracking-[0.2em] text-ink">{r.code}</p>
          </div>
        )}
      </div>
      {r.staffNote && <p className="mt-4 rounded-lg bg-brass-soft p-3 text-sm text-ink-2"><span className="font-semibold text-brass">Note from the store: </span>{r.staffNote}</p>}
      {r.status === 'requested' && <div className="mt-5"><Button variant="outline" size="sm" onClick={() => cancel(r)}>Cancel request</Button></div>}
    </li>
  );

  return (
    <div className="container-x pb-8 pt-12 sm:pt-16">
      <header>
        <p className="eyebrow">Reserve and pick up</p>
        <h1 className="display mt-3 text-6xl text-ink sm:text-7xl">My reservations</h1>
      </header>
      <div className="mt-12 max-w-3xl">
        {error ? <ErrorState /> : loading ? <PageLoader /> : sorted.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No reservations yet" body="Reserve something from any store and it will appear here with its pickup code." action={<Button as={Link} to="/stores">Browse stores</Button>} />
        ) : (
          <>
            {active.length > 0 && (<section aria-label="Active"><h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">Active</h2><ul className="space-y-5">{active.map((r) => <Card key={r.id} r={r} />)}</ul></section>)}
            {past.length > 0 && (<section aria-label="Past" className="mt-12"><h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">Past</h2><ul className="space-y-5">{past.map((r) => <Card key={r.id} r={r} />)}</ul></section>)}
          </>
        )}
      </div>
    </div>
  );
}
