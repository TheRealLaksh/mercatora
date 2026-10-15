import { FLOORS } from './constants.js';

// Every floor uses the same 24 unit footprint so the map reads as one building.
// ViewBox is 1000 x 600. Units are listed clockwise from the top left corner.

const W = 1000;
const H = 600;

function unit(floor, n, x, y, w, h, tier) {
  const id = `${floor}-${String(n).padStart(2, '0')}`;
  return { id, floor, x, y, w, h, tier, area: Math.round((w * h) / 40) };
}

function buildUnits(floor) {
  const units = [];
  let n = 1;
  const add = (x, y, w, h, tier) => units.push(unit(floor, n++, x, y, w, h, tier));

  // top-left corner, top row (6), top-right corner
  add(24, 24, 146, 126, 'anchor');
  for (let i = 0; i < 6; i += 1) add(170 + i * 110, 24, 110, 126, 'standard');
  add(830, 24, 146, 126, 'anchor');
  // right column (2)
  add(830, 150, 146, 150, 'standard');
  add(830, 300, 146, 150, 'standard');
  // bottom-right corner, bottom row right to left (6), bottom-left corner
  add(830, 450, 146, 126, 'anchor');
  for (let i = 0; i < 6; i += 1) add(720 - i * 110, 450, 110, 126, 'standard');
  add(24, 450, 146, 126, 'anchor');
  // left column bottom to top (2)
  add(24, 300, 146, 150, 'standard');
  add(24, 150, 146, 150, 'standard');
  // interior islands (4)
  add(214, 196, 118, 100, 'island');
  add(214, 304, 118, 100, 'island');
  add(668, 196, 118, 100, 'island');
  add(668, 304, 118, 100, 'island');
  return units;
}

const ATRIUM = { x: 384, y: 214, w: 232, h: 172 };

function amenities(floor) {
  const base = [
    { type: 'escalator', label: 'Escalator', x: 500, y: 180 },
    { type: 'escalator', label: 'Escalator', x: 500, y: 420 },
    { type: 'lift', label: 'Lifts', x: 356, y: 300 },
    { type: 'wc', label: 'Restrooms', x: 644, y: 300 },
  ];
  if (floor === 'G') {
    base.push(
      { type: 'entrance', label: 'Main entrance', x: 500, y: 588 },
      { type: 'entrance', label: 'Linking Road gate', x: 36, y: 300 },
      { type: 'info', label: 'Concierge', x: 420, y: 425 },
    );
  }
  if (floor === '2') base.push({ type: 'food', label: 'Food court seating', x: 500, y: 300 });
  if (floor === '3') base.push({ type: 'info', label: 'Customer care', x: 420, y: 425 });
  return base;
}

export const FLOOR_PLANS = Object.fromEntries(
  FLOORS.map((f) => [
    f.id,
    {
      ...f,
      viewBox: `0 0 ${W} ${H}`,
      width: W,
      height: H,
      atrium: ATRIUM,
      units: buildUnits(f.id),
      amenities: amenities(f.id),
    },
  ]),
);

export function getFloorPlan(floorId) {
  return FLOOR_PLANS[floorId] ?? FLOOR_PLANS.G;
}

export function getUnit(unitId) {
  if (!unitId) return null;
  const floor = unitId.split('-')[0];
  return FLOOR_PLANS[floor]?.units.find((u) => u.id === unitId) ?? null;
}

/** Unit ids on a floor that no other shop occupies. `currentShopId` keeps its own unit selectable. */
export function vacantUnits(floorId, shops, currentShopId) {
  const taken = new Set(
    shops.filter((s) => s.id !== currentShopId && s.unitId && s.status !== 'inactive').map((s) => s.unitId),
  );
  return getFloorPlan(floorId).units.filter((u) => !taken.has(u.id));
}

export function unitCentre(unit) {
  return { x: unit.x + unit.w / 2, y: unit.y + unit.h / 2 };
}
