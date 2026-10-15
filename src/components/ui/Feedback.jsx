import { AlertTriangle, Loader2 } from 'lucide-react';

export function Spinner({ className = 'size-5' }) {
  return <Loader2 className={`animate-spin text-muted ${className}`} aria-label="Loading" role="status" />;
}

export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export function EmptyState({ icon: Icon, title, body, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong px-6 py-14 text-center ${className}`}>
      {Icon && (
        <span className="mb-4 grid size-12 place-items-center rounded-full bg-sunken text-muted">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      )}
      <h3 className="display text-2xl text-ink">{title}</h3>
      {body && <p className="mt-2 max-w-md text-sm text-muted">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', body = 'We could not load this. Check your connection and try again.', onRetry }) {
  return (
    <div role="alert" className="flex flex-col items-center rounded-2xl border border-clay/30 bg-clay-soft px-6 py-12 text-center">
      <AlertTriangle className="mb-3 size-7 text-clay" aria-hidden="true" />
      <h3 className="display text-2xl text-ink">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-ink-2">{body}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-4 rounded-full bg-ink px-5 py-2 text-sm font-medium text-paper">
          Try again
        </button>
      )}
    </div>
  );
}

export function PageLoader({ label = 'Loading' }) {
  return (
    <div className="grid min-h-[50vh] place-items-center" role="status" aria-label={label}>
      <Loader2 className="size-7 animate-spin text-muted" />
    </div>
  );
}
