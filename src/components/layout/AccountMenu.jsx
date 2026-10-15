import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, ClipboardList, Heart, LayoutDashboard, LogOut, UserRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { initials } from '../../lib/format.js';
import { ROLES } from '../../lib/constants.js';
import Button from '../ui/Button.jsx';

export default function AccountMenu() {
  const { user, displayName, role, isStaff, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) {
    return (
      <Button as={Link} to="/login" variant="outline" size="sm">
        Sign in
      </Button>
    );
  }

  const item = 'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-2 transition hover:bg-sunken hover:text-ink';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-line-strong py-1 pl-1 pr-2.5 transition hover:bg-sunken"
      >
        <span className="grid size-8 place-items-center rounded-full bg-ink text-xs font-semibold text-paper">{initials(displayName)}</span>
        <ChevronDown className={`size-4 text-muted transition ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
        <span className="sr-only">Account menu</span>
      </button>
      {open && (
        <div role="menu" className="anim-pop absolute right-0 z-40 mt-2 w-64 origin-top-right rounded-2xl border border-line bg-surface p-2 shadow-lg">
          <div className="border-b border-line px-3 pb-3 pt-2">
            <p className="truncate text-sm font-semibold text-ink">{displayName}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
            <p className="mt-1.5 text-[0.7rem] font-semibold uppercase tracking-wider text-brass">{ROLES[role]?.label}</p>
          </div>
          <div className="pt-2">
            {isStaff && (
              <Link role="menuitem" to="/console" className={item} onClick={() => setOpen(false)}>
                <LayoutDashboard className="size-4" aria-hidden="true" /> Console
              </Link>
            )}
            <Link role="menuitem" to="/reservations" className={item} onClick={() => setOpen(false)}>
              <ClipboardList className="size-4" aria-hidden="true" /> My reservations
            </Link>
            <Link role="menuitem" to="/favorites" className={item} onClick={() => setOpen(false)}>
              <Heart className="size-4" aria-hidden="true" /> Favourites
            </Link>
            <Link role="menuitem" to="/account" className={item} onClick={() => setOpen(false)}>
              <UserRound className="size-4" aria-hidden="true" /> Account
            </Link>
            <button
              type="button"
              role="menuitem"
              className={item}
              onClick={async () => {
                setOpen(false);
                await signOut();
                toast.info('You have been signed out.');
                navigate('/');
              }}
            >
              <LogOut className="size-4" aria-hidden="true" /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
