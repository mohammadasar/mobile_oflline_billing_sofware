import { createContext, useContext } from 'react';

export const LicenseGateContext = createContext({
  refreshLicense: async () => {},
  licenseState: null,
});

export const useLicenseGate = () => useContext(LicenseGateContext);
