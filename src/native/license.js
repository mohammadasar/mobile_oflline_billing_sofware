import { Capacitor, registerPlugin } from '@capacitor/core';

const LicensePlugin = registerPlugin('License');

export async function getDeviceIdentity() {
  if (Capacitor.getPlatform() !== 'android') {
    return { available: false, deviceId: '', publicKey: '' };
  }
  return LicensePlugin.getDeviceIdentity();
}

export async function verifyLicense(licenseKey) {
  if (Capacitor.getPlatform() !== 'android') {
    return {
      status: 'Not Activated',
      valid: false,
      licenseId: '',
      shopName: '',
      expiresAt: '',
      licenseType: '',
    };
  }

  return LicensePlugin.verifyLicense({ licenseKey: licenseKey || '' });
}
