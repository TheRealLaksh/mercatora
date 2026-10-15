/** Pill style segmented tabs. items: [{ id, label, count? }] */
export function Segmented({ items, value, onChange, label, className = '' }) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={`inline-flex max-w-full gap-1 overflow-x-auto rounded-full border border-line bg-sunken p-1 scrollbar-none ${className}`}
    >
      {items.map((it) => {
        const active = it.id === value;
        return (
          <button
            key={it.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(it.id)}
            className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition ${
              active ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'
            }`}
          >
            {it.label}
            {it.count !== undefined && (
              <span className={`tabular rounded-full px-1.5 text-xs ${active ? 'bg-sunken text-ink-2' : 'bg-line text-muted'}`}>{it.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Chip filters that can wrap or scroll. */
export function Chips({ items, value, onChange, label }) {
  return (
    <div role="group" aria-label={label} className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {items.map((it) => {
        const active = it.id === value;
        return (
          <button
            key={it.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(it.id)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${
              active ? 'border-ink bg-ink text-paper' : 'border-line-strong bg-surface text-ink-2 hover:border-ink-2 hover:text-ink'
            }`}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
