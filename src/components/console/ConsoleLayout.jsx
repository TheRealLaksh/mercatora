import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ClipboardList, ExternalLink, LayoutDashboard, Menu, MessageSquareQuote, Package, ScrollText, Settings, Store, Tag, Users } from 'lucide-react';
import { Wordmark } from '../ui/Logo.jsx';
import ThemeToggle from '../layout/ThemeToggle.jsx';
import AccountMenu from '../layout/AccountMenu.jsx';
import { Drawer } from '../ui/Modal.jsx';
import Badge from '../ui/Badge.jsx';
import { ConsoleProvider, useConsole } from './ConsoleContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROLES } from '../../lib/constants.js';

const ALL = [
  { to: '/console', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/console/stores', label: 'Stores', icon: Store },
  { to: '/console/products', label: 'Products', icon: Package },
  { to: '/console/reservations', label: 'Reservations', icon: ClipboardList },
  { to: '/console/offers', label: 'Offers and events', icon: Tag },
  { to: '/console/reviews', label: 'Reviews', icon: MessageSquareQuote },
  { to: '/console/users', label: 'People', icon: Users, admin: true },
  { to: '/console/audit', label: 'Audit log', icon: ScrollText, admin: true },
  { to: '/console/settings', label: 'Mall settings', icon: Settings, admin: true },
];

function Nav({ onNavigate }) {
  const { isAdmin } = useAuth();
  return (
    <nav aria-label="Console" className="flex flex-col gap-0.5">
      {ALL.filter((i) => !i.admin || isAdmin).map((i) => (
        <NavLink
          key={i.to}
          to={i.to}
          end={i.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              isActive ? 'bg-ink text-paper' : 'text-ink-2 hover:bg-sunken hover:text-ink'
            }`
          }
        >
          <i.icon className="size-[1.1rem]" aria-hidden="true" />
          {i.label}
        </NavLink>
      ))}
    </nav>
  );
}

function ShopSwitcher() {
  const { isAdmin } = useAuth();
  const { shops, activeShopId, setActiveShopId } = useConsole();
  if (isAdmin || shops.length < 2) return null;
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="hidden text-muted sm:inline">Working on</span>
      <select value={activeShopId} onChange={(e) => setActiveShopId(e.target.value)} className="h-10 rounded-full border border-line-strong bg-surface px-4 text-sm font-medium text-ink">
        {shops.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
      </select>
    </label>
  );
}

function Shell() {
  const { role } = useAuth();
  const [menu, setMenu] = useState(false);
  const location = useLocation();
  useEffect(() => setMenu(false), [location.pathname]);

  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[16.5rem_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-line bg-surface p-5 lg:flex">
        <Link to="/" aria-label="Back to the public site"><Wordmark /></Link>
        <div className="mt-8 flex-1 overflow-y-auto"><Nav /></div>
        <div className="border-t border-line pt-4">
          <Badge tone={ROLES[role]?.tone}>{ROLES[role]?.label}</Badge>
          <Link to="/" className="mt-3 flex items-center gap-2 text-sm text-ink-2 hover:text-ink"><ExternalLink className="size-4" aria-hidden="true" /> View public site</Link>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-paper/90 px-4 backdrop-blur-xl sm:px-8">
          <button type="button" onClick={() => setMenu(true)} className="grid size-10 place-items-center rounded-full text-ink hover:bg-sunken lg:hidden" aria-label="Open console menu">
            <Menu className="size-5" />
          </button>
          <Link to="/" className="lg:hidden" aria-label="Public site"><Wordmark className="[&_span:last-child]:hidden sm:[&_span:last-child]:inline" /></Link>
          <div className="ml-auto flex items-center gap-2">
            <ShopSwitcher />
            <ThemeToggle />
            <AccountMenu />
          </div>
        </header>
        <main id="main" tabIndex={-1} className="mx-auto max-w-[78rem] px-4 py-8 outline-none sm:px-8 sm:py-10">
          <Outlet />
        </main>
      </div>

      <Drawer open={menu} onClose={() => setMenu(false)} title="Console" side="left" size="sm">
        <Nav onNavigate={() => setMenu(false)} />
      </Drawer>
    </div>
  );
}

export default function ConsoleLayout() {
  return (
    <ConsoleProvider>
      <Shell />
    </ConsoleProvider>
  );
}
