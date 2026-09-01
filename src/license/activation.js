import { LICENSE_STATUS, SettingsDB } from '../db/queries/settings';
import { getDeviceIdentity, getLicenseState, isActivatedLicense } from '../native/license';

export async function evaluateStoredLicense() {
  const storedKey = (await SettingsDB.get('license_key')) ?? '';
  return getLicenseState(storedKey);
}

export async function activateLicense(licenseKey) {
  const normalizedLicense = (licenseKey || '').trim();
  const verification = await getLicenseState(normalizedLicense);

  if (!isActivatedLicense(verification)) {
    return {
      ok: false,
      verification,
      error: verification?.status || LICENSE_STATUS.INVALID,
    };
  }

  const identity = await getDeviceIdentity();
  await SettingsDB.setLicenseMetadata({
    key: normalizedLicense,
    status: verification.status,
    deviceId: identity.deviceId || verification.deviceId || '',
    expiresAt: verification.expiresAt ?? '',
    licenseType: verification.licenseType || '',
    licenseId: verification.licenseId || '',
  });

  return { ok: true, verification };
}
