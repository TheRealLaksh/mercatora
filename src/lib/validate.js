export function isEmail(value = '') {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

/** Accepts Indian style numbers with optional +91, spaces or dashes. */
export function isPhone(value = '') {
  const digits = value.replace(/[^\d]/g, '');
  return digits.length >= 8 && digits.length <= 14;
}

export function isUrl(value = '') {
  if (!value) return true;
  try {
    const u = new URL(value.startsWith('http') ? value : `https://${value}`);
    return Boolean(u.hostname.includes('.'));
  } catch {
    return false;
  }
}

export function normaliseUrl(value = '') {
  const v = value.trim();
  if (!v) return '';
  return v.startsWith('http') ? v : `https://${v}`;
}

export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}
