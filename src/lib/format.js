const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const inrFormatterFraction = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function inr(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  return Number.isInteger(n) ? inrFormatter.format(n) : inrFormatterFraction.format(n);
}

export function plural(n, one, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

export function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') return value.toDate();
  if (typeof value === 'number' || typeof value === 'string') return new Date(value);
  return null;
}

export function formatDate(value, opts = {}) {
  const d = toDate(value);
  if (!d) return '';
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', ...opts }).format(d);
}

export function formatDateTime(value) {
  const d = toDate(value);
  if (!d) return '';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
}

export function formatDateRange(start, end) {
  const s = toDate(start);
  const e = toDate(end);
  if (!s || !e) return '';
  const sameDay = s.toDateString() === e.toDateString();
  if (sameDay) {
    return `${formatDate(s, { weekday: 'short' })}, ${formatTime(s)} to ${formatTime(e)}`;
  }
  return `${formatDate(s)} to ${formatDate(e)}`;
}

export function formatTime(value) {
  const d = toDate(value);
  if (!d) return '';
  return new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
    .format(d)
    .replace(' am', ' AM')
    .replace(' pm', ' PM');
}

/** "3 days left", "Starts tomorrow", "Ended". */
export function timeToGo(startsAt, endsAt, now = new Date()) {
  const s = toDate(startsAt);
  const e = toDate(endsAt);
  if (!s || !e) return '';
  const day = 86400000;
  if (now > e) return 'Ended';
  if (now < s) {
    const days = Math.ceil((s - now) / day);
    if (days <= 0) return 'Starts today';
    if (days === 1) return 'Starts tomorrow';
    return `Starts in ${days} days`;
  }
  const hours = Math.ceil((e - now) / 3600000);
  if (hours <= 24) return hours <= 1 ? 'Ends within the hour' : `Ends in ${hours} hours`;
  const days = Math.ceil((e - now) / day);
  return `${days} days left`;
}

export function relativeTime(value, now = new Date()) {
  const d = toDate(value);
  if (!d) return '';
  const sec = Math.round((now - d) / 1000);
  if (sec < 45) return 'just now';
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const days = Math.round(hr / 24);
  if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  return formatDate(d, { year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

export function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function discountPercent(price, mrp) {
  const p = Number(price);
  const m = Number(mrp);
  if (!m || !p || m <= p) return 0;
  return Math.round(((m - p) / m) * 100);
}

export function slugify(text = '') {
  return text
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
