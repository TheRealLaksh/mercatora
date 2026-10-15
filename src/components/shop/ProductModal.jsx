import { useState } from 'react';
import { Minus, Plus, ShoppingBag } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import Badge from '../ui/Badge.jsx';
import { ProductImage } from '../art/Art.jsx';
import { discountPercent, inr } from '../../lib/format.js';
import { LOW_STOCK, MAX_BAG_QTY } from '../../lib/constants.js';
import { useBag } from '../../context/BagContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function ProductModal({ product, shop, onClose }) {
  const [qty, setQty] = useState(1);
  const bag = useBag();
  const toast = useToast();
  if (!product) return null;
  const max = Math.min(MAX_BAG_QTY, product.stock);
  const out = product.stock < 1;
  const off = discountPercent(product.price, product.mrp);

  function reserve() {
    bag.add(product, shop, qty);
    toast.success(`${qty} x ${product.name} added to your bag.`);
    onClose();
    bag.openBag();
  }

  return (
    <Modal open onClose={onClose} title={product.name} description={shop ? `From ${shop.name}` : undefined} size="lg">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-xl bg-sunken">
          <ProductImage product={product} shopCategory={shop?.category} />
        </div>
        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2">
            {product.category && <Badge>{product.category}</Badge>}
            {off > 0 && <Badge tone="danger">{off}% off</Badge>}
            {out ? <Badge>Sold out</Badge> : product.stock <= LOW_STOCK ? <Badge tone="warn">Only {product.stock} left</Badge> : <Badge tone="ok" dot>In stock</Badge>}
          </div>
          <p className="mt-4 flex items-baseline gap-3 tabular">
            <span className="display text-4xl text-ink">{inr(product.price)}</span>
            {product.mrp > product.price && <span className="text-sm text-muted line-through">{inr(product.mrp)}</span>}
          </p>
          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ink-2">{product.description || 'No description yet.'}</p>

          <div className="mt-auto pt-6">
            {!out && (
              <div className="mb-4 flex items-center gap-3">
                <span className="text-sm text-muted">Quantity</span>
                <div className="inline-flex items-center rounded-full border border-line-strong">
                  <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid size-9 place-items-center rounded-full hover:bg-sunken" aria-label="Decrease quantity" disabled={qty <= 1}>
                    <Minus className="size-4" />
                  </button>
                  <span className="w-8 text-center text-sm tabular" aria-live="polite">{qty}</span>
                  <button type="button" onClick={() => setQty((q) => Math.min(max, q + 1))} className="grid size-9 place-items-center rounded-full hover:bg-sunken" aria-label="Increase quantity" disabled={qty >= max}>
                    <Plus className="size-4" />
                  </button>
                </div>
              </div>
            )}
            <Button className="w-full" size="lg" onClick={reserve} disabled={out}>
              <ShoppingBag className="size-4" aria-hidden="true" />
              {out ? 'Sold out' : `Reserve for ${inr(product.price * qty)}`}
            </Button>
            <p className="mt-3 text-center text-xs text-muted">Reserve online, collect and pay at the store.</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
