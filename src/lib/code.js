// Pickup codes avoid look-alike characters (0/O, 1/I/L).
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function pickupCode(length = 6) {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}

export function normaliseCode(input = '') {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '');
}
