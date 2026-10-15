import { createContext, useContext, useMemo } from 'react';
import { DEFAULT_SETTINGS } from '../lib/constants.js';
import { useDocument } from '../hooks/useFirestore.js';
import { settingsRef } from '../services/settings.js';
import { getOpenStatus } from '../lib/hours.js';

const SettingsContext = createContext({ settings: DEFAULT_SETTINGS, loading: true });

export function SettingsProvider({ children }) {
  const { data, loading } = useDocument(() => settingsRef(), []);
  const value = useMemo(() => {
    const settings = { ...DEFAULT_SETTINGS, ...(data ?? {}), parking: { ...DEFAULT_SETTINGS.parking, ...(data?.parking ?? {}) } };
    return { settings, loading, mallStatus: () => getOpenStatus(settings.hours, new Date(), settings.timezone) };
  }, [data, loading]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
