/**
 * db/queries/settings.js
 */
import { query, run } from '../index';

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
