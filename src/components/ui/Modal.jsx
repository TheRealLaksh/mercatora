import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible overlay: focus moves in, Tab is trapped, Escape closes, focus returns to the trigger,
 * and the page behind stops scrolling. `variant` is center | right | left.
 */
export function Overlay({ open, onClose, title, description, variant = 'center', size = 'md', children, hideHeader = false, label }) {
  const panel = useRef(null);
  const returnTo = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    returnTo.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const raf = requestAnimationFrame(() => {
      const el = panel.current;
      if (!el) return;
      const target = el.querySelector('[autofocus], [data-autofocus]') ?? el.querySelector(FOCUSABLE) ?? el;
      target.focus({ preventScroll: true });
    });

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose?.();
        return;
      }
      if (e.key !== 'Tab' || !panel.current) return;
      const nodes = [...panel.current.querySelectorAll(FOCUSABLE)].filter((n) => n.offsetParent !== null);
      if (nodes.length === 0) {
        e.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey, true);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = prevOverflow;
      returnTo.current?.focus?.({ preventScroll: true });
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizes = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };
  const isCenter = variant === 'center';
  const panelClass = isCenter
    ? `anim-pop relative flex max-h-[min(92vh,52rem)] w-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-lg ${sizes[size]}`
    : `${variant === 'right' ? 'anim-slide-right ml-auto' : 'anim-slide-left mr-auto'} relative flex h-full w-full flex-col border-line bg-surface shadow-lg ${
        variant === 'right' ? 'border-l' : 'border-r'
      } ${size === 'lg' ? 'max-w-2xl' : size === 'sm' ? 'max-w-sm' : 'max-w-md'}`;

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex ${isCenter ? 'items-end justify-center p-0 sm:items-center sm:p-6' : ''}`}
      role="presentation"
    >
      <div className="anim-fade-in absolute inset-0 bg-[#16130e]/55 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={hideHeader ? label ?? title : undefined}
        aria-labelledby={hideHeader ? undefined : 'overlay-title'}
        aria-describedby={description ? 'overlay-desc' : undefined}
        tabIndex={-1}
        className={`${panelClass} ${isCenter ? 'max-sm:rounded-b-none max-sm:max-h-[94vh]' : ''}`}
      >
        {!hideHeader && (
          <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
            <div className="min-w-0">
              <h2 id="overlay-title" className="display text-2xl text-ink">
                {title}
              </h2>
              {description && (
                <p id="overlay-desc" className="mt-1 text-sm text-muted">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-2 -mt-1 rounded-full p-2 text-muted transition hover:bg-sunken hover:text-ink"
            >
              <X className="size-5" />
            </button>
          </header>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}

export default function Modal({ children, ...props }) {
  return (
    <Overlay {...props} variant="center">
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
    </Overlay>
  );
}

export function Drawer({ children, footer, ...props }) {
  return (
    <Overlay {...props} variant={props.side ?? 'right'}>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
      {footer && <footer className="border-t border-line bg-surface px-5 py-4 sm:px-6">{footer}</footer>}
    </Overlay>
  );
}
