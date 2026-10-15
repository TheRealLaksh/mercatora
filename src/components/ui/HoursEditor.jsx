import { DAYS } from '../../lib/constants.js';
import { emptyWeek } from '../../lib/hours.js';

/** Weekly opening hours editor. value is { mon: { open, close, closed }, ... }. */
export default function HoursEditor({ value, onChange, error }) {
  const hours = value ?? emptyWeek();
  const set = (key, patch) => onChange({ ...hours, [key]: { ...hours[key], ...patch } });

  function copyMonday() {
    const mon = hours.mon;
    onChange(Object.fromEntries(DAYS.map((d) => [d.key, { ...mon }])));
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[0.8rem] font-medium text-ink">Opening hours</span>
        <button type="button" onClick={copyMonday} className="text-xs font-medium text-brass underline-offset-2 hover:underline">
          Copy Monday to all days
        </button>
      </div>
      <div className="divide-y divide-line rounded-xl border border-line-strong bg-surface">
        {DAYS.map((d) => {
          const e = hours[d.key] ?? { open: '10:00', close: '22:00', closed: false };
          return (
            <div key={d.key} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3.5 py-2.5">
              <span className="w-20 text-sm font-medium text-ink">{d.long}</span>
              <label className="flex items-center gap-2 text-xs text-muted">
                <input type="checkbox" checked={e.closed} onChange={(ev) => set(d.key, { closed: ev.target.checked })} className="size-4 accent-[var(--moss)]" />
                Closed
              </label>
              {!e.closed && (
                <div className="ml-auto flex items-center gap-2">
                  <input
                    type="time"
                    aria-label={`${d.long} opens`}
                    value={e.open}
                    onChange={(ev) => set(d.key, { open: ev.target.value })}
                    className="h-9 rounded-md border border-line-strong bg-paper px-2 text-sm text-ink"
                  />
                  <span className="text-xs text-muted">to</span>
                  <input
                    type="time"
                    aria-label={`${d.long} closes`}
                    value={e.close}
                    onChange={(ev) => set(d.key, { close: ev.target.value })}
                    className="h-9 rounded-md border border-line-strong bg-paper px-2 text-sm text-ink"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-clay" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
