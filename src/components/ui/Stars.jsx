import { Star } from 'lucide-react';

/** Read only star row. `value` can be fractional. */
export function Stars({ value = 0, size = 'size-4', className = '' }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = Math.max(0, Math.min(1, value - (n - 1)));
        return (
          <span key={n} className={`relative inline-block ${size}`} aria-hidden="true">
            <Star className={`absolute inset-0 ${size} text-line-strong`} strokeWidth={1.5} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className={`${size} fill-brass-fill text-brass-fill`} strokeWidth={1.5} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

export function RatingBadge({ avg, count }) {
  if (!count) return <span className="text-xs text-muted">New</span>;
  return (
    <span className="inline-flex items-center gap-1 text-sm font-medium text-ink tabular">
      <Star className="size-3.5 fill-brass-fill text-brass-fill" aria-hidden="true" />
      {avg.toFixed(1)}
      <span className="font-normal text-muted">({count})</span>
    </span>
  );
}

/** Keyboard friendly radio group. */
export function RatingInput({ value, onChange, error }) {
  return (
    <div role="radiogroup" aria-label="Your rating" aria-invalid={error ? true : undefined} className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          onClick={() => onChange(n)}
          className="rounded p-1 transition-transform hover:scale-110"
        >
          <Star className={`size-7 ${n <= value ? 'fill-brass-fill text-brass-fill' : 'text-line-strong'}`} strokeWidth={1.5} />
        </button>
      ))}
    </div>
  );
}
