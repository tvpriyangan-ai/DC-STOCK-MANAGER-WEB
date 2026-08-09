// dbFunctions.js
// Direct equivalent of your Tkinter app's database_functions.py
// Same queries, same table/column names, just written as async JS instead
// of Python + mysql.connector.

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
    const [result] = await pool.query(
      `
      INSERT INTO users (full_name, username, password, role, status)
      VALUES (?, ?, ?, ?, ?)
    `,
      [full_name, username, password, role, status]
    );
    return result.insertId;
  },

  async updateUser(id, { full_name, username, password, role, status }) {
    await pool.query(
      `
      UPDATE users
      SET full_name=?, username=?, password=?, role=?, status=?
      WHERE id=?
    `,
      [full_name, username, password, role, status, id]
    );
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

  async findLoginUser(username, password) {
    // NOTE: matches the original app's plain-text password check.
    // Flagged as a security improvement opportunity in the README.
    const [rows] = await pool.query(
      `
      SELECT username, role FROM users
      WHERE username=? AND password=? AND status='ACTIVE'
    `,
      [username, password]
    );
    return rows[0] || null;
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
    const like = `%${keyword}%`;
    const [rows] = await pool.query(
      `
      SELECT id, customer_name, bill_date
      FROM customer_bills
      WHERE customer_name LIKE ?
         OR DATE_FORMAT(bill_date, '%c/%e/%Y') LIKE ?
         OR DATE_FORMAT(bill_date, '%Y-%m-%d') LIKE ?
      ORDER BY customer_name, bill_date
      LIMIT 200
    `,
      [like, like, like]
    );
    return rows;
  },
};

module.exports = DatabaseFunctions;
