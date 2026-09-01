import { Capacitor, registerPlugin } from '@capacitor/core';

const LicensePlugin = registerPlugin('License');

export const INACTIVE_LICENSE_STATE = {
  status: 'Not Activated',
  valid: false,
  licenseId: '',
  shopName: '',
  expiresAt: '',
  licenseType: '',
  deviceId: '',
};

export function isActivatedLicense(result) {
  return Boolean(result?.valid) && result?.status === 'Activated';
}

export async function getDeviceIdentity() {
  if (Capacitor.getPlatform() !== 'android') {
    return { available: false, deviceId: '', publicKey: '' };
  }
  return LicensePlugin.getDeviceIdentity();
}

export async function getLicenseState(licenseKey) {
  if (Capacitor.getPlatform() !== 'android') {
    return { ...INACTIVE_LICENSE_STATE };
  }

  return LicensePlugin.getLicenseState({ licenseKey: licenseKey || '' });
}

export async function verifyLicense(licenseKey) {
  return getLicenseState(licenseKey);
}
