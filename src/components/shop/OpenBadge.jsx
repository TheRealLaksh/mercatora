import { useMemo } from 'react';
import { getOpenStatus } from '../../lib/hours.js';
import { useSettings } from '../../context/SettingsContext.jsx';

export function useOpenStatus(hours) {
  const { settings } = useSettings();
  return useMemo(() => getOpenStatus(hours, new Date(), settings.timezone), [hours, settings.timezone]);
}

export default function OpenBadge({ hours, long = false, className = '' }) {
  const s = useOpenStatus(hours);
  if (!s.known) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${s.isOpen ? 'text-ok' : 'text-muted'} ${className}`}>
      <span className={`size-1.5 rounded-full ${s.isOpen ? 'bg-ok' : 'bg-muted'}`} aria-hidden="true" />
      {long ? s.text : s.short}
    </span>
  );
}
