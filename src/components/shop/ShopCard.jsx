import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { ShopCover } from '../art/Art.jsx';
import { RatingBadge } from '../ui/Stars.jsx';
import FavoriteButton from './FavoriteButton.jsx';
import OpenBadge from './OpenBadge.jsx';
import { FLOORS } from '../../lib/constants.js';
import { useShops } from '../../context/ShopsContext.jsx';

export function floorLabel(id) {
  return FLOORS.find((f) => f.id === id)?.label ?? id;
}

export default function ShopCard({ shop, className = '', style, as: Heading = 'h3' }) {
  const { ratings } = useShops();
  const r = ratings[shop.id];
  return (
    <article className={`group relative ${className}`} style={style}>
      <Link to={`/stores/${shop.id}`} className="block rounded-2xl outline-offset-4">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-sunken">
          <div className="h-full w-full transition duration-700 ease-out group-hover:scale-[1.04]">
            <ShopCover shop={shop} />
          </div>
          <span className="absolute left-3 top-3 rounded-full bg-paper/90 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-wider text-ink backdrop-blur">
            {shop.category}
          </span>
        </div>
        <div className="mt-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Heading className="display truncate text-[1.65rem] leading-tight text-ink">{shop.name}</Heading>
            {shop.tagline && <p className="mt-0.5 line-clamp-1 text-sm text-muted">{shop.tagline}</p>}
          </div>
          <RatingBadge avg={r?.avg ?? 0} count={r?.count ?? 0} />
        </div>
        <div className="mt-2.5 flex items-center gap-3 text-xs text-ink-2">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5 text-brass" aria-hidden="true" />
            {floorLabel(shop.floor)}, {shop.unitId}
          </span>
          <OpenBadge hours={shop.hours} />
        </div>
      </Link>
      <FavoriteButton shop={shop} className="absolute right-3 top-3" />
    </article>
  );
}

export function ShopCardSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="skeleton aspect-[4/3] rounded-2xl" />
      <div className="skeleton mt-4 h-7 w-2/3" />
      <div className="skeleton mt-2 h-4 w-1/2" />
    </div>
  );
}
