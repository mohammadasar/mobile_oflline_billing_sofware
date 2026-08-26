/**
 * migrations.js
 * All SQLite table DDL statements for the OfflineBilling app.
 * Run these in order on first launch (or app upgrade).
 */

export const DB_NAME = 'offline_billing_db';
export const DB_VERSION = 1;

/**
 * Returns the array of SQL statements to run for initial DB setup.
 * Each statement is independent; run them sequentially.
 */
export const MIGRATIONS = [
  // ─── Settings ──────────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY NOT NULL,
    value TEXT
  );`,

  // ─── Security (PIN hash) ───────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS security (
    id         INTEGER PRIMARY KEY CHECK (id = 1),
    pin_hash   TEXT,
    is_enabled INTEGER NOT NULL DEFAULT 0
  );`,

  // ─── Products ──────────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS products (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    description TEXT,
    price       REAL    NOT NULL DEFAULT 0,
    tax_rate    REAL    NOT NULL DEFAULT 0,
    unit        TEXT    NOT NULL DEFAULT 'pcs',
    barcode     TEXT,
    stock       INTEGER NOT NULL DEFAULT 0,
    is_active   INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );`,

  // ─── Customers ─────────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS customers (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    phone      TEXT,
    email      TEXT,
    address    TEXT,
    notes      TEXT,
    is_active   INTEGER NOT NULL DEFAULT 1,
    created_at TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );`,
  // ─── Bills ─────────────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS bills (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    bill_number   TEXT    NOT NULL UNIQUE,
    customer_id   INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    customer_name TEXT,
    subtotal      REAL    NOT NULL DEFAULT 0,
    tax_total     REAL    NOT NULL DEFAULT 0,
    discount      REAL    NOT NULL DEFAULT 0,
    grand_total   REAL    NOT NULL DEFAULT 0,
    payment_mode  TEXT    NOT NULL DEFAULT 'cash',
    status        TEXT    NOT NULL DEFAULT 'paid',
    notes         TEXT,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  );`,

  // ─── Bill Items ────────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS bill_items (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    bill_id     INTEGER NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    product_id  INTEGER REFERENCES products(id) ON DELETE SET NULL,
    product_name TEXT   NOT NULL,
    qty         REAL    NOT NULL DEFAULT 1,
    unit_price  REAL    NOT NULL DEFAULT 0,
    tax_rate    REAL    NOT NULL DEFAULT 0,
    tax_amount  REAL    NOT NULL DEFAULT 0,
    line_total  REAL    NOT NULL DEFAULT 0
  );`,

  // ─── Indexes ───────────────────────────────────────────────────────────────
  `CREATE INDEX IF NOT EXISTS idx_bills_created_at  ON bills(created_at);`,
  `CREATE INDEX IF NOT EXISTS idx_bill_items_bill   ON bill_items(bill_id);`,
  `CREATE INDEX IF NOT EXISTS idx_products_name     ON products(name);`,
  `CREATE INDEX IF NOT EXISTS idx_customers_phone   ON customers(phone);`,

  // ─── Default settings seed ─────────────────────────────────────────────────
  `INSERT OR IGNORE INTO settings (key, value) VALUES
    ('shop_name',        'My Shop'),
    ('shop_address',     ''),
    ('shop_phone',       ''),
    ('currency_symbol',  '₹'),
    ('tax_label',        'GST'),
    ('bill_prefix',      'INV'),
    ('next_bill_number', '1'),
    ('theme',            'dark');`,
];
