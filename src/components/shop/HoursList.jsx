import { DAYS } from '../../lib/constants.js';
import { formatDayHours, todayKey } from '../../lib/hours.js';
import { useSettings } from '../../context/SettingsContext.jsx';

export default function HoursList({ hours, className = '' }) {
  const { settings } = useSettings();
  const today = todayKey(new Date(), settings.timezone);
  if (!hours) return <p className="text-sm text-muted">Opening hours have not been listed.</p>;
  return (
    <dl className={`divide-y divide-line text-sm ${className}`}>
      {DAYS.map((d) => (
        <div key={d.key} className={`flex items-center justify-between py-2 ${d.key === today ? 'font-semibold text-ink' : 'text-ink-2'}`}>
          <dt className="flex items-center gap-2">
            {d.long}
            {d.key === today && <span className="rounded-full bg-brass-soft px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-brass">Today</span>}
          </dt>
          <dd className="tabular">{formatDayHours(hours[d.key])}</dd>
        </div>
      ))}
    </dl>
  );
}
