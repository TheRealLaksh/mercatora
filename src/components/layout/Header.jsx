import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Heart, Menu, ShoppingBag } from 'lucide-react';
import { Wordmark } from '../ui/Logo.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import AccountMenu from './AccountMenu.jsx';
import { Drawer } from '../ui/Modal.jsx';
import { useBag } from '../../context/BagContext.jsx';
import { useFavorites } from '../../context/FavoritesContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';

export const NAV = [
  { to: '/stores', label: 'Stores' },
  { to: '/map', label: 'Floor map' },
  { to: '/whats-on', label: "What's on" },
  { to: '/visit', label: 'Plan your visit' },
];

const linkClass = ({ isActive }) =>
  `relative py-2 text-sm font-medium transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-ink after:transition-transform hover:text-ink hover:after:scale-x-100 ${
    isActive ? 'text-ink after:scale-x-100' : 'text-ink-2'
  }`;

export default function Header() {
  const { count, openBag } = useBag();
  const favs = useFavorites();
  const { mallStatus } = useSettings();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const location = useLocation();
  const status = mallStatus();

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  useEffect(() => setMenu(false), [location.pathname]);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-paper"
      >
        Skip to content
      </a>
      <header
        className={`sticky top-0 z-30 border-b transition-colors duration-300 ${
          scrolled ? 'border-line bg-paper/85 backdrop-blur-xl' : 'border-transparent bg-paper'
        }`}
      >
        <div className="container-x flex h-[4.5rem] items-center gap-6">
          <button
            type="button"
            className="-ml-2 grid size-10 place-items-center rounded-full text-ink hover:bg-sunken lg:hidden"
            onClick={() => setMenu(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>

          <Link to="/" aria-label="Mercatora home" className="shrink-0">
            <Wordmark />
          </Link>

          <nav aria-label="Primary" className="ml-6 hidden items-center gap-7 lg:flex">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} className={linkClass}>
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            <span
              className={`mr-2 hidden items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium xl:inline-flex ${
                status.isOpen ? 'border-ok/30 bg-ok-soft text-ok' : 'border-line-strong bg-sunken text-muted'
              }`}
              title={status.text}
            >
              <span className={`size-1.5 rounded-full ${status.isOpen ? 'bg-ok' : 'bg-muted'}`} aria-hidden="true" />
              Mall {status.text.toLowerCase().replace('closed, ', 'closed. ')}
            </span>
            <Link
              to="/favorites"
              className="relative grid size-10 place-items-center rounded-full text-ink-2 transition hover:bg-sunken hover:text-ink"
              aria-label={`Favourites, ${favs.ids.length} saved`}
            >
              <Heart className="size-[1.15rem]" />
              {favs.ids.length > 0 && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-clay" aria-hidden="true" />}
            </Link>
            <button
              type="button"
              onClick={openBag}
              className="relative grid size-10 place-items-center rounded-full text-ink-2 transition hover:bg-sunken hover:text-ink"
              aria-label={`Open bag, ${count} item${count === 1 ? '' : 's'}`}
            >
              <ShoppingBag className="size-[1.15rem]" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-ink px-1 text-[0.65rem] font-semibold leading-5 text-paper tabular">
                  {count}
                </span>
              )}
            </button>
            <ThemeToggle className="hidden sm:grid" />
            <div className="ml-1">
              <AccountMenu />
            </div>
          </div>
        </div>
      </header>

      <Drawer open={menu} onClose={() => setMenu(false)} title="Menu" side="left" size="sm">
        <nav aria-label="Mobile" className="flex flex-col">
          {[{ to: '/', label: 'Home' }, ...NAV, { to: '/favorites', label: 'Favourites' }, { to: '/reservations', label: 'My reservations' }].map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              className={({ isActive }) => `display border-b border-line py-4 text-3xl ${isActive ? 'text-brass' : 'text-ink'}`}
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-8 flex items-center justify-between text-sm text-muted">
          <span>Appearance</span>
          <ThemeToggle />
        </div>
      </Drawer>
    </>
  );
}
