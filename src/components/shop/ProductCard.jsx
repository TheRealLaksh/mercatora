import { Plus, Check } from 'lucide-react';
import { ProductImage } from '../art/Art.jsx';
import Badge from '../ui/Badge.jsx';
import { discountPercent, inr } from '../../lib/format.js';
import { LOW_STOCK } from '../../lib/constants.js';
import { useBag } from '../../context/BagContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function ProductCard({ product, shop, onOpen }) {
  const bag = useBag();
  const toast = useToast();
  const inBag = bag.items.find((i) => i.productId === product.id)?.qty ?? 0;
  const out = product.stock < 1;
  const off = discountPercent(product.price, product.mrp);

  function add(e) {
    e.stopPropagation();
    bag.add(product, shop);
    toast.success(`${product.name} added to your bag.`);
  }

  return (
    <article className="group relative">
      <button type="button" onClick={() => onOpen(product)} className="block w-full rounded-xl text-left outline-offset-4">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-sunken">
          <div className={`h-full w-full transition duration-500 group-hover:scale-105 ${out ? 'opacity-50 grayscale' : ''}`}>
            <ProductImage product={product} shopCategory={shop?.category} />
          </div>
          <div className="absolute left-2.5 top-2.5 flex gap-1.5">
            {off > 0 && !out && <Badge tone="danger" className="!bg-clay !text-inverse !ring-0">{off}% off</Badge>}
            {out && <Badge tone="neutral">Sold out</Badge>}
            {!out && product.stock <= LOW_STOCK && <Badge tone="warn">Only {product.stock} left</Badge>}
          </div>
        </div>
        <h3 className="mt-3 line-clamp-1 text-sm font-medium text-ink">{product.name}</h3>
        <p className="mt-0.5 flex items-baseline gap-2 tabular">
          <span className="text-sm font-semibold text-ink">{inr(product.price)}</span>
          {product.mrp > product.price && <span className="text-xs text-muted line-through">{inr(product.mrp)}</span>}
        </p>
      </button>
      <button
        type="button"
        onClick={add}
        disabled={out}
        aria-label={out ? `${product.name} is sold out` : `Reserve ${product.name}`}
        className="absolute bottom-[3.9rem] right-2.5 grid size-10 place-items-center rounded-full bg-ink text-paper shadow-md transition hover:scale-105 active:scale-95 disabled:hidden sm:translate-y-1 sm:opacity-0 sm:group-focus-within:translate-y-0 sm:group-focus-within:opacity-100 sm:group-hover:translate-y-0 sm:group-hover:opacity-100"
      >
        {inBag > 0 ? <Check className="size-4" /> : <Plus className="size-[1.1rem]" />}
      </button>
    </article>
  );
}
