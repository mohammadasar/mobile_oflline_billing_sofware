/**
 * db/queries/products.js
 * Product-related database operations.
 */
import { query, run } from '../index';

export const ProductsDB = {
  getAll: () =>
    query('SELECT * FROM products WHERE is_active = 1 ORDER BY name ASC', []),

  getCount: async () => {
    const rows = await query('SELECT COUNT(*) AS count FROM products WHERE is_active = 1', []);
    return rows[0]?.count ?? 0;
  },

  getById: (id) =>
    query('SELECT * FROM products WHERE id = ?', [id]).then((r) => r[0] ?? null),

  search: (term) =>
    query(
      "SELECT * FROM products WHERE is_active = 1 AND (name LIKE ? OR barcode LIKE ?) ORDER BY name LIMIT 50",
      [`%${term}%`, `%${term}%`]
    ),

  create: (p) =>
    run(
      `INSERT INTO products (name, description, price, tax_rate, unit, barcode, stock)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [p.name, p.description ?? '', p.price, p.tax_rate ?? 0, p.unit ?? 'pcs', p.barcode ?? '', p.stock ?? 0]
    ),

  update: (id, p) =>
    run(
      `UPDATE products SET name=?, description=?, price=?, tax_rate=?, unit=?, barcode=?, stock=?, updated_at=datetime('now')
       WHERE id=?`,
      [p.name, p.description, p.price, p.tax_rate, p.unit, p.barcode, p.stock, id]
    ),

  delete: (id) =>
    run('UPDATE products SET is_active = 0 WHERE id = ?', [id]),
};
