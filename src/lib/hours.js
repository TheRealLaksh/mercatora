import { DAYS } from './constants.js';

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export function minutesOf(time) {
  if (!time || typeof time !== 'string') return null;
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

export function formatClock(time) {
  const mins = minutesOf(time);
  if (mins === null) return '';
  const h24 = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const suffix = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return m === 0 ? `${h12} ${suffix}` : `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** Day index (0 = Sunday) and minutes since midnight in a given IANA time zone. */
export function zonedParts(date = new Date(), timeZone = 'Asia/Kolkata') {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type)?.value;
  const weekday = get('weekday');
  const dayIndex = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(weekday);
  return {
    dayIndex,
    dayKey: DAY_KEYS[dayIndex],
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  };
}

function entryOpenAt(entry, minutes) {
  if (!entry || entry.closed) return false;
  const o = minutesOf(entry.open);
  const c = minutesOf(entry.close);
  if (o === null || c === null) return false;
  if (c > o) return minutes >= o && minutes < c;
  // overnight, for example 18:00 to 02:00
  return minutes >= o;
}

function spillsFromYesterday(entry, minutes) {
  if (!entry || entry.closed) return false;
  const o = minutesOf(entry.open);
  const c = minutesOf(entry.close);
  if (o === null || c === null || c > o) return false;
  return minutes < c;
}

/**
 * Returns { isOpen, text, short } for a weekly hours map.
 * text example: "Open until 10 PM" or "Closed, opens Tue 10 AM".
 */
export function getOpenStatus(hours, now = new Date(), timeZone = 'Asia/Kolkata') {
  if (!hours) return { isOpen: false, text: 'Hours not listed', short: 'Hours not listed', known: false };
  const { dayIndex, minutes } = zonedParts(now, timeZone);
  const today = hours[DAY_KEYS[dayIndex]];
  const yesterday = hours[DAY_KEYS[(dayIndex + 6) % 7]];

  if (spillsFromYesterday(yesterday, minutes)) {
    const text = `Open until ${formatClock(yesterday.close)}`;
    return { isOpen: true, text, short: 'Open now', known: true };
  }
  if (entryOpenAt(today, minutes)) {
    const text = `Open until ${formatClock(today.close)}`;
    return { isOpen: true, text, short: 'Open now', known: true };
  }

  // Opens later today?
  if (today && !today.closed) {
    const o = minutesOf(today.open);
    if (o !== null && minutes < o) {
      return { isOpen: false, text: `Closed, opens today ${formatClock(today.open)}`, short: 'Closed', known: true };
    }
  }
  for (let i = 1; i <= 7; i += 1) {
    const idx = (dayIndex + i) % 7;
    const entry = hours[DAY_KEYS[idx]];
    if (entry && !entry.closed && minutesOf(entry.open) !== null) {
      const dayShort = i === 1 ? 'tomorrow' : DAYS.find((d) => d.key === DAY_KEYS[idx])?.short;
      return { isOpen: false, text: `Closed, opens ${dayShort} ${formatClock(entry.open)}`, short: 'Closed', known: true };
    }
  }
  return { isOpen: false, text: 'Closed', short: 'Closed', known: true };
}

export function formatDayHours(entry) {
  if (!entry || entry.closed) return 'Closed';
  return `${formatClock(entry.open)} to ${formatClock(entry.close)}`;
}

export function todayKey(now = new Date(), timeZone = 'Asia/Kolkata') {
  return zonedParts(now, timeZone).dayKey;
}

export function emptyWeek(open = '10:00', close = '22:00') {
  return Object.fromEntries(DAYS.map((d) => [d.key, { open, close, closed: false }]));
}

/** Basic validation for an hours map. Returns a list of problems, empty when fine. */
export function validateHours(hours) {
  const problems = [];
  for (const d of DAYS) {
    const e = hours?.[d.key];
    if (!e) {
      problems.push(`${d.long} is missing`);
      continue;
    }
    if (e.closed) continue;
    if (minutesOf(e.open) === null || minutesOf(e.close) === null) {
      problems.push(`${d.long} needs an opening and closing time`);
    } else if (minutesOf(e.open) === minutesOf(e.close)) {
      problems.push(`${d.long} opens and closes at the same time`);
    }
  }
  return problems;
}
