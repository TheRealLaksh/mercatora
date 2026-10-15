import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive, ExternalLink, Pencil, Plus, RotateCcw, Store, Trash2 } from 'lucide-react';
import { DataTable, PageHeader, SearchBox } from '../../components/console/ui.jsx';
import { useConsole } from '../../components/console/ConsoleContext.jsx';
import ShopForm from '../../components/console/ShopForm.jsx';
import { Drawer } from '../../components/ui/Modal.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { EmptyState, Skeleton } from '../../components/ui/Feedback.jsx';
import { ShopLogo } from '../../components/art/Art.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useConfirm } from '../../context/ConfirmContext.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { createShop, deleteShopCascade, setShopStatus, updateShop } from '../../services/shops.js';
import { CATEGORY_IDS, FLOORS, SHOP_STATUS } from '../../lib/constants.js';
import { relativeTime } from '../../lib/format.js';

export default function Stores() {
  useDocumentTitle('Stores');
  const { isAdmin } = useAuth();
  const { shops, loading } = useConsole();
  const toast = useToast();
  const confirm = useConfirm();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [floor, setFloor] = useState('all');
  const [category, setCategory] = useState('all');
  const [editing, setEditing] = useState(null); // null closed, 'new', or shop

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return shops.filter(
      (s) =>
        (status === 'all' || s.status === status) &&
        (floor === 'all' || s.floor === floor) &&
        (category === 'all' || s.category === category) &&
        (!t || `${s.name} ${s.ownerName ?? ''} ${s.unitId}`.toLowerCase().includes(t)),
    );
  }, [shops, q, status, floor, category]);

  async function save(data, id) {
    try {
      if (editing === 'new') {
        await createShop(data, id);
        toast.success(`${data.name} is onboarded.`);
      } else {
        await updateShop(editing.id, data, { ownerOnly: !isAdmin });
        toast.success('Store updated.');
      }
      setEditing(null);
    } catch (err) {
      console.error(err);
      toast.error(err.code === 'permission-denied' ? 'You do not have permission to make that change.' : err.message);
    }
  }

  async function toggleArchive(s) {
    const archiving = s.status === 'active';
    if (archiving && !(await confirm({ title: `Archive ${s.name}?`, body: 'It disappears from the public site but nothing is deleted. You can restore it any time.', confirmLabel: 'Archive' }))) return;
    try {
      await setShopStatus(s, archiving ? 'inactive' : 'active');
      toast.success(archiving ? 'Store archived.' : 'Store restored.');
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function remove(s) {
    if (!(await confirm({ title: `Delete ${s.name} for good?`, body: 'This permanently removes the store together with its products, offers, reviews and reservations, and unlinks its owners. Archive it instead if you may want it back.', confirmLabel: 'Delete everything', tone: 'danger' }))) return;
    try {
      const r = await deleteShopCascade(s);
      toast.success(`${s.name} deleted along with ${r.products} products.`);
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow={isAdmin ? 'Tenancy' : 'Your store'}
        title={isAdmin ? 'Stores' : 'My store'}
        description={isAdmin ? 'Onboard tenants, assign floor units and control what the public sees.' : 'Keep your public profile, contact details and opening hours up to date.'}
        actions={isAdmin && <Button onClick={() => setEditing('new')}><Plus className="size-4" aria-hidden="true" /> Onboard store</Button>}
      />

      {isAdmin && (
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <SearchBox value={q} onChange={setQ} placeholder="Search by name, owner or unit" className="w-full sm:w-72" />
          <select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-full border border-line-strong bg-surface px-4 text-sm">
            <option value="all">Any status</option>
            {Object.entries(SHOP_STATUS).map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
          </select>
          <select aria-label="Floor" value={floor} onChange={(e) => setFloor(e.target.value)} className="h-10 rounded-full border border-line-strong bg-surface px-4 text-sm">
            <option value="all">Any floor</option>
            {FLOORS.map((f) => (<option key={f.id} value={f.id}>{f.name}</option>))}
          </select>
          <select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value)} className="h-10 rounded-full border border-line-strong bg-surface px-4 text-sm">
            <option value="all">Any category</option>
            {CATEGORY_IDS.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
          <p className="ml-auto text-sm text-muted tabular">{rows.length} of {shops.length}</p>
        </div>
      )}

      {loading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : shops.length === 0 ? (
        <EmptyState icon={Store} title={isAdmin ? 'No stores yet' : 'No store linked'} body={isAdmin ? 'Onboard your first tenant to bring the directory to life.' : 'Ask an administrator to link your account to your store.'} action={isAdmin && <Button onClick={() => setEditing('new')}>Onboard store</Button>} />
      ) : (
        <DataTable
          caption="Stores"
          rows={rows}
          empty="No stores match these filters."
          columns={[
            {
              key: 'name',
              header: 'Store',
              render: (s) => (
                <div className="flex items-center gap-3">
                  <ShopLogo shop={s} className="size-10 text-sm" rounded="rounded-xl" />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{s.name}{s.featured && <span className="ml-2 text-xs font-normal text-brass">Featured</span>}</p>
                    <p className="text-xs text-muted">{s.category}</p>
                  </div>
                </div>
              ),
            },
            { key: 'loc', header: 'Location', render: (s) => `${FLOORS.find((f) => f.id === s.floor)?.label ?? s.floor}, ${s.unitId}` },
            { key: 'owner', header: 'Owner', render: (s) => s.ownerName || <span className="text-muted">Not set</span> },
            { key: 'status', header: 'Status', render: (s) => <Badge tone={SHOP_STATUS[s.status]?.tone} dot>{SHOP_STATUS[s.status]?.label}</Badge> },
            { key: 'updated', header: 'Updated', render: (s) => <span className="text-muted">{relativeTime(s.updatedAt)}</span> },
            {
              key: 'actions',
              header: <span className="sr-only">Actions</span>,
              align: 'right',
              render: (s) => (
                <div className="flex justify-end gap-1">
                  <Button as={Link} to={`/stores/${s.id}`} variant="ghost" size="iconSm" aria-label={`View ${s.name} on the public site`}><ExternalLink className="size-4" /></Button>
                  <Button variant="ghost" size="iconSm" onClick={() => setEditing(s)} aria-label={`Edit ${s.name}`}><Pencil className="size-4" /></Button>
                  {isAdmin && (
                    <>
                      <Button variant="ghost" size="iconSm" onClick={() => toggleArchive(s)} aria-label={s.status === 'active' ? `Archive ${s.name}` : `Restore ${s.name}`}>
                        {s.status === 'active' ? <Archive className="size-4" /> : <RotateCcw className="size-4" />}
                      </Button>
                      <Button variant="ghost" size="iconSm" onClick={() => remove(s)} aria-label={`Delete ${s.name}`} className="text-clay hover:bg-clay-soft"><Trash2 className="size-4" /></Button>
                    </>
                  )}
                </div>
              ),
            },
          ]}
        />
      )}

      <Drawer open={Boolean(editing)} onClose={() => setEditing(null)} title={editing === 'new' ? 'Onboard a store' : `Edit ${editing?.name ?? ''}`} size="lg">
        {editing && (
          <ShopForm
            key={editing === 'new' ? 'new' : editing.id}
            shop={editing === 'new' ? null : editing}
            allShops={shops}
            ownerOnly={!isAdmin}
            onSubmit={save}
            onCancel={() => setEditing(null)}
          />
        )}
      </Drawer>
    </>
  );
}
