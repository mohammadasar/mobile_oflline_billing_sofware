/**
 * db/queries/bills.js
 */
import { query, run } from '../index';

export const BillsDB = {
  getAll: () =>
    query(
      `SELECT b.*, c.name AS customer_name_ref
       FROM bills b LEFT JOIN customers c ON b.customer_id = c.id
       ORDER BY b.created_at DESC`,
      []
    ),

  getById: (id) =>
    query('SELECT * FROM bills WHERE id = ?', [id]).then((r) => r[0] ?? null),

  getItemsForBill: (billId) =>
    query('SELECT * FROM bill_items WHERE bill_id = ?', [billId]),

  getNextBillNumber: async () => {
    const rows = await query("SELECT value FROM settings WHERE key = 'next_bill_number'", []);
    const prefix_rows = await query("SELECT value FROM settings WHERE key = 'bill_prefix'", []);
    const num = parseInt(rows[0]?.value ?? '1', 10);
    const prefix = prefix_rows[0]?.value ?? 'INV';
    return `${prefix}-${String(num).padStart(4, '0')}`;
  },

  create: async (bill, items) => {
    // Insert bill
    const { lastId } = await run(
      `INSERT INTO bills (bill_number, customer_id, customer_name, subtotal, tax_total, discount, grand_total, payment_mode, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [bill.bill_number, bill.customer_id, bill.customer_name, bill.subtotal,
       bill.tax_total, bill.discount, bill.grand_total, bill.payment_mode, 'paid', bill.notes ?? '']
    );

    // Insert items
    for (const item of items) {
      await run(
        `INSERT INTO bill_items (bill_id, product_id, product_name, qty, unit_price, tax_rate, tax_amount, line_total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [lastId, item.product_id, item.product_name, item.qty,
         item.unit_price, item.tax_rate, item.tax_amount, item.line_total]
      );
    }

    // Increment next bill number
    await run(
      "UPDATE settings SET value = CAST(CAST(value AS INTEGER) + 1 AS TEXT) WHERE key = 'next_bill_number'",
      []
    );

    return lastId;
  },

  getTodayTotal: async () => {
    const rows = await query(
      "SELECT COALESCE(SUM(grand_total), 0) AS total FROM bills WHERE date(created_at) = date('now')",
      []
    );
    return rows[0]?.total ?? 0;
  },

  getTodayCount: async () => {
    const rows = await query(
      "SELECT COUNT(*) AS count FROM bills WHERE date(created_at) = date('now')",
      []
    );
    return rows[0]?.count ?? 0;
  },

  getMonthlyTotal: async () => {
    const rows = await query(
      "SELECT COALESCE(SUM(grand_total), 0) AS total FROM bills WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')",
      []
    );
    return rows[0]?.total ?? 0;
  },
};
