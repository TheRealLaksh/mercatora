import { useMemo, useState } from 'react';
import { Check, ClipboardList, PackageCheck, PhoneCall, X } from 'lucide-react';
import { PageHeader, SearchBox, ShopFilter } from '../../components/console/ui.jsx';
import { useConsole } from '../../components/console/ConsoleContext.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { Input, Textarea } from '../../components/ui/Field.jsx';
import { EmptyState, Skeleton } from '../../components/ui/Feedback.jsx';
import { Segmented } from '../../components/ui/Tabs.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useCollection } from '../../hooks/useFirestore.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { allReservationsQuery, moveReservation, shopReservationsQuery } from '../../services/reservations.js';
import { normaliseCode } from '../../lib/code.js';
import { RESERVATION_STATUS } from '../../lib/constants.js';
import { formatDateTime, inr, relativeTime } from '../../lib/format.js';

const TABS = {
  new: ['requested'],
  open: ['confirmed', 'ready'],
  done: ['collected', 'cancelled', 'expired'],
};

const ACTIONS = {
  requested: [
    { to: 'confirmed', label: 'Confirm and set aside', icon: Check, variant: 'primary', note: true },
    { to: 'cancelled', label: 'Decline', icon: X, variant: 'dangerSoft', note: true },
  ],
  confirmed: [
    { to: 'ready', label: 'Mark ready', icon: PackageCheck, variant: 'primary', note: true },
    { to: 'cancelled', label: 'Cancel', icon: X, variant: 'dangerSoft', note: true },
  ],
  ready: [
    { to: 'collected', label: 'Hand over', icon: Check, variant: 'primary', code: true },
    { to: 'expired', label: 'Expire hold', icon: X, variant: 'dangerSoft', note: true },
  ],
};

const COPY = {
  confirmed: ['Confirm this reservation', 'The items are held and stock is reduced right away.'],
  ready: ['Mark as ready', 'The shopper will see that it is ready at the counter.'],
  collected: ['Hand over to the shopper', 'Ask the shopper for their pickup code and enter it below.'],
  cancelled: ['Cancel this reservation', 'Held stock goes back on the shelf.'],
  expired: ['Expire this hold', 'Held stock goes back on the shelf.'],
};

export default function Reservations() {
  useDocumentTitle('Reservations');
  const { isAdmin } = useAuth();
  const { shops, activeShopId, loading: shopsLoading } = useConsole();
  const toast = useToast();
  const [tab, setTab] = useState('new');
  const [shopFilter, setShopFilter] = useState('');
  const [q, setQ] = useState('');
  const [action, setAction] = useState(null); // { reservation, def }
  const [note, setNote] = useState('');
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [busy, setBusy] = useState(false);

  const scope = isAdmin ? shopFilter : activeShopId;
  const { data, loading } = useCollection(
    () => (scope ? shopReservationsQuery(scope) : isAdmin ? allReservationsQuery() : null),
    [scope, isAdmin],
  );

  const counts = useMemo(() => Object.fromEntries(Object.entries(TABS).map(([k, st]) => [k, data.filter((r) => st.includes(r.status)).length])), [data]);
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return data
      .filter((r) => TABS[tab].includes(r.status) && (!t || `${r.shopperName} ${r.phone} ${r.shopName} ${r.items.map((i) => i.name).join(' ')}`.toLowerCase().includes(t)))
      .sort((a, b) => (tab === 'done' ? (b.updatedAt?.seconds ?? 0) - (a.updatedAt?.seconds ?? 0) : (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0)));
  }, [data, tab, q]);

  function begin(reservation, def) {
    setAction({ reservation, def });
    setNote('');
    setCode('');
    setCodeError('');
  }

  async function run() {
    const { reservation, def } = action;
    if (def.code && normaliseCode(code) !== reservation.code) {
      setCodeError('That code does not match this reservation.');
      return;
    }
    setBusy(true);
    try {
      await moveReservation(reservation.id, def.to, note.trim() ? { staffNote: note.trim() } : {});
      toast.success(`${RESERVATION_STATUS[def.to].label}: ${reservation.shopperName}`);
      setAction(null);
      if (def.to === 'confirmed') setTab('open');
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!isAdmin && !shopsLoading && shops.length === 0) {
    return (<><PageHeader eyebrow="Pickup" title="Reservations" /><EmptyState icon={ClipboardList} title="No store linked" body="Ask an administrator to link your account to a store first." /></>);
  }

  return (
    <>
      <PageHeader eyebrow="Pickup" title="Reservations" description="Requests arrive live. Confirm to set items aside, mark them ready, then hand over against the shopper's code." />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Segmented
          label="Reservation queue"
          value={tab}
          onChange={setTab}
          items={[
            { id: 'new', label: 'To confirm', count: counts.new },
            { id: 'open', label: 'In progress', count: counts.open },
            { id: 'done', label: 'History', count: counts.done },
          ]}
        />
        {isAdmin && <ShopFilter shops={shops} value={shopFilter} onChange={setShopFilter} />}
        <SearchBox value={q} onChange={setQ} placeholder="Search shopper, phone or item" className="ml-auto w-full sm:w-72" />
      </div>

      {loading ? (
        <div className="space-y-4"><Skeleton className="h-40 rounded-2xl" /><Skeleton className="h-40 rounded-2xl" /></div>
      ) : rows.length === 0 ? (
        <EmptyState icon={ClipboardList} title={tab === 'new' ? 'No requests waiting' : tab === 'open' ? 'Nothing in progress' : 'No history yet'} body="New reservations from shoppers show up here the moment they are placed." />
      ) : (
        <ul className="space-y-4">
          {rows.map((r) => (
            <li key={r.id} className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="display text-3xl text-ink">{r.shopperName}</h2>
                    <Badge tone={RESERVATION_STATUS[r.status]?.tone} dot>{RESERVATION_STATUS[r.status]?.label}</Badge>
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-muted">
                    {isAdmin && <span className="font-medium text-ink-2">{r.shopName}</span>}
                    <a href={`tel:${r.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1 hover:text-ink"><PhoneCall className="size-3" aria-hidden="true" />{r.phone}</a>
                    <span>Placed {relativeTime(r.createdAt)}</span>
                    {r.pickupWindow && <span>Wants {r.pickupWindow}</span>}
                  </p>
                </div>
                <p className="display text-3xl tabular text-ink">{inr(r.total)}</p>
              </div>

              <ul className="mt-4 divide-y divide-line rounded-xl bg-sunken px-4 text-sm">
                {r.items.map((i) => (
                  <li key={i.productId} className="flex justify-between gap-4 py-2.5"><span className="text-ink">{i.qty} x {i.name}</span><span className="text-ink-2 tabular">{inr(i.price * i.qty)}</span></li>
                ))}
              </ul>
              {r.note && <p className="mt-3 text-sm text-ink-2"><span className="font-medium text-ink">Shopper note: </span>{r.note}</p>}
              {r.staffNote && <p className="mt-1 text-sm text-ink-2"><span className="font-medium text-ink">Your note: </span>{r.staffNote}</p>}
              {tab === 'done' && <p className="mt-2 text-xs text-muted">Closed {formatDateTime(r.updatedAt)}</p>}

              {ACTIONS[r.status] && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {ACTIONS[r.status].map((a) => (
                    <Button key={a.to} variant={a.variant} size="sm" onClick={() => begin(r, a)}>
                      <a.icon className="size-4" aria-hidden="true" /> {a.label}
                    </Button>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <Modal open={Boolean(action)} onClose={() => setAction(null)} title={action ? COPY[action.def.to][0] : ''} description={action ? COPY[action.def.to][1] : ''} size="sm">
        {action && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run();
            }}
            className="space-y-4"
          >
            {action.def.code && (
              <Input
                label="Pickup code"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setCodeError('');
                }}
                error={codeError}
                placeholder="6 characters"
                autoComplete="off"
                maxLength={8}
                className="text-center font-mono text-lg uppercase tracking-[0.3em]"
                data-autofocus
              />
            )}
            {!action.def.code && (
              <Textarea label="Message to the shopper (optional)" rows={3} value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="For example: Sizes set aside in the changing room area." />
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAction(null)}>Back</Button>
              <Button type="submit" variant={action.def.variant === 'dangerSoft' ? 'danger' : 'primary'} loading={busy}>{action.def.label}</Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
