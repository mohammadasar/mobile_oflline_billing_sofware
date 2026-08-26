/**
 * db/queries/customers.js
 */
import { query, run } from '../index';

export const CustomersDB = {
  getAll: () =>
    query('SELECT * FROM customers WHERE is_active = 1 ORDER BY name ASC', []),

  getById: (id) =>
    query('SELECT * FROM customers WHERE id = ?', [id]).then((r) => r[0] ?? null),

  search: (term) =>
    query(
      'SELECT * FROM customers WHERE is_active = 1 AND (name LIKE ? OR phone LIKE ?) ORDER BY name LIMIT 30',
      [`%${term}%`, `%${term}%`]
    ),

  create: (c) =>
    run(
      'INSERT INTO customers (name, phone, email, address, notes) VALUES (?, ?, ?, ?, ?)',
      [c.name, c.phone ?? '', c.email ?? '', c.address ?? '', c.notes ?? '']
    ),

  update: (id, c) =>
    run(
      `UPDATE customers SET name=?, phone=?, email=?, address=?, notes=?, updated_at=datetime('now') WHERE id=?`,
      [c.name, c.phone, c.email, c.address, c.notes, id]
    ),

  delete: (id) =>
    run("UPDATE customers SET is_active = 0, updated_at = datetime('now') WHERE id = ?", [id]),
};
