import { Search } from 'lucide-react';

export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="display mt-1.5 text-5xl text-ink">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-ink-2">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function StatCard({ label, value, hint, tone = 'default', icon: Icon }) {
  const tones = { default: 'text-ink', warn: 'text-warn', danger: 'text-clay', ok: 'text-ok' };
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-center justify-between text-muted">
        <p className="text-xs font-medium">{label}</p>
        {Icon && <Icon className="size-4" aria-hidden="true" />}
      </div>
      <p className={`display mt-2 text-5xl tabular ${tones[tone]}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder = 'Search', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-10 w-full rounded-full border border-line-strong bg-surface pl-10 pr-4 text-sm text-ink placeholder:text-muted focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass-fill/40"
      />
    </div>
  );
}

export function Panel({ title, action, children, className = '', pad = true }) {
  return (
    <section className={`rounded-2xl border border-line bg-surface ${className}`}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          {action}
        </header>
      )}
      <div className={pad ? 'p-5' : ''}>{children}</div>
    </section>
  );
}

/** Plain responsive table. columns: [{ key, header, render?, className?, align? }] */
export function DataTable({ columns, rows, rowKey = (r) => r.id, empty, caption }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
      <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b border-line bg-sunken/60 text-xs uppercase tracking-wider text-muted">
            {columns.map((c) => (
              <th key={c.key} scope="col" className={`whitespace-nowrap px-4 py-3 font-semibold ${c.align === 'right' ? 'text-right' : ''}`}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-muted">
                {empty ?? 'Nothing to show.'}
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={rowKey(r)} className="transition-colors hover:bg-sunken/50">
                {columns.map((c) => (
                  <td key={c.key} className={`px-4 py-3 align-middle ${c.align === 'right' ? 'text-right tabular' : ''} ${c.className ?? ''}`}>
                    {c.render ? c.render(r) : r[c.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/** Store picker used by pages that can be scoped to one store. */
export function ShopFilter({ shops, value, onChange, allowAll = true, label = 'Store' }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-ink-2">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 max-w-[14rem] rounded-full border border-line-strong bg-surface px-4 text-sm text-ink focus:border-brass focus:outline-none"
      >
        {allowAll && <option value="">All stores</option>}
        {shops.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </label>
  );
}
