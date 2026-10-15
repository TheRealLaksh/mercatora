import { CATEGORIES } from '../../lib/constants.js';
import { getFloorPlan } from '../../lib/floorPlans.js';

const hueOf = (category) => CATEGORIES.find((c) => c.id === category)?.hue ?? 40;

export function tint(category) {
  return `color-mix(in oklab, hsl(${hueOf(category)} 55% 50%) 30%, var(--surface))`;
}

/** Splits a name into at most two lines that fit a unit of the given pixel width. */
function wrap(name, width) {
  const max = Math.max(6, Math.floor(width / 7.2));
  if (name.length <= max) return [name];
  const words = name.split(' ');
  const lines = [''];
  for (const w of words) {
    const last = lines[lines.length - 1];
    if ((last + ' ' + w).trim().length <= max) lines[lines.length - 1] = (last + ' ' + w).trim();
    else lines.push(w);
  }
  const out = lines.slice(0, 2);
  if (lines.length > 2 || out.some((l) => l.length > max)) {
    out[out.length - 1] = out[out.length - 1].slice(0, max - 1) + '…';
  }
  return out;
}

const AMENITY_TEXT = { escalator: 'ESC', lift: 'LIFT', wc: 'WC', entrance: 'ENTRY', info: 'INFO', food: 'FOOD COURT' };

export default function FloorMap({ floorId, shops, selectedId, highlightId, onSelect }) {
  const plan = getFloorPlan(floorId);
  const byUnit = Object.fromEntries(shops.filter((s) => s.floor === floorId).map((s) => [s.unitId, s]));
  const a = plan.atrium;

  return (
    <svg
      viewBox={plan.viewBox}
      className="h-auto w-full select-none"
      role="group"
      aria-label={`Floor plan of the ${plan.name}`}
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      <defs>
        <pattern id="hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="10" stroke="var(--line-strong)" strokeWidth="2" />
        </pattern>
      </defs>

      <rect x="4" y="4" width="992" height="592" rx="26" fill="var(--sunken)" stroke="var(--line-strong)" strokeWidth="2" />
      {/* corridor */}
      <rect x="170" y="150" width="660" height="300" fill="var(--paper)" opacity="0.7" />

      {/* atrium void */}
      <rect x={a.x} y={a.y} width={a.w} height={a.h} rx="18" fill="url(#hatch)" stroke="var(--line-strong)" strokeWidth="1.5" strokeDasharray="6 5" opacity="0.9" />
      <text x={a.x + a.w / 2} y={a.y + a.h / 2 - 4} textAnchor="middle" fontSize="22" fill="var(--muted)" style={{ fontFamily: 'var(--font-display)' }}>
        Atrium
      </text>
      <text x={a.x + a.w / 2} y={a.y + a.h / 2 + 18} textAnchor="middle" fontSize="10" letterSpacing="2" fill="var(--muted)">
        OPEN TO ABOVE
      </text>

      {/* units */}
      {plan.units.map((u) => {
        const shop = byUnit[u.id];
        const selected = shop && shop.id === selectedId;
        const lines = shop ? wrap(shop.name, u.w) : [];
        const cx = u.x + u.w / 2;
        const cy = u.y + u.h / 2;
        const activate = () => shop && onSelect?.(shop);
        return (
          <g
            key={u.id}
            className={shop ? 'map-unit' : undefined}
            role={shop ? 'button' : 'img'}
            tabIndex={shop ? 0 : undefined}
            aria-label={shop ? `${shop.name}, ${shop.category}, unit ${u.id}` : `Unit ${u.id}, available to lease`}
            aria-pressed={shop ? Boolean(selected) : undefined}
            onClick={activate}
            onKeyDown={(e) => {
              if (shop && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                activate();
              }
            }}
          >
            <rect
              x={u.x + 3}
              y={u.y + 3}
              width={u.w - 6}
              height={u.h - 6}
              rx="9"
              style={{ fill: shop ? tint(shop.category) : 'var(--paper)' }}
              stroke={selected ? 'var(--brass)' : shop ? 'var(--line-strong)' : 'var(--line-strong)'}
              strokeWidth={selected ? 3.5 : 1.25}
              strokeDasharray={shop ? undefined : '5 4'}
            />
            {shop ? (
              <>
                <text x={cx} y={cy - (lines.length - 1) * 7 + 2} textAnchor="middle" fontSize="12.5" fontWeight="600" fill="var(--ink)">
                  {lines.map((l, i) => (
                    <tspan key={l} x={cx} dy={i === 0 ? 0 : 15}>
                      {l}
                    </tspan>
                  ))}
                </text>
                <text x={cx} y={u.y + u.h - 12} textAnchor="middle" fontSize="9.5" letterSpacing="1" fill="var(--muted)">
                  {u.id}
                </text>
              </>
            ) : (
              <>
                <text x={cx} y={cy} textAnchor="middle" fontSize="10.5" fill="var(--muted)">
                  Available
                </text>
                <text x={cx} y={cy + 14} textAnchor="middle" fontSize="9" letterSpacing="1" fill="var(--muted)">
                  {u.id}
                </text>
              </>
            )}
            {shop && shop.id === highlightId && (
              <circle cx={u.x + u.w - 16} cy={u.y + 16} r="7" fill="var(--brass-fill)">
                <title>You are looking for this store</title>
              </circle>
            )}
            {shop && shop.id === highlightId && <circle className="map-pulse" cx={u.x + u.w - 16} cy={u.y + 16} r="7" fill="var(--brass-fill)" opacity="0.6" />}
          </g>
        );
      })}

      {/* amenities */}
      {plan.amenities.map((m) => (
        <g key={`${m.type}-${m.x}-${m.y}`} aria-label={m.label} role="img">
          <rect x={m.x - (m.type === 'food' ? 52 : 24)} y={m.y - 11} width={m.type === 'food' ? 104 : 48} height="22" rx="11" fill="var(--ink)" opacity="0.9" />
          <text x={m.x} y={m.y + 3.5} textAnchor="middle" fontSize="9" fontWeight="700" letterSpacing="1.2" fill="var(--paper)">
            {AMENITY_TEXT[m.type]}
          </text>
        </g>
      ))}
    </svg>
  );
}
