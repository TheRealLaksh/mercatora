import { useState } from 'react';
import { CATEGORY_IDS } from '../../lib/constants.js';
import { initials } from '../../lib/format.js';

// Generated artwork keeps the product looking finished before any photography exists.
// Palettes are [background, foreground, accent]. They are decorative, so they do not follow the theme.
const PALETTES = [
  ['#E9DCC3', '#2F4A3A', '#C9954A'],
  ['#2F4A3A', '#EADFC8', '#D9A441'],
  ['#1F2A44', '#E8D9BC', '#C9954A'],
  ['#A3402A', '#F4E5D3', '#16130E'],
  ['#4F3345', '#F1E3D3', '#D9A441'],
  ['#D8C7A8', '#16130E', '#A3402A'],
  ['#C9954A', '#16130E', '#F6F1E8'],
  ['#35544F', '#EFE6D2', '#E0B067'],
];

const PATTERNS = ['arches', 'circles', 'grid', 'sun', 'blocks', 'stripes', 'waves', 'rings'];

function hash(str = '') {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick(seed, category) {
  const h = hash(seed);
  const catIndex = Math.max(0, CATEGORY_IDS.indexOf(category));
  const h2 = hash(`${seed}|${catIndex}`);
  return { palette: PALETTES[h % PALETTES.length], pattern: PATTERNS[(h2 >>> 9) % PATTERNS.length], h };
}

function Pattern({ type, fg, accent }) {
  switch (type) {
    case 'arches':
      return (
        <g>
          {[0, 1, 2, 3, 4].map((i) => (
            <path key={i} d={`M${20 + i * 80} 300V190a40 40 0 0 1 80 0V300z`} fill={i % 2 ? accent : fg} opacity={i % 2 ? 0.9 : 0.16} />
          ))}
        </g>
      );
    case 'circles':
      return (
        <g>
          <circle cx="110" cy="130" r="95" fill={fg} opacity="0.14" />
          <circle cx="230" cy="170" r="95" fill={accent} opacity="0.8" />
          <circle cx="330" cy="90" r="55" fill={fg} opacity="0.2" />
        </g>
      );
    case 'grid':
      return (
        <g fill={fg}>
          {Array.from({ length: 6 }).flatMap((_, r) =>
            Array.from({ length: 10 }).map((__, c) => (
              <circle key={`${r}-${c}`} cx={20 + c * 40} cy={24 + r * 48} r={(r + c) % 5 === 0 ? 7 : 3} opacity={(r + c) % 5 === 0 ? 0.95 : 0.22} fill={(r + c) % 5 === 0 ? accent : fg} />
            )),
          )}
        </g>
      );
    case 'sun':
      return (
        <g>
          <circle cx="200" cy="300" r="190" fill={fg} opacity="0.12" />
          <circle cx="200" cy="300" r="140" fill={fg} opacity="0.14" />
          <circle cx="200" cy="300" r="90" fill={accent} opacity="0.95" />
        </g>
      );
    case 'blocks':
      return (
        <g>
          <rect x="30" y="150" width="120" height="150" fill={fg} opacity="0.16" />
          <rect x="130" y="70" width="110" height="230" fill={accent} opacity="0.92" />
          <rect x="230" y="190" width="140" height="110" fill={fg} opacity="0.22" />
        </g>
      );
    case 'stripes':
      return (
        <g stroke={fg} strokeWidth="14" opacity="0.18">
          {Array.from({ length: 14 }).map((_, i) => (
            <line key={i} x1={-60 + i * 48} y1="320" x2={60 + i * 48} y2="-20" />
          ))}
          <line x1="150" y1="320" x2="270" y2="-20" stroke={accent} strokeWidth="26" opacity="1" />
        </g>
      );
    case 'waves':
      return (
        <g fill="none" strokeWidth="10" strokeLinecap="round">
          {[0, 1, 2, 3].map((i) => (
            <path
              key={i}
              d={`M-10 ${150 + i * 38} Q 50 ${110 + i * 38}, 100 ${150 + i * 38} T 210 ${150 + i * 38} T 320 ${150 + i * 38} T 430 ${150 + i * 38}`}
              stroke={i === 1 ? accent : fg}
              opacity={i === 1 ? 1 : 0.2}
            />
          ))}
        </g>
      );
    case 'rings':
    default:
      return (
        <g fill="none" stroke={fg}>
          {[40, 80, 120, 160].map((r, i) => (
            <circle key={r} cx="300" cy="90" r={r} strokeWidth="8" opacity={0.12 + i * 0.03} />
          ))}
          <circle cx="300" cy="90" r="22" fill={accent} stroke="none" />
        </g>
      );
  }
}

/** Wide generated cover. Fills its container. */
export function ArtCover({ seed, category, label, className = '' }) {
  const { palette } = pick(seed, category);
  const [bg, fg, accent] = palette;
  const { pattern } = pick(seed, category);
  return (
    <svg
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      className={`block h-full w-full ${className}`}
      role="img"
      aria-label={label ? `${label} artwork` : 'Decorative artwork'}
    >
      <rect width="400" height="300" fill={bg} />
      <Pattern type={pattern} fg={fg} accent={accent} />
    </svg>
  );
}

/** Square monogram tile. */
export function Monogram({ name, seed, category, className = '', rounded = 'rounded-2xl' }) {
  const { palette } = pick(seed ?? name, category);
  const [bg, fg, accent] = palette;
  return (
    <span
      className={`relative inline-grid shrink-0 place-items-center overflow-hidden ${rounded} ${className}`}
      style={{ background: bg, color: fg }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <circle cx="86" cy="14" r="22" fill={accent} opacity="0.9" />
        <circle cx="10" cy="96" r="30" fill={fg} opacity="0.12" />
      </svg>
      <span className="display relative text-[1.15em] leading-none">{initials(name)}</span>
    </span>
  );
}

/** Image with graceful fallback to generated art. */
export function SmartImage({ src, alt, fallback, className = '', ...rest }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return fallback;
  return <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} className={className} {...rest} />;
}

export function ShopCover({ shop, className = '' }) {
  return (
    <SmartImage
      src={shop.coverUrl}
      alt=""
      className={`h-full w-full object-cover ${className}`}
      fallback={<ArtCover seed={shop.id + shop.name} category={shop.category} label={shop.name} className={className} />}
    />
  );
}

export function ShopLogo({ shop, className = 'size-12 text-lg', rounded }) {
  return (
    <SmartImage
      src={shop.logoUrl}
      alt={`${shop.name} logo`}
      className={`shrink-0 object-cover ${rounded ?? 'rounded-2xl'} ${className}`}
      fallback={<Monogram name={shop.name} seed={shop.id + shop.name} category={shop.category} className={className} rounded={rounded} />}
    />
  );
}

export function ProductImage({ product, shopCategory, className = '' }) {
  return (
    <SmartImage
      src={product.imageUrl}
      alt={product.name}
      className={`h-full w-full object-cover ${className}`}
      fallback={<ArtCover seed={product.id + product.name} category={shopCategory ?? product.category} label={product.name} className={className} />}
    />
  );
}
