/**
 * context/DbContext.jsx
 * Provides DB initialization state to the whole app.
 */
import { createContext, useContext, useEffect, useState } from 'react';
import { initDb } from '../db/index';

const DbContext = createContext({ ready: false, error: null });

export function DbProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    initDb()
      .then(() => setReady(true))
      .catch((err) => {
        console.error('[DbProvider] init error:', err);
        setError(err.message ?? 'Database initialization failed');
      });
  }, []);

  return (
    <DbContext.Provider value={{ ready, error }}>
      {children}
    </DbContext.Provider>
  );
}

export const useDb = () => useContext(DbContext);
