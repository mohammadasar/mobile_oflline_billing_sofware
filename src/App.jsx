/**
 * App.jsx
 * Root application component with routing, DB initialization, and context providers.
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, useCallback, useEffect, useState } from 'react';

import { DbProvider, useDb } from './context/DbContext';
import { LicenseGateContext } from './context/LicenseGateContext';
import { SettingsProvider } from './context/SettingsContext';

import BottomNav from './components/Navigation/BottomNav';
import LicenseActivationPage from './pages/License/LicenseActivationPage';
import { evaluateStoredLicense } from './license/activation';
import { isActivatedLicense } from './native/license';

import BillingPage   from './pages/Billing/BillingPage';
import ProductsPage  from './pages/Products/ProductsPage';
import CustomersPage from './pages/Customers/CustomersPage';
import BillsPage     from './pages/Bills/BillsPage';
import SettingsPage  from './pages/Settings/SettingsPage';
import SecurityPage  from './pages/Security/SecurityPage';
import DashboardPage from './pages/Dashboard/DashboardPage';

// ─── Splash / Loading Screen ──────────────────────────────────
function SplashScreen() {
  return (
    <div className="splash-screen">
      <div className="splash-logo">
        {/* Simple receipt SVG icon */}
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z"/>
          <path d="M16 8H8M16 12H8M12 16H8"/>
        </svg>
      </div>
      <div>
        <div className="splash-title">OfflineBilling</div>
        <div className="splash-subtitle" style={{ marginTop: '0.25rem' }}>
          Retail POS · 100% Offline
        </div>
      </div>
      <div className="spinner" />
    </div>
  );
}

// ─── Error Screen ─────────────────────────────────────────────
function ErrorScreen({ message }) {
  return (
    <div className="error-screen">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <h2 style={{ color: 'var(--text-primary)' }}>Database Error</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>
        {message || 'Failed to initialize the local database.'}
      </p>
      <p style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-xs)', marginTop: '0.5rem' }}>
        Try restarting the app. Your data is safe.
      </p>
    </div>
  );
}

function LicenseGate({ children }) {
  const [checking, setChecking] = useState(true);
  const [licenseState, setLicenseState] = useState(null);

  const refreshLicense = useCallback(async () => {
    const result = await evaluateStoredLicense();
    setLicenseState(result);
    setChecking(false);
    return result;
  }, []);

  useEffect(() => {
    let cancelled = false;

    refreshLicense().catch(() => {
      if (!cancelled) {
        setLicenseState({ status: 'Invalid License', valid: false });
        setChecking(false);
      }
    });

    const recheckIfVisible = () => {
      if (document.visibilityState === 'visible') {
        refreshLicense().catch(() => {});
      }
    };

    // Re-check on app resume without native plugin listeners.
    // Native notifyListeners/addListener can race Capacitor.triggerEvent on Android startup.
    document.addEventListener('visibilitychange', recheckIfVisible);
    window.addEventListener('focus', recheckIfVisible);
    window.addEventListener('pageshow', recheckIfVisible);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', recheckIfVisible);
      window.removeEventListener('focus', recheckIfVisible);
      window.removeEventListener('pageshow', recheckIfVisible);
    };
  }, [refreshLicense]);

  if (checking) return <SplashScreen />;

  const allowed = isActivatedLicense(licenseState);

  return (
    <LicenseGateContext.Provider value={{ refreshLicense, licenseState }}>
      {allowed ? children : (
        <div className="app-layout">
          <LicenseActivationPage
            status={licenseState?.status}
            onActivated={refreshLicense}
          />
        </div>
      )}
    </LicenseGateContext.Provider>
  );
}

// ─── App Shell (rendered after DB is ready) ───────────────────
function AppShell() {
  const { ready, error } = useDb();

  if (error) return <ErrorScreen message={error} />;
  if (!ready) return <SplashScreen />;

  return (
    <LicenseGate>
      <SettingsProvider>
        <div className="app-layout">
          <Routes>
            <Route path="/"           element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"  element={<DashboardPage />} />
            <Route path="/billing"    element={<BillingPage />} />
            <Route path="/products"   element={<ProductsPage />} />
            <Route path="/customers"  element={<CustomersPage />} />
            <Route path="/bills"      element={<BillsPage />} />
            <Route path="/settings"   element={<SettingsPage />} />
            <Route path="/security"   element={<SecurityPage />} />
            {/* Catch-all */}
            <Route path="*"           element={<Navigate to="/dashboard" replace />} />
          </Routes>

          <BottomNav />
        </div>
      </SettingsProvider>
    </LicenseGate>
  );
}

// ─── Root App ─────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <DbProvider>
        <Suspense fallback={<SplashScreen />}>
          <AppShell />
        </Suspense>
      </DbProvider>
    </BrowserRouter>
  );
}
