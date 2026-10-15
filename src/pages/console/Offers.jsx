import { useMemo, useState } from 'react';
import { Eye, EyeOff, Pencil, Plus, Tag, Trash2 } from 'lucide-react';
import { DataTable, PageHeader, ShopFilter } from '../../components/console/ui.jsx';
import { useConsole } from '../../components/console/ConsoleContext.jsx';
import OfferForm from '../../components/console/OfferForm.jsx';
import { Drawer } from '../../components/ui/Modal.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { EmptyState, Skeleton } from '../../components/ui/Feedback.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useConfirm } from '../../context/ConfirmContext.jsx';
import { useCollection } from '../../hooks/useFirestore.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { allOffersQuery, deleteOffer, saveOffer, setOfferPublished, staffShopOffersQuery } from '../../services/offers.js';
import { formatDateRange, toDate } from '../../lib/format.js';

function phase(o, now = new Date()) {
  if (!o.published) return { label: 'Draft', tone: 'neutral' };
  const s = toDate(o.startsAt);
  const e = toDate(o.endsAt);
  if (now > e) return { label: 'Ended', tone: 'neutral' };
  if (now < s) return { label: 'Scheduled', tone: 'info' };
  return { label: 'Live', tone: 'ok' };
}

export default function Offers() {
  useDocumentTitle('Offers and events');
  const { isAdmin } = useAuth();
  const { shops, activeShopId, loading: shopsLoading } = useConsole();
  const toast = useToast();
  const confirm = useConfirm();
  const [shopFilter, setShopFilter] = useState('');
  const [editing, setEditing] = useState(null);

  const scope = isAdmin ? shopFilter : activeShopId;
  const { data, loading } = useCollection(
    () => (scope ? staffShopOffersQuery(scope) : isAdmin ? allOffersQuery() : null),
    [scope, isAdmin],
  );
  const rows = useMemo(() => [...data].sort((a, b) => (b.startsAt?.seconds ?? 0) - (a.startsAt?.seconds ?? 0)), [data]);

  const guard = async (fn, ok) => {
    try {
      await fn();
      if (ok) toast.success(ok);
      return true;
    } catch (err) {
      console.error(err);
      toast.error(err.code === 'permission-denied' ? 'You do not have permission to do that.' : err.message);
      return false;
    }
  };

  async function save(payload) {
    const ok = await guard(() => saveOffer(payload, editing === 'new' ? null : editing.id), editing === 'new' ? 'Created.' : 'Saved.');
    if (ok) setEditing(null);
  }

  if (!isAdmin && !shopsLoading && shops.length === 0) {
    return (<><PageHeader eyebrow="Promotions" title="Offers and events" /><EmptyState icon={Tag} title="No store linked" body="Ask an administrator to link your account to a store first." /></>);
  }

  return (
    <>
      <PageHeader
        eyebrow="Promotions"
        title="Offers and events"
        description={isAdmin ? 'Mall wide campaigns and events, or anything on behalf of a store.' : 'Promote sales and in store events. They expire on their own.'}
        actions={<Button onClick={() => setEditing('new')}><Plus className="size-4" aria-hidden="true" /> New</Button>}
      />
      {isAdmin && <div className="mb-5"><ShopFilter shops={shops} value={shopFilter} onChange={setShopFilter} /></div>}
      {loading ? <Skeleton className="h-64 rounded-2xl" /> : (
        <DataTable
          caption="Offers and events"
          rows={rows}
          empty="Nothing here yet. Create the first offer or event."
          columns={[
            { key: 'title', header: 'Title', render: (o) => (<div><p className="font-medium text-ink">{o.title}</p><p className="text-xs text-muted">{o.shopId ? o.shopName : 'Whole mall'}{o.code ? ` · code ${o.code}` : ''}</p></div>) },
            { key: 'kind', header: 'Type', render: (o) => <Badge tone={o.kind === 'event' ? 'info' : 'brass'}>{o.kind === 'event' ? 'Event' : 'Offer'}</Badge> },
            { key: 'when', header: 'When', render: (o) => <span className="text-ink-2">{formatDateRange(o.startsAt, o.endsAt)}</span> },
            { key: 'phase', header: 'Status', render: (o) => { const p = phase(o); return <Badge tone={p.tone} dot>{p.label}</Badge>; } },
            {
              key: 'actions',
              header: <span className="sr-only">Actions</span>,
              align: 'right',
              render: (o) => (
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="iconSm" aria-label={`Edit ${o.title}`} onClick={() => setEditing(o)}><Pencil className="size-4" /></Button>
                  <Button variant="ghost" size="iconSm" aria-label={o.published ? `Unpublish ${o.title}` : `Publish ${o.title}`} onClick={() => guard(() => setOfferPublished(o, !o.published), o.published ? 'Unpublished.' : 'Published.')}>
                    {o.published ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                  <Button variant="ghost" size="iconSm" aria-label={`Delete ${o.title}`} className="text-clay hover:bg-clay-soft" onClick={async () => { if (await confirm({ title: `Delete "${o.title}"?`, body: 'This cannot be undone.', confirmLabel: 'Delete', tone: 'danger' })) guard(() => deleteOffer(o), 'Deleted.'); }}><Trash2 className="size-4" /></Button>
                </div>
              ),
            },
          ]}
        />
      )}

      <Drawer open={Boolean(editing)} onClose={() => setEditing(null)} title={editing === 'new' ? 'New offer or event' : 'Edit'}>
        {editing && (
          <OfferForm
            key={editing === 'new' ? 'new' : editing.id}
            offer={editing === 'new' ? null : editing}
            shops={shops}
            isAdmin={isAdmin}
            defaultShopId={scope || undefined}
            onSubmit={save}
            onCancel={() => setEditing(null)}
          />
        )}
      </Drawer>
    </>
  );
}
