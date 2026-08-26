/**
 * db/index.js
 * Singleton SQLite connection manager for the OfflineBilling app.
 *
 * - On Android/iOS: uses native SQLite via @capacitor-community/sqlite
 * - On Web (dev):   uses jeep-sqlite (IndexedDB-backed, WASM-free)
 *
 * Usage:
 *   import { getDb } from './db';
 *   const db = await getDb();
 *   const result = await db.query('SELECT * FROM products', []);
 */

import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { MIGRATIONS, DB_NAME } from './migrations';

// ─── State ──────────────────────────────────────────────────────────────────

let _sqlite = null;      // SQLiteConnection instance
let _db = null;          // Active SQLiteDBConnection
let _initialized = false;

// ─── Platform Detection ─────────────────────────────────────────────────────

const platform = Capacitor.getPlatform(); // 'android' | 'ios' | 'web'

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Run all migration statements in order (idempotent — uses IF NOT EXISTS).
 */
async function runMigrations(db) {
  for (const sql of MIGRATIONS) {
    await db.run(sql, []);
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Initialize the SQLite connection and run migrations.
 * Must be called once at app startup (e.g., in main.jsx before React renders).
 * Safe to call multiple times — subsequent calls are no-ops.
 */
export async function initDb() {
  if (_initialized) return;

  try {
    _sqlite = new SQLiteConnection(CapacitorSQLite);

    // Web platform requires jeep-sqlite to be initialized first
    if (platform === 'web') {
      const jeepSqliteEl = document.querySelector('jeep-sqlite');
      if (jeepSqliteEl != null) {
        await customElements.whenDefined('jeep-sqlite');
        await CapacitorSQLite.initWebStore();
      } else {
        console.warn('[DB] jeep-sqlite element not found in DOM — web storage may not work');
      }
    }

    // Open the database (create if not exists)
    const ret = await _sqlite.checkConnectionsConsistency();
    const isConn = (await _sqlite.isConnection(DB_NAME, false)).result;

    if (ret.result && isConn) {
      _db = await _sqlite.retrieveConnection(DB_NAME, false);
    } else {
      _db = await _sqlite.createConnection(
        DB_NAME,
        false,     // encrypted
        'no-encryption',
        1,         // version
        false      // readonly
      );
    }

    await _db.open();
    await runMigrations(_db);
    const customerColumns = await _db.query('PRAGMA table_info(customers)', []);
    if (!customerColumns.values?.some((column) => column.name === 'is_active')) {
      await _db.run('ALTER TABLE customers ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1', []);
    }

    _initialized = true;
    console.log('[DB] Initialized successfully on platform:', platform);
  } catch (err) {
    console.error('[DB] Initialization failed:', err);
    throw err;
  }
}

/**
 * Returns the active DB connection.
 * Throws if initDb() has not been called successfully.
 */
export function getDb() {
  if (!_db || !_initialized) {
    throw new Error('[DB] Database not initialized. Call initDb() first.');
  }
  return _db;
}

/**
 * Convenience: execute a SELECT and return rows array.
 * @param {string} sql - SQL with ? placeholders
 * @param {any[]}  params
 * @returns {Promise<any[]>}
 */
export async function query(sql, params = []) {
  const db = getDb();
  const result = await db.query(sql, params);
  return result.values ?? [];
}

/**
 * Convenience: execute INSERT / UPDATE / DELETE.
 * @returns {Promise<{changes: number, lastId: number}>}
 */
export async function run(sql, params = []) {
  const db = getDb();
  const result = await db.run(sql, params);
  return {
    changes: result.changes?.changes ?? 0,
    lastId:  result.changes?.lastId  ?? -1,
  };
}

export async function exportDb() {
  return getDb().exportToJson('full', false);
}

export async function importDb(json) {
  return getDb().importFromJson(JSON.stringify(json));
}

/**
 * Cleanup — close the connection gracefully (call on app suspend/exit).
 */
export async function closeDb() {
  if (_db) {
    await _sqlite.closeConnection(DB_NAME, false);
    _db = null;
    _initialized = false;
  }
}
