import { useState } from 'react';
import Button from '../ui/Button.jsx';
import { Input, Select, Textarea } from '../ui/Field.jsx';
import ImageUpload from '../ui/ImageUpload.jsx';
import { PRODUCT_STATUS } from '../../lib/constants.js';
import { hasErrors, validateProduct } from '../../lib/schemas.js';

export default function ProductForm({ product, shops, defaultShopId, onSubmit, onCancel }) {
  const isNew = !product;
  const [f, setF] = useState({
    shopId: defaultShopId ?? shops[0]?.id ?? '',
    name: '',
    description: '',
    category: '',
    price: '',
    stock: '',
    imageUrl: '',
    status: 'active',
    ...(product ?? {}),
    mrp: product?.mrp ?? '',
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    const errs = validateProduct(f);
    setErrors(errs);
    if (hasErrors(errs)) return;
    setBusy(true);
    try {
      await onSubmit(f);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {shops.length > 1 || isNew ? (
        <Select label="Store" value={f.shopId} onChange={set('shopId')} error={errors.shopId} disabled={!isNew} required>
          <option value="">Choose a store</option>
          {shops.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
        </Select>
      ) : null}
      <Input label="Product name" value={f.name} onChange={set('name')} error={errors.name} required maxLength={120} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Product category" value={f.category} onChange={set('category')} hint="For example: Shirts, Headphones, Starters." />
        <Select label="Status" value={f.status} onChange={set('status')} hint="Only live products show on the public site.">
          {Object.entries(PRODUCT_STATUS).map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
        </Select>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Input label="Price (INR)" type="number" inputMode="decimal" min="0" step="0.01" value={f.price} onChange={set('price')} error={errors.price} required />
        <Input label="Original price" type="number" inputMode="decimal" min="0" step="0.01" value={f.mrp} onChange={set('mrp')} error={errors.mrp} hint="Optional. Shows a discount." />
        <Input label="Stock" type="number" inputMode="numeric" min="0" step="1" value={f.stock} onChange={set('stock')} error={errors.stock} required />
      </div>
      <Textarea label="Description" value={f.description} onChange={set('description')} error={errors.description} rows={4} maxLength={2000} />
      {f.shopId && <ImageUpload label="Photo" kind="products" scope={f.shopId} value={f.imageUrl} onChange={(url) => setF((s) => ({ ...s, imageUrl: url }))} aspect="aspect-[4/3]" />}
      <div className="sticky bottom-0 -mx-5 flex justify-end gap-2 border-t border-line bg-surface px-5 py-4 sm:-mx-6 sm:px-6">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={busy}>{isNew ? 'Add product' : 'Save changes'}</Button>
      </div>
    </form>
  );
}
