const TONES = {
  neutral: 'bg-sunken text-ink-2 ring-line',
  ok: 'bg-ok-soft text-ok ring-ok/20',
  warn: 'bg-warn-soft text-warn ring-warn/20',
  danger: 'bg-clay-soft text-clay ring-clay/20',
  info: 'bg-moss-soft text-moss ring-moss/20',
  brass: 'bg-brass-soft text-brass ring-brass/20',
  moss: 'bg-moss-soft text-moss ring-moss/20',
};

export default function Badge({ tone = 'neutral', dot = false, className = '', children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${TONES[tone] ?? TONES.neutral} ${className}`}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
}
