/**
 * db/queries/settings.js
 */
import { query, run } from '../index';

export const LICENSE_STATUS = {
  NOT_ACTIVATED: 'Not Activated',
  ACTIVATED: 'Activated',
  INVALID: 'Invalid License',
  WRONG_DEVICE: 'License belongs to another device',
  EXPIRED: 'Expired License',
};

export const SettingsDB = {
  getAll: async () => {
    const rows = await query('SELECT key, value FROM settings', []);
    // Convert array of {key,value} to a flat object
    return rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
  },

  get: (key) =>
    query("SELECT value FROM settings WHERE key = ?", [key]).then((r) => r[0]?.value ?? null),

  set: (key, value) =>
    run(
      "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
      [key, String(value)]
    ),

  setMany: async (obj) => {
    for (const [key, value] of Object.entries(obj)) {
      await run(
        "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
        [key, String(value)]
      );
    }
  },

  getLicenseMetadata: async () => {
    const settings = await SettingsDB.getAll();
    return {
      key: settings.license_key ?? '',
      status: settings.license_status ?? LICENSE_STATUS.NOT_ACTIVATED,
      deviceId: settings.license_device_id ?? '',
      expiresAt: settings.license_expires_at ?? '',
      licenseType: settings.license_type ?? '',
      licenseId: settings.license_id ?? '',
    };
  },

  setLicenseMetadata: (metadata) =>
    SettingsDB.setMany({
      license_key: metadata.key ?? '',
      license_status: metadata.status ?? LICENSE_STATUS.NOT_ACTIVATED,
      license_device_id: metadata.deviceId ?? '',
      license_expires_at: metadata.expiresAt ?? '',
      license_type: metadata.licenseType ?? '',
      license_id: metadata.licenseId ?? '',
    }),
};

export const SecurityDB = {
  get: () =>
    query('SELECT * FROM security WHERE id = 1', []).then((r) => r[0] ?? null),

  setPinHash: (hash) =>
    run(
      'INSERT OR REPLACE INTO security (id, pin_hash, is_enabled) VALUES (1, ?, 1)',
      [hash]
    ),

  disablePin: () =>
    run('UPDATE security SET is_enabled = 0, pin_hash = NULL WHERE id = 1', []),
};
