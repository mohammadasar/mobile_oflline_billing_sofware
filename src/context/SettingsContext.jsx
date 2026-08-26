/**
 * context/SettingsContext.jsx
 * Provides app settings (shop name, currency, etc.) globally.
 */
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { SettingsDB } from '../db/queries/settings';
import { useDb } from './DbContext';

const defaultSettings = {
  shop_name: 'My Shop',
  shop_address: '',
  shop_phone: '',
  currency_symbol: '₹',
  tax_label: 'GST',
  bill_prefix: 'INV',
  theme: 'dark',
};

const SettingsContext = createContext({
  settings: defaultSettings,
  refreshSettings: async () => {},
  updateSettings: async () => {},
});

export function SettingsProvider({ children }) {
  const { ready } = useDb();
  const [settings, setSettings] = useState(defaultSettings);

  const refreshSettings = useCallback(async () => {
    if (!ready) return;
    try {
      const all = await SettingsDB.getAll();
      setSettings((prev) => ({ ...prev, ...all }));
    } catch (err) {
      console.error('[Settings] Failed to load:', err);
    }
  }, [ready]);

  const updateSettings = useCallback(async (changes) => {
    await SettingsDB.setMany(changes);
    setSettings((prev) => ({ ...prev, ...changes }));
  }, []);

  useEffect(() => {
    if (ready) refreshSettings();
  }, [ready, refreshSettings]);

  return (
    <SettingsContext.Provider value={{ settings, refreshSettings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
