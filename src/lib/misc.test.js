import { describe, expect, it } from 'vitest';
import { aggregateRatings, distribution } from './ratings.js';
import { discountPercent, inr, initials, relativeTime, slugify, timeToGo } from './format.js';
import { normaliseCode, pickupCode } from './code.js';
import { FLOOR_PLANS, vacantUnits, getUnit } from './floorPlans.js';

describe('ratings', () => {
  it('aggregates per shop and rounds to one decimal', () => {
    const r = aggregateRatings([{ shopId: 'a', rating: 5 }, { shopId: 'a', rating: 4 }, { shopId: 'a', rating: 4 }, { shopId: 'b', rating: 1 }]);
    expect(r.a).toMatchObject({ avg: 4.3, count: 3 });
    expect(r.b.count).toBe(1);
  });
  it('builds a distribution', () => expect(distribution([{ rating: 5 }, { rating: 5 }, { rating: 2 }])).toEqual({ 5: 2, 4: 0, 3: 0, 2: 1, 1: 0 }));
});

describe('format', () => {
  it('formats rupees with Indian grouping', () => {
    expect(inr(1234567)).toMatch(/12,34,567/);
    expect(inr(99.5)).toMatch(/99\.50/);
  });
  it('computes discounts', () => {
    expect(discountPercent(80, 100)).toBe(20);
    expect(discountPercent(100, 100)).toBe(0);
    expect(discountPercent(100, null)).toBe(0);
  });
  it('makes initials and slugs', () => {
    expect(initials('Kaveri Loom')).toBe('KL');
    expect(initials('Voltix')).toBe('VO');
    expect(slugify('Pages & Paper')).toBe('pages-and-paper');
  });
  it('describes relative time', () => {
    const now = new Date('2026-10-15T12:00:00Z');
    expect(relativeTime(new Date('2026-10-15T11:58:00Z'), now)).toBe('2 min ago');
    expect(relativeTime(new Date('2026-10-14T12:00:00Z'), now)).toBe('1 day ago');
  });
  it('describes time to go', () => {
    const now = new Date('2026-10-15T12:00:00Z');
    expect(timeToGo(new Date('2026-10-14'), new Date('2026-10-20T12:00:00Z'), now)).toBe('5 days left');
    expect(timeToGo(new Date('2026-10-16T12:00:00Z'), new Date('2026-10-20'), now)).toBe('Starts tomorrow');
    expect(timeToGo(new Date('2026-10-01'), new Date('2026-10-02'), now)).toBe('Ended');
  });
});

describe('pickup codes', () => {
  it('are six characters from a safe alphabet', () => {
    for (let i = 0; i < 200; i += 1) expect(pickupCode()).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/);
  });
  it('normalise typed input', () => expect(normaliseCode(' kv7-p2m ')).toBe('KV7P2M'));
});

describe('floor plans', () => {
  it('have 24 uniquely identified units per floor', () => {
    for (const plan of Object.values(FLOOR_PLANS)) {
      expect(plan.units).toHaveLength(24);
      expect(new Set(plan.units.map((u) => u.id)).size).toBe(24);
    }
  });
  it('no two units overlap', () => {
    const plan = FLOOR_PLANS.G;
    for (const a of plan.units) {
      for (const b of plan.units) {
        if (a === b) continue;
        const overlap = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
        expect(overlap, `${a.id} overlaps ${b.id}`).toBe(false);
      }
    }
  });
  it('look up units and track vacancy', () => {
    expect(getUnit('2-05').floor).toBe('2');
    const shops = [{ id: 's1', unitId: 'G-02', status: 'active' }, { id: 's2', unitId: 'G-03', status: 'inactive' }];
    const free = vacantUnits('G', shops).map((u) => u.id);
    expect(free).not.toContain('G-02');
    expect(free).toContain('G-03'); // archived shops free their unit
    expect(vacantUnits('G', shops, 's1').map((u) => u.id)).toContain('G-02'); // a shop keeps its own unit
  });
});
