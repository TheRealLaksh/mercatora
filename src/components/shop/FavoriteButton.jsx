import { Heart } from 'lucide-react';
import { useFavorites } from '../../context/FavoritesContext.jsx';

export default function FavoriteButton({ shop, className = '', variant = 'overlay' }) {
  const favs = useFavorites();
  const on = favs.has(shop.id);
  const base =
    variant === 'overlay'
      ? 'bg-paper/90 text-ink backdrop-blur hover:bg-paper'
      : 'border border-line-strong bg-transparent text-ink hover:bg-sunken';
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        favs.toggle(shop.id);
      }}
      aria-pressed={on}
      aria-label={on ? `Remove ${shop.name} from favourites` : `Save ${shop.name} to favourites`}
      className={`grid size-9 place-items-center rounded-full shadow-sm transition active:scale-90 ${base} ${className}`}
    >
      <Heart className={`size-[1.05rem] transition ${on ? 'fill-clay text-clay' : ''}`} />
    </button>
  );
}
