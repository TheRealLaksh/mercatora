import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import ShopCard, { ShopCardSkeleton } from '../../components/shop/ShopCard.jsx';
import { EmptyState } from '../../components/ui/Feedback.jsx';
import Button from '../../components/ui/Button.jsx';
import { useShops } from '../../context/ShopsContext.jsx';
import { useFavorites } from '../../context/FavoritesContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';

export default function Favorites() {
  useDocumentTitle('Favourites');
  const { byId, loading } = useShops();
  const { ids } = useFavorites();
  const { user } = useAuth();
  const saved = ids.map((id) => byId[id]).filter(Boolean);

  return (
    <div className="container-x pb-8 pt-12 sm:pt-16">
      <header>
        <p className="eyebrow">Saved for later</p>
        <h1 className="display mt-3 text-6xl text-ink sm:text-7xl">Favourites</h1>
        {!user && (
          <p className="mt-4 max-w-xl text-ink-2">
            These are saved on this device. <Link to="/login" state={{ from: '/favorites' }} className="font-semibold text-brass underline-offset-2 hover:underline">Sign in</Link> to keep them across devices.
          </p>
        )}
      </header>
      <div className="mt-12">
        {loading ? (
          <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3"><ShopCardSkeleton /><ShopCardSkeleton /><ShopCardSkeleton /></div>
        ) : saved.length === 0 ? (
          <EmptyState icon={Heart} title="No favourites yet" body="Tap the heart on any store to save it here." action={<Button as={Link} to="/stores">Browse stores</Button>} />
        ) : (
          <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">{saved.map((s) => <ShopCard key={s.id} shop={s} as="h2" />)}</div>
        )}
      </div>
    </div>
  );
}
