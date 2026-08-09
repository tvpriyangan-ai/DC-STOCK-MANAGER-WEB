// dbFunctions.js
// Direct equivalent of your Tkinter app's database_functions.py
// Same queries, same table/column names, just written as async JS instead
// of Python + mysql.connector.

const bcrypt = require("bcryptjs");
const pool = require("./db");

const DatabaseFunctions = {
  // ==========================
  // PRODUCTS
  // ==========================

  async getAllProducts() {
    const [rows] = await pool.query(`
      SELECT id, category, product_name, \`condition\`, price,
             stock_count, created_by, image_path
      FROM product
      ORDER BY category, product_name
    `);
    return rows;
  },

  async getProductsByCategory(category) {
    const [rows] = await pool.query(
      `
      SELECT id, category, product_name, \`condition\`, price,
             stock_count, created_by, image_path
      FROM product
      WHERE category = ?
      ORDER BY product_name
    `,
      [category]
    );
    return rows;
  },

  async searchProducts(keyword) {
    const like = `%${keyword}%`;
    const [rows] = await pool.query(
      `
      SELECT id, category, product_name, \`condition\`, price,
             stock_count, created_by, image_path
      FROM product
      WHERE category LIKE ? OR product_name LIKE ?
      ORDER BY category, product_name
    `,
      [like, like]
    );
    return rows;
  },

  async getProductById(id) {
    const [rows] = await pool.query(`SELECT * FROM product WHERE id = ?`, [
      id,
    ]);
    return rows[0] || null;
  },

  async addProduct({
    category,
    product_name,
    condition,
    price,
    stock_count,
    created_by,
    image_path = "",
  }) {
    const [result] = await pool.query(
      `
      INSERT INTO product
        (category, product_name, \`condition\`, price, stock_count, created_by, image_path)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      [category, product_name, condition, price, stock_count, created_by, image_path]
    );
    return result.insertId;
  },

  async updateProduct(
    id,
    { category, product_name, condition, price, stock_count, created_by, image_path = "" }
  ) {
    const [result] = await pool.query(
      `
      UPDATE product
      SET category=?, product_name=?, \`condition\`=?, price=?,
          stock_count=?, created_by=?, image_path=?
      WHERE id=?
    `,
      [category, product_name, condition, price, stock_count, created_by, image_path, id]
    );
    return result.affectedRows;
  },

  async updateStock(id, stock) {
    await pool.query(`UPDATE product SET stock_count=? WHERE id=?`, [stock, id]);
  },

  async deleteProduct(id) {
    const [result] = await pool.query(`DELETE FROM product WHERE id=?`, [id]);
    return result.affectedRows;
  },

  async getOutOfStockProducts() {
    const [rows] = await pool.query(`
      SELECT id, category, product_name, \`condition\`, price,
             stock_count, created_by, image_path
      FROM product
      WHERE stock_count = 0
      ORDER BY product_name
    `);
    return rows;
  },

  async getDashboardCounts() {
    const [[{ total_products }]] = await pool.query(
      `SELECT COUNT(*) AS total_products FROM product`
    );
    const [[{ total_stock }]] = await pool.query(
      `SELECT IFNULL(SUM(stock_count),0) AS total_stock FROM product`
    );
    const [[{ low_stock }]] = await pool.query(
      `SELECT COUNT(*) AS low_stock FROM product WHERE stock_count <= 5 AND stock_count > 0`
    );
    const [[{ out_of_stock }]] = await pool.query(
      `SELECT COUNT(*) AS out_of_stock FROM product WHERE stock_count = 0`
    );
    return { total_products, total_stock, low_stock, out_of_stock };
  },

  // ==========================
  // USERS
  // ==========================

  async getAllUsers() {
    const [rows] = await pool.query(`
      SELECT id, full_name, username, role, status
      FROM users
      ORDER BY id
    `);
    return rows;
  },

  async getUserById(id) {
    const [rows] = await pool.query(`SELECT * FROM users WHERE id=?`, [id]);
    return rows[0] || null;
  },

  async getUserByUsername(username) {
    const [rows] = await pool.query(
      `SELECT id, full_name, username, role, status FROM users WHERE username=?`,
      [username]
    );
    return rows[0] || null;
  },

  async addUser({ full_name, username, password, role, status }) {
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `
      INSERT INTO users (full_name, username, password, role, status)
      VALUES (?, ?, ?, ?, ?)
    `,
      [full_name, username, hashed, role, status]
    );
    return result.insertId;
  },

  // Leaving `password` blank on an edit keeps the existing password -
  // matches the dashboard's "Edit User" form, which always shows the
  // password field empty rather than round-tripping the hash.
  async updateUser(id, { full_name, username, password, role, status }) {
    if (password && password.trim()) {
      const hashed = await bcrypt.hash(password.trim(), 10);
      await pool.query(
        `UPDATE users SET full_name=?, username=?, password=?, role=?, status=? WHERE id=?`,
        [full_name, username, hashed, role, status, id]
      );
    } else {
      await pool.query(
        `UPDATE users SET full_name=?, username=?, role=?, status=? WHERE id=?`,
        [full_name, username, role, status, id]
      );
    }
  },

  async getUserStatus(id) {
    const [rows] = await pool.query(`SELECT status FROM users WHERE id=?`, [id]);
    return rows[0] ? rows[0].status : null;
  },

  async updateUserStatus(id, status) {
    await pool.query(`UPDATE users SET status=? WHERE id=?`, [status, id]);
  },

  async deleteUser(id) {
    await pool.query(`DELETE FROM users WHERE id=?`, [id]);
  },

  // ==========================
  // ACTIVITY LOG
  // ==========================

  async getRecentActivities(limit = 100) {
    const [rows] = await pool.query(
      `
      SELECT created_at, username, activity
      FROM activity_log
      ORDER BY id DESC
      LIMIT ?
    `,
      [limit]
    );
    return rows;
  },

  async logActivity(username, activity) {
    await pool.query(
      `INSERT INTO activity_log (username, activity) VALUES (?, ?)`,
      [username, activity]
    );
  },

  // ==========================
  // CUSTOMER BILLS
  // ==========================

  // Matches on customer name OR the bill date formatted the same way it
  // appears in the source spreadsheet (e.g. "6/21/2023"), so typing either
  // a name fragment or a date finds the right rows.
  async searchCustomerBills(keyword) {
    const like = `%${keyword.toLowerCase()}%`;
    const [rows] = await pool.query(
      `
      SELECT id, customer_name, bill_date
      FROM customer_bills
      WHERE LOWER(customer_name) LIKE ?
         OR DATE_FORMAT(bill_date, '%c/%e/%Y') LIKE ?
         OR DATE_FORMAT(bill_date, '%Y-%m-%d') LIKE ?
      ORDER BY customer_name, bill_date
      LIMIT 200
    `,
      [like, like, like]
    );
    return rows;
  },

  // ==========================
  // INVOICES
  // ==========================

  // Inserts the invoice header + line items in one transaction and logs
  // the activity. Does not touch product.stock_count - the Invoice button
  // produces an estimate document, not a stock movement.
  async createInvoice({
    customer_name,
    customer_mobile,
    customer_address,
    invoice_date,
    items,
    discount,
    advance_paid,
    created_by,
  }) {
    const subtotal = items.reduce((sum, it) => sum + it.quantity * it.unit_price, 0);
    const finalAmount = Math.max(subtotal - discount, 0);
    const balanceDue = finalAmount - advance_paid;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [result] = await conn.query(
        `
        INSERT INTO invoices
          (customer_name, customer_mobile, customer_address, invoice_date,
           subtotal, discount, final_amount, advance_paid, balance_due, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          customer_name,
          customer_mobile,
          customer_address,
          invoice_date,
          subtotal,
          discount,
          finalAmount,
          advance_paid,
          balanceDue,
          created_by,
        ]
      );
      const invoiceId = result.insertId;

      for (const it of items) {
        await conn.query(
          `
          INSERT INTO invoice_items
            (invoice_id, product_id, item_name, warranty, quantity, unit_price, line_total)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
          [
            invoiceId,
            it.product_id || null,
            it.item_name,
            it.warranty || "",
            it.quantity,
            it.unit_price,
            it.quantity * it.unit_price,
          ]
        );
      }

      await conn.query(`INSERT INTO activity_log (username, activity) VALUES (?, ?)`, [
        created_by,
        `Created Invoice #${invoiceId} : ${customer_name} (Rs. ${finalAmount.toFixed(2)})`,
      ]);

      await conn.commit();

      return {
        id: invoiceId,
        customer_name,
        customer_mobile,
        customer_address,
        invoice_date,
        subtotal,
        discount,
        final_amount: finalAmount,
        advance_paid,
        balance_due: balanceDue,
        created_by,
        items,
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },
};

module.exports = DatabaseFunctions;
