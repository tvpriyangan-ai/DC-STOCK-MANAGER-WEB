// routes/products.js
// Mirrors DatabaseFunctions: get_all_products, get_products_by_category,
// search_product, add_product, update_product, update_stock,
// delete_product, get_product_by_id, get_dashboard_counts,
// get_out_of_stock_products

const express = require('express');
const router = express.Router();
const pool = require('../db');
const requireAdmin = require('../middleware/requireAdmin');

// Product images are pre-uploaded to public/images via GitHub (see
// routes/images.js), not uploaded through this API - the catalog is fixed,
// so Add/Update just stores whichever filename the person picked from the
// dropdown (e.g. "images/dvr_camera.jpg").

// ---------- DASHBOARD COUNTS ----------
router.get('/dashboard/counts', async (req, res) => {
  try {
    const [[{ total_products }]] = await pool.query('SELECT COUNT(*) AS total_products FROM product');
    const [[{ total_stock }]] = await pool.query('SELECT IFNULL(SUM(stock_count),0) AS total_stock FROM product');
    const [[{ low_stock }]] = await pool.query('SELECT COUNT(*) AS low_stock FROM product WHERE stock_count <= 5 AND stock_count > 0');
    const [[{ out_of_stock }]] = await pool.query('SELECT COUNT(*) AS out_of_stock FROM product WHERE stock_count = 0');

    res.json({ total_products, total_stock, low_stock, out_of_stock });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- OUT OF STOCK (must be before /:id) ----------
router.get('/out-of-stock', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, category, product_name, \`condition\`, price, stock_count, created_by, image_path
       FROM product WHERE stock_count = 0 ORDER BY product_name`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- SEARCH (must be before /:id) ----------
// Matches each word of the query separately (AND'd together) rather than
// the whole phrase as one substring, so word order / which column a word
// lands in (e.g. "dvr" in the name vs "CCTV" in the category) doesn't
// stop a match - "cctv camera" now finds a camera whose category is CCTV
// even though "cctv camera" never appears as a contiguous substring.
//
// Both sides are wrapped in LOWER() rather than relying on LIKE's own
// case-insensitivity - the production TiDB database uses a case-sensitive
// collation, so plain LIKE was silently missing anything whose case didn't
// match exactly (e.g. searching "cctv" found 4 rows; the CCTV category
// itself, stored uppercase, only turned up 39 more once this was fixed).
router.get('/search', async (req, res) => {
  const words = (req.query.q || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return res.json([]);

  const whereClause = words.map(() => '(LOWER(category) LIKE ? OR LOWER(product_name) LIKE ?)').join(' AND ');
  const params = words.flatMap((w) => [`%${w}%`, `%${w}%`]);

  try {
    const [rows] = await pool.query(
      `SELECT id, category, product_name, \`condition\`, price, stock_count, created_by, image_path
       FROM product
       WHERE ${whereClause}
       ORDER BY category, product_name`,
      params
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- ALL PRODUCTS / BY CATEGORY ----------
router.get('/', async (req, res) => {
  const { category } = req.query;
  try {
    let rows;
    if (category && category !== 'All Products') {
      [rows] = await pool.query(
        `SELECT id, category, product_name, \`condition\`, price, stock_count, created_by, image_path
         FROM product WHERE category = ? ORDER BY product_name`,
        [category]
      );
    } else {
      [rows] = await pool.query(
        `SELECT id, category, product_name, \`condition\`, price, stock_count, created_by, image_path
         FROM product ORDER BY category, product_name`
      );
    }
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- GET ONE PRODUCT ----------
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM product WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Product not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- ADD PRODUCT (Admin only) ----------
router.post('/', requireAdmin, async (req, res) => {
  const { category, product_name, condition, price, stock_count, created_by, image_path: rawImagePath } = req.body;

  if (!product_name || !product_name.trim()) {
    return res.status(400).json({ error: 'Please enter Product Name.' });
  }
  if (price === undefined || price === '') {
    return res.status(400).json({ error: 'Please enter Product Price.' });
  }
  if (stock_count === undefined || stock_count === '') {
    return res.status(400).json({ error: 'Please enter Stock Quantity.' });
  }

  const image_path = rawImagePath || '';

  try {
    const [result] = await pool.query(
      `INSERT INTO product (category, product_name, \`condition\`, price, stock_count, created_by, image_path)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [category, product_name.trim(), condition, parseFloat(price), parseInt(stock_count), created_by || 'Admin', image_path]
    );

    await pool.query(
      `INSERT INTO activity_log (username, activity) VALUES (?, ?)`,
      [created_by || 'Admin', `Added Product : ${product_name.trim()}`]
    );

    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- UPDATE PRODUCT (Admin only) ----------
router.put('/:id', requireAdmin, async (req, res) => {
  const { category, product_name, condition, price, stock_count, created_by, image_path: rawImagePath } = req.body;

  if (!product_name || !product_name.trim()) {
    return res.status(400).json({ error: 'Please enter Product Name.' });
  }

  const image_path = rawImagePath || '';

  try {
    await pool.query(
      `UPDATE product SET category=?, product_name=?, \`condition\`=?, price=?, stock_count=?, created_by=?, image_path=?
       WHERE id=?`,
      [category, product_name.trim(), condition, parseFloat(price), parseInt(stock_count), created_by, image_path, req.params.id]
    );

    await pool.query(
      `INSERT INTO activity_log (username, activity) VALUES (?, ?)`,
      ['Admin', `Updated Product : ${product_name.trim()}`]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- STOCK IN / OUT ----------
router.put('/:id/stock', async (req, res) => {
  const { operation, quantity, username } = req.body;
  const qty = parseInt(quantity);

  if (!qty || qty <= 0) {
    return res.status(400).json({ error: 'Quantity must be greater than zero.' });
  }

  try {
    const [rows] = await pool.query('SELECT product_name, stock_count FROM product WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Product not found.' });

    const current = rows[0].stock_count;
    let newStock;

    if (operation === 'IN') {
      newStock = current + qty;
    } else {
      if (qty > current) {
        return res.status(400).json({ error: 'Not enough stock available.' });
      }
      newStock = current - qty;
    }

    await pool.query('UPDATE product SET stock_count = ? WHERE id = ?', [newStock, req.params.id]);

    await pool.query(
      `INSERT INTO activity_log (username, activity) VALUES (?, ?)`,
      [username || 'Admin', `Stock ${operation} : ${rows[0].product_name} (${current} \u2192 ${newStock})`]
    );

    res.json({ success: true, new_stock: newStock });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- DELETE PRODUCT (Admin only) ----------
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT product_name FROM product WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Product not found.' });

    await pool.query('DELETE FROM product WHERE id = ?', [req.params.id]);

    await pool.query(
      `INSERT INTO activity_log (username, activity) VALUES (?, ?)`,
      ['Admin', `Deleted Product : ${rows[0].product_name}`]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
