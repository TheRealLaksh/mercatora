import { useMemo, useState } from 'react';
import { collection, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase.js';
import Button from '../ui/Button.jsx';
import { Input, Select, Switch, Textarea } from '../ui/Field.jsx';
import ImageUpload from '../ui/ImageUpload.jsx';
import HoursEditor from '../ui/HoursEditor.jsx';
import { CATEGORY_IDS, FLOORS, SHOP_STATUS } from '../../lib/constants.js';
import { emptyWeek } from '../../lib/hours.js';
import { vacantUnits } from '../../lib/floorPlans.js';
import { hasErrors, validateShop } from '../../lib/schemas.js';

/**
 * Admins edit everything. `ownerOnly` limits the form to the fields store owners may change
 * (the same limit the security rules enforce).
 */
export default function ShopForm({ shop, allShops, ownerOnly = false, onSubmit, onCancel }) {
  const isNew = !shop;
  const newId = useMemo(() => (isNew ? doc(collection(db, 'shops')).id : shop.id), [isNew, shop]);
  const [f, setF] = useState(() => ({
    name: '',
    category: '',
    floor: 'G',
    unitId: '',
    tagline: '',
    description: '',
    phone: '',
    email: '',
    website: '',
    logoUrl: '',
    coverUrl: '',
    tags: [],
    featured: false,
    ownerName: '',
    status: 'active',
    hours: emptyWeek(),
    ...(shop ?? {}),
  }));
  const [tagText, setTagText] = useState((shop?.tags ?? []).join(', '));
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const units = useMemo(() => vacantUnits(f.floor, allShops ?? [], shop?.id), [f.floor, allShops, shop]);

  async function submit(e) {
    e.preventDefault();
    const data = { ...f, tags: tagText.split(',').map((t) => t.trim()).filter(Boolean) };
    const errs = validateShop(data, { ownerOnly });
    setErrors(errs);
    if (hasErrors(errs)) return;
    setBusy(true);
    try {
      await onSubmit(data, newId);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-8" id="shop-form">
      {ownerOnly && (
        <p className="rounded-xl bg-brass-soft p-3 text-sm text-ink-2">
          Name, category, floor, unit and visibility are managed by the mall office. Contact an administrator to change them.
        </p>
      )}

      {!ownerOnly && (
        <fieldset className="space-y-4">
          <legend className="eyebrow mb-3">Tenancy</legend>
          <Input label="Store name" value={f.name} onChange={set('name')} error={errors.name} required maxLength={80} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Category" value={f.category} onChange={set('category')} error={errors.category} required>
              <option value="">Choose a category</option>
              {CATEGORY_IDS.map((c) => (<option key={c} value={c}>{c}</option>))}
            </Select>
            <Input label="Owner or company name" value={f.ownerName} onChange={set('ownerName')} hint="Shown only in the console." />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Floor" value={f.floor} onChange={(e) => setF((s) => ({ ...s, floor: e.target.value, unitId: '' }))} error={errors.floor} required>
              {FLOORS.map((fl) => (<option key={fl.id} value={fl.id}>{fl.name}</option>))}
            </Select>
            <Select label="Unit" value={f.unitId} onChange={set('unitId')} error={errors.unitId} required hint={`${units.length} free on this floor`}>
              <option value="">Choose a unit</option>
              {units.map((u) => (<option key={u.id} value={u.id}>{u.id} ({u.area} sq m)</option>))}
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Status" value={f.status} onChange={set('status')} hint="Archived stores disappear from the public site.">
              {Object.entries(SHOP_STATUS).map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
            </Select>
            <div className="pt-6"><Switch label="Featured on the home page" checked={f.featured} onChange={(v) => setF((s) => ({ ...s, featured: v }))} /></div>
          </div>
        </fieldset>
      )}

      <fieldset className="space-y-4">
        <legend className="eyebrow mb-3">Public profile</legend>
        <Input label="Tagline" value={f.tagline} onChange={set('tagline')} error={errors.tagline} maxLength={140} hint="One line under the store name." />
        <Textarea label="About the store" value={f.description} onChange={set('description')} error={errors.description} rows={5} maxLength={2000} />
        <Input label="Tags" value={tagText} onChange={(e) => setTagText(e.target.value)} hint="Comma separated, for example: menswear, denim, sale" />
        <div className="grid gap-4 sm:grid-cols-2">
          <ImageUpload label="Logo" kind="shops" scope={newId} value={f.logoUrl} onChange={(url) => setF((s) => ({ ...s, logoUrl: url }))} aspect="aspect-square" />
          <ImageUpload label="Cover photo" kind="shops" scope={newId} value={f.coverUrl} onChange={(url) => setF((s) => ({ ...s, coverUrl: url }))} aspect="aspect-square" hint="Wide images work best." />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="eyebrow mb-3">Contact</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Phone" type="tel" value={f.phone} onChange={set('phone')} error={errors.phone} autoComplete="off" />
          <Input label="Email" type="email" value={f.email} onChange={set('email')} error={errors.email} autoComplete="off" />
        </div>
        <Input label="Website" value={f.website} onChange={set('website')} error={errors.website} placeholder="example.com" />
      </fieldset>

      <HoursEditor value={f.hours} onChange={(hours) => setF((s) => ({ ...s, hours }))} error={errors.hours} />

      <div className="sticky bottom-0 -mx-5 flex justify-end gap-2 border-t border-line bg-surface px-5 py-4 sm:-mx-6 sm:px-6">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={busy}>{isNew ? 'Onboard store' : 'Save changes'}</Button>
      </div>
    </form>
  );
}
