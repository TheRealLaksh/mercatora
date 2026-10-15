import { useState } from 'react';
import Button from '../ui/Button.jsx';
import { Input, Select, Switch, Textarea } from '../ui/Field.jsx';
import ImageUpload from '../ui/ImageUpload.jsx';
import { hasErrors, validateOffer } from '../../lib/schemas.js';
import { toDate } from '../../lib/format.js';

/** datetime-local wants "YYYY-MM-DDTHH:mm" in local time. */
function toLocalInput(value) {
  const d = toDate(value);
  if (!d) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function OfferForm({ offer, shops, isAdmin, defaultShopId, onSubmit, onCancel }) {
  const isNew = !offer;
  const now = new Date();
  const [f, setF] = useState({
    kind: 'offer',
    title: '',
    description: '',
    shopId: isAdmin ? '' : defaultShopId ?? shops[0]?.id ?? '',
    imageUrl: '',
    location: '',
    code: '',
    published: true,
    ...(offer ?? {}),
    startsAt: toLocalInput(offer?.startsAt ?? now),
    endsAt: toLocalInput(offer?.endsAt ?? new Date(now.getTime() + 7 * 86400000)),
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    const payload = {
      ...f,
      shopName: shops.find((s) => s.id === f.shopId)?.name ?? '',
      startsAt: f.startsAt ? new Date(f.startsAt) : null,
      endsAt: f.endsAt ? new Date(f.endsAt) : null,
    };
    const errs = validateOffer(payload);
    if (!isAdmin && !payload.shopId) errs.shopId = 'Choose your store.';
    setErrors(errs);
    if (hasErrors(errs)) return;
    setBusy(true);
    try {
      await onSubmit(payload);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Type" value={f.kind} onChange={set('kind')} error={errors.kind}>
          <option value="offer">Offer or promotion</option>
          <option value="event">Event</option>
        </Select>
        <Select label={isAdmin ? 'Hosted by' : 'Store'} value={f.shopId} onChange={set('shopId')} error={errors.shopId} required={!isAdmin}>
          {isAdmin && <option value="">Whole mall</option>}
          {!isAdmin && !f.shopId && <option value="">Choose a store</option>}
          {shops.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
        </Select>
      </div>
      <Input label="Title" value={f.title} onChange={set('title')} error={errors.title} required maxLength={120} />
      <Textarea label="Description" value={f.description} onChange={set('description')} error={errors.description} rows={4} maxLength={1500} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Starts" type="datetime-local" value={f.startsAt} onChange={set('startsAt')} error={errors.startsAt} required />
        <Input label="Ends" type="datetime-local" value={f.endsAt} onChange={set('endsAt')} error={errors.endsAt} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Location" value={f.location} onChange={set('location')} hint="For example: Atrium, Level 2." />
        {f.kind === 'offer' && <Input label="Promo code" value={f.code} onChange={set('code')} hint="Optional." maxLength={20} />}
      </div>
      <ImageUpload label="Image" kind="offers" scope={f.shopId || 'mall'} value={f.imageUrl} onChange={(url) => setF((s) => ({ ...s, imageUrl: url }))} aspect="aspect-[16/9]" />
      <Switch label="Published" description="Unpublished items are only visible in the console." checked={f.published} onChange={(v) => setF((s) => ({ ...s, published: v }))} />
      <div className="sticky bottom-0 -mx-5 flex justify-end gap-2 border-t border-line bg-surface px-5 py-4 sm:-mx-6 sm:px-6">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={busy}>{isNew ? 'Create' : 'Save changes'}</Button>
      </div>
    </form>
  );
}
