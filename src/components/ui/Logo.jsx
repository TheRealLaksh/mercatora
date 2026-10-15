export function LogoMark({ className = 'size-8' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Mercatora" fill="none">
      <rect width="64" height="64" rx="14" className="fill-ink" />
      <path
        d="M12 50V30a8 8 0 0 1 16 0v20M24 50V26a8 8 0 0 1 16 0v24M36 50V30a8 8 0 0 1 16 0v20"
        stroke="var(--brass-fill)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Wordmark({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark />
      <span className="display text-[1.7rem] leading-none text-ink">Mercatora</span>
    </span>
  );
}
