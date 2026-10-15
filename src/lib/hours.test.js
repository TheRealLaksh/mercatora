import { describe, expect, it } from 'vitest';
import { emptyWeek, formatClock, getOpenStatus, validateHours, zonedParts } from './hours.js';

// 2026-10-14 is a Wednesday. Times below are IST (UTC+5:30).
const ist = (iso) => new Date(`${iso}+05:30`);

describe('hours', () => {
  const week = emptyWeek('10:00', '22:00');

  it('formats clock times', () => {
    expect(formatClock('00:00')).toBe('12 AM');
    expect(formatClock('13:30')).toBe('1:30 PM');
    expect(formatClock('22:00')).toBe('10 PM');
  });

  it('reads the day and minutes in the mall time zone, not the viewer time zone', () => {
    const p = zonedParts(ist('2026-10-14T23:30:00'), 'Asia/Kolkata');
    expect(p.dayKey).toBe('wed');
    expect(p.minutes).toBe(23 * 60 + 30);
  });

  it('is open inside opening hours', () => {
    const s = getOpenStatus(week, ist('2026-10-14T15:00:00'));
    expect(s.isOpen).toBe(true);
    expect(s.text).toBe('Open until 10 PM');
  });

  it('says when it opens later today', () => {
    const s = getOpenStatus(week, ist('2026-10-14T07:00:00'));
    expect(s.isOpen).toBe(false);
    expect(s.text).toBe('Closed, opens today 10 AM');
  });

  it('points to tomorrow after closing', () => {
    const s = getOpenStatus(week, ist('2026-10-14T23:00:00'));
    expect(s.text).toBe('Closed, opens tomorrow 10 AM');
  });

  it('skips closed days', () => {
    const w = { ...week, thu: { ...week.thu, closed: true } };
    const s = getOpenStatus(w, ist('2026-10-14T23:00:00'));
    expect(s.text).toBe('Closed, opens Fri 10 AM');
  });

  it('handles overnight hours, including the spill past midnight', () => {
    const late = { ...week, wed: { open: '09:00', close: '01:00', closed: false } };
    expect(getOpenStatus(late, ist('2026-10-14T23:30:00')).isOpen).toBe(true);
    const spill = getOpenStatus(late, ist('2026-10-15T00:30:00'));
    expect(spill.isOpen).toBe(true);
    expect(spill.text).toBe('Open until 1 AM');
    expect(getOpenStatus(late, ist('2026-10-15T01:30:00')).isOpen).toBe(false);
  });

  it('treats missing hours as unknown', () => {
    expect(getOpenStatus(undefined).known).toBe(false);
  });

  it('validates hours', () => {
    expect(validateHours(week)).toEqual([]);
    expect(validateHours({ ...week, mon: { open: '10:00', close: '10:00', closed: false } })[0]).toMatch(/same time/);
    expect(validateHours({ ...week, tue: undefined })[0]).toMatch(/missing/);
  });
});
