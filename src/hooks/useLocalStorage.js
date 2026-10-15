import { useCallback, useState } from 'react';

/** localStorage that never throws (private mode, quota, blocked storage). */
export function readStorage(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => readStorage(key, initial));
  const set = useCallback(
    (next) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? next(prev) : next;
        writeStorage(key, resolved);
        return resolved;
      });
    },
    [key],
  );
  return [value, set];
}
