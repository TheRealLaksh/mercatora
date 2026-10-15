import { useMemo, useState } from 'react';
import { AlertTriangle, Archive, Minus, Package, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { DataTable, PageHeader, SearchBox, ShopFilter } from '../../components/console/ui.jsx';
import { useConsole } from '../../components/console/ConsoleContext.jsx';
import ProductForm from '../../components/console/ProductForm.jsx';
import { Drawer } from '../../components/ui/Modal.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { EmptyState, Skeleton } from '../../components/ui/Feedback.jsx';
import { ProductImage } from '../../components/art/Art.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useConfirm } from '../../context/ConfirmContext.jsx';
import { useCollection } from '../../hooks/useFirestore.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { allProductsQuery, deleteProduct, saveProduct, setProductStatus, setStock, staffProductsQuery } from '../../services/products.js';
import { LOW_STOCK, PRODUCT_STATUS } from '../../lib/constants.js';
import { inr } from '../../lib/format.js';

function StockStepper({ product, onChange }) {
  const [busy, setBusy] = useState(false);
  async function change(next) {
    if (next < 0) return;
    setBusy(true);
    try {
      await onChange(product, next);
    } finally {
      setBusy(false);
    }
  }
  const low = product.stock <= LOW_STOCK;
  return (
    <div className="inline-flex items-center gap-1">
      <button type="button" disabled={busy || product.stock < 1} onClick={() => change(product.stock - 1)} className="grid size-7 place-items-center rounded-full border border-line-strong hover:bg-sunken disabled:opacity-40" aria-label={`Decrease stock of ${product.name}`}><Minus className="size-3.5" /></button>
      <span className={`flex w-12 items-center justify-center gap-1 text-sm tabular ${low ? 'font-semibold text-warn' : 'text-ink'}`} aria-live="polite">
        {low && <AlertTriangle className="size-3" aria-hidden="true" />}{product.stock}
      </span>
      <button type="button" disabled={busy} onClick={() => change(product.stock + 1)} className="grid size-7 place-items-center rounded-full border border-line-strong hover:bg-sunken disabled:opacity-40" aria-label={`Increase stock of ${product.name}`}><Plus className="size-3.5" /></button>
    </div>
  );
}

export default function Products() {
  useDocumentTitle('Products');
  const { isAdmin } = useAuth();
  const { shops, byId, activeShopId, loading: shopsLoading } = useConsole();
  const toast = useToast();
  const confirm = useConfirm();
  const [shopFilter, setShopFilter] = useState('');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [lowOnly, setLowOnly] = useState(false);
  const [editing, setEditing] = useState(null);

  const scope = isAdmin ? shopFilter : activeShopId;
  const { data, loading } = useCollection(
    () => (scope ? staffProductsQuery(scope) : isAdmin ? allProductsQuery() : null),
    [scope, isAdmin],
  );

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return data
      .filter((p) => (status === 'all' || p.status === status) && (!lowOnly || p.stock <= LOW_STOCK) && (!t || `${p.name} ${p.category}`.toLowerCase().includes(t)))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data, q, status, lowOnly]);

  const guard = async (fn, ok) => {
    try {
      await fn();
      if (ok) toast.success(ok);
    } catch (err) {
      console.error(err);
      toast.error(err.code === 'permission-denied' ? 'You do not have permission to do that.' : err.message);
    }
  };

  async function save(form) {
    await guard(async () => {
      await saveProduct(form, editing === 'new' ? null : editing.id);
      setEditing(null);
    }, editing === 'new' ? 'Product added.' : 'Product saved.');
  }

  async function remove(p) {
    if (!(await confirm({ title: `Delete ${p.name}?`, body: 'Past reservations keep their copy of the item. Archive it instead if you only want it off the shelf.', confirmLabel: 'Delete', tone: 'danger' }))) return;
    await guard(() => deleteProduct(p), 'Product deleted.');
  }

  if (!isAdmin && !shopsLoading && shops.length === 0) {
    return (<><PageHeader eyebrow="Catalog" title="Products" /><EmptyState icon={Package} title="No store linked" body="Ask an administrator to link your account to a store first." /></>);
  }

  return (
    <>
      <PageHeader
        eyebrow="Catalog"
        title="Products"
        description="Everything shoppers can reserve. Adjust stock inline, or open a product for the full detail."
        actions={<Button onClick={() => setEditing('new')} disabled={shops.length === 0}><Plus className="size-4" aria-hidden="true" /> Add product</Button>}
      />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <SearchBox value={q} onChange={setQ} placeholder="Search products" className="w-full sm:w-72" />
        {isAdmin && <ShopFilter shops={shops} value={shopFilter} onChange={setShopFilter} />}
        <select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-full border border-line-strong bg-surface px-4 text-sm">
          <option value="all">Any status</option>
          {Object.entries(PRODUCT_STATUS).map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
        </select>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink-2">
          <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} className="size-4 accent-[var(--moss)]" /> Low stock only
        </label>
        <p className="ml-auto text-sm text-muted tabular">{rows.length} of {data.length}</p>
      </div>

      {loading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : (
        <DataTable
          caption="Products"
          rows={rows}
          empty={data.length === 0 ? 'No products yet. Add the first one.' : 'No products match these filters.'}
          columns={[
            {
              key: 'name',
              header: 'Product',
              render: (p) => (
                <div className="flex items-center gap-3">
                  <div className="size-11 shrink-0 overflow-hidden rounded-lg"><ProductImage product={p} shopCategory={byId[p.shopId]?.category} /></div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{p.name}</p>
                    <p className="truncate text-xs text-muted">{[p.category, isAdmin && !shopFilter ? byId[p.shopId]?.name : null].filter(Boolean).join(' · ')}</p>
                  </div>
                </div>
              ),
            },
            { key: 'price', header: 'Price', align: 'right', render: (p) => <>{inr(p.price)}{p.mrp > p.price && <span className="ml-1.5 text-xs text-muted line-through">{inr(p.mrp)}</span>}</> },
            { key: 'stock', header: 'Stock', render: (p) => <StockStepper product={p} onChange={(prod, n) => guard(() => setStock(prod, n))} /> },
            { key: 'status', header: 'Status', render: (p) => <Badge tone={PRODUCT_STATUS[p.status]?.tone} dot>{PRODUCT_STATUS[p.status]?.label}</Badge> },
            {
              key: 'actions',
              header: <span className="sr-only">Actions</span>,
              align: 'right',
              render: (p) => (
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="iconSm" onClick={() => setEditing(p)} aria-label={`Edit ${p.name}`}><Pencil className="size-4" /></Button>
                  <Button variant="ghost" size="iconSm" onClick={() => guard(() => setProductStatus(p, p.status === 'archived' ? 'active' : 'archived'), p.status === 'archived' ? 'Product restored.' : 'Product archived.')} aria-label={p.status === 'archived' ? `Restore ${p.name}` : `Archive ${p.name}`}>
                    {p.status === 'archived' ? <RotateCcw className="size-4" /> : <Archive className="size-4" />}
                  </Button>
                  <Button variant="ghost" size="iconSm" onClick={() => remove(p)} aria-label={`Delete ${p.name}`} className="text-clay hover:bg-clay-soft"><Trash2 className="size-4" /></Button>
                </div>
              ),
            },
          ]}
        />
      )}

      <Drawer open={Boolean(editing)} onClose={() => setEditing(null)} title={editing === 'new' ? 'Add a product' : `Edit ${editing?.name ?? ''}`}>
        {editing && (
          <ProductForm
            key={editing === 'new' ? 'new' : editing.id}
            product={editing === 'new' ? null : editing}
            shops={shops.filter((s) => s.status !== 'inactive' || editing?.shopId === s.id)}
            defaultShopId={scope || undefined}
            onSubmit={save}
            onCancel={() => setEditing(null)}
          />
        )}
      </Drawer>
    </>
  );
}
