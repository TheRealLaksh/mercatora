import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Drawer } from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { Input, Select, Textarea } from '../ui/Field.jsx';
import { EmptyState } from '../ui/Feedback.jsx';
import { ProductImage } from '../art/Art.jsx';
import { useBag } from '../../context/BagContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { inr, plural } from '../../lib/format.js';
import { PICKUP_WINDOWS } from '../../lib/constants.js';
import { hasErrors, validateContact } from '../../lib/schemas.js';
import { createReservations } from '../../services/reservations.js';

export default function BagDrawer() {
  const bag = useBag();
  const { user, displayName } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState('bag');
  const [form, setForm] = useState({ name: '', phone: '', note: '', window: PICKUP_WINDOWS[0].id });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);

  const close = () => {
    bag.closeBag();
    setTimeout(() => {
      setStep('bag');
      setDone(null);
    }, 250);
  };

  async function submit(e) {
    e.preventDefault();
    const contact = { name: form.name || displayName, phone: form.phone, note: form.note };
    const errs = validateContact(contact);
    setErrors(errs);
    if (hasErrors(errs)) return;
    setBusy(true);
    try {
      const result = await createReservations({
        items: bag.items,
        contact,
        pickupWindow: PICKUP_WINDOWS.find((w) => w.id === form.window)?.label,
      });
      bag.clear();
      setDone(result);
      setStep('done');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'We could not place your reservation.');
    } finally {
      setBusy(false);
    }
  }

  const footer =
    step === 'bag' && bag.items.length > 0 ? (
      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-sm text-muted">Estimated total, pay at store</span>
          <span className="display text-3xl tabular text-ink">{inr(bag.total)}</span>
        </div>
        {user ? (
          <Button className="w-full" size="lg" onClick={() => setStep('details')}>
            Continue to pickup details
          </Button>
        ) : (
          <Button as={Link} to="/login" state={{ from: '/' }} onClick={close} className="w-full" size="lg">
            Sign in to reserve
          </Button>
        )}
      </div>
    ) : null;

  return (
    <Drawer
      open={bag.open}
      onClose={close}
      title={step === 'details' ? 'Pickup details' : step === 'done' ? 'Reserved' : 'Your bag'}
      description={step === 'bag' ? 'Reserve now, collect from the store, pay there.' : undefined}
      footer={footer}
    >
      {step === 'bag' &&
        (bag.items.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="Your bag is empty"
            body="Browse a store and tap Reserve on anything you like. Nothing is charged until you collect it."
            action={
              <Button as={Link} to="/stores" onClick={close} variant="outline">
                Browse stores
              </Button>
            }
          />
        ) : (
          <div className="space-y-8">
            {bag.groups.map((g) => (
              <section key={g.shopId} aria-label={g.shopName}>
                <div className="mb-3 flex items-baseline justify-between">
                  <h3 className="display text-2xl text-ink">{g.shopName}</h3>
                  <span className="text-xs text-muted">{plural(g.items.length, 'item')}</span>
                </div>
                <ul className="divide-y divide-line">
                  {g.items.map((i) => (
                    <li key={i.productId} className="flex gap-3 py-3.5">
                      <div className="size-16 shrink-0 overflow-hidden rounded-lg">
                        <ProductImage product={{ id: i.productId, name: i.name, imageUrl: i.imageUrl, category: i.category }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">{i.name}</p>
                        <p className="text-sm text-muted tabular">{inr(i.price)}</p>
                        <div className="mt-2 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => bag.setQty(i.productId, i.qty - 1)}
                            className="grid size-7 place-items-center rounded-full border border-line-strong hover:bg-sunken"
                            aria-label={`Decrease quantity of ${i.name}`}
                          >
                            <Minus className="size-3.5" />
                          </button>
                          <span className="w-8 text-center text-sm tabular" aria-live="polite">
                            {i.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => bag.setQty(i.productId, i.qty + 1)}
                            className="grid size-7 place-items-center rounded-full border border-line-strong hover:bg-sunken disabled:opacity-40"
                            aria-label={`Increase quantity of ${i.name}`}
                            disabled={i.qty >= Math.min(10, i.stock ?? 10)}
                          >
                            <Plus className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => bag.remove(i.productId)}
                            className="ml-2 grid size-7 place-items-center rounded-full text-muted hover:bg-clay-soft hover:text-clay"
                            aria-label={`Remove ${i.name}`}
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-ink tabular">{inr(i.price * i.qty)}</p>
                    </li>
                  ))}
                </ul>
                <p className="mt-1 text-right text-xs text-muted tabular">Subtotal {inr(g.total)}</p>
              </section>
            ))}
            {bag.groups.length > 1 && (
              <p className="rounded-xl bg-sunken p-3 text-xs leading-relaxed text-ink-2">
                You are buying from {bag.groups.length} stores, so you will get {bag.groups.length} pickup codes, one per store.
              </p>
            )}
          </div>
        ))}

      {step === 'details' && (
        <form onSubmit={submit} className="space-y-5" noValidate id="pickup-form">
          <Input
            label="Collecting under the name"
            value={form.name || displayName}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={errors.name}
            autoComplete="name"
            required
          />
          <Input
            label="Phone number"
            type="tel"
            inputMode="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            error={errors.phone}
            hint="The store may call if an item needs a size or colour check."
            autoComplete="tel"
            placeholder="+91 98765 43210"
            required
          />
          <Select label="Preferred pickup window" value={form.window} onChange={(e) => setForm({ ...form, window: e.target.value })}>
            {PICKUP_WINDOWS.map((w) => (
              <option key={w.id} value={w.id}>
                {w.label}
              </option>
            ))}
          </Select>
          <Textarea
            label="Note for the store"
            rows={3}
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            error={errors.note}
            placeholder="Optional. Size, gift wrap, anything useful."
          />
          <div className="rounded-xl bg-sunken p-4 text-sm text-ink-2">
            <p className="font-medium text-ink">How it works</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs leading-relaxed">
              <li>Each store confirms your request and sets the items aside.</li>
              <li>You get a pickup code for each store on the Reservations page.</li>
              <li>Show the code at the counter and pay there.</li>
            </ol>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep('bag')} className="flex-1">
              Back
            </Button>
            <Button type="submit" loading={busy} className="flex-[2]" size="lg">
              Reserve {inr(bag.total)}
            </Button>
          </div>
        </form>
      )}

      {step === 'done' && done && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 rounded-xl bg-ok-soft p-4 text-ok">
            <Check className="size-5 shrink-0" aria-hidden="true" />
            <p className="text-sm font-medium">
              {plural(done.created.length, 'reservation')} sent. Each store will confirm shortly.
            </p>
          </div>
          {done.problems.length > 0 && (
            <ul className="space-y-1 rounded-xl bg-warn-soft p-4 text-xs text-warn">
              {done.problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
          <ul className="space-y-3">
            {done.created.map((c) => (
              <li key={c.id} className="rounded-xl border border-line-strong p-4">
                <p className="text-xs uppercase tracking-wider text-muted">{c.shopName}</p>
                <p className="display mt-1 text-4xl tracking-[0.18em] text-ink">{c.code}</p>
                <p className="mt-1 text-xs text-muted tabular">{inr(c.total)} to pay at store</p>
              </li>
            ))}
          </ul>
          <Button
            className="w-full"
            onClick={() => {
              close();
              navigate('/reservations');
            }}
          >
            View my reservations
          </Button>
        </div>
      )}
    </Drawer>
  );
}
