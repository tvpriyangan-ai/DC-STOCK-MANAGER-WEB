const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const db = require("../dbFunctions");

// ----- image upload setup (replaces the Tkinter "Browse Image" + shutil.copy) -----
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../../public/images")),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// GET /api/products              -> all products
// GET /api/products?category=X   -> filtered by category
// GET /api/products?search=X     -> search by name/category
router.get("/", async (req, res) => {
  try {
    const { category, search } = req.query;
    let rows;
    if (search) {
      rows = await db.searchProducts(search);
    } else if (category && category !== "All Products") {
      rows = await db.getProductsByCategory(category);
    } else {
      rows = await db.getAllProducts();
    }
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/out-of-stock
router.get("/out-of-stock", async (req, res) => {
  try {
    res.json(await db.getOutOfStockProducts());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/dashboard-counts
router.get("/dashboard-counts", async (req, res) => {
  try {
    res.json(await db.getDashboardCounts());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/:id
router.get("/:id", async (req, res) => {
  try {
    const row = await db.getProductById(req.params.id);
    if (!row) return res.status(404).json({ error: "Product not found." });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products   (multipart/form-data, field "image" optional)
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { category, product_name, condition, price, stock_count, created_by } = req.body;

    if (!product_name || !product_name.trim()) {
      return res.status(400).json({ error: "Please enter Product Name." });
    }
    if (price === undefined || price === "") {
      return res.status(400).json({ error: "Please enter Product Price." });
    }
    if (stock_count === undefined || stock_count === "") {
      return res.status(400).json({ error: "Please enter Stock Quantity." });
    }

    const image_path = req.file ? `images/${req.file.filename}` : "";

    const id = await db.addProduct({
      category,
      product_name: product_name.trim(),
      condition,
      price: parseFloat(price),
      stock_count: parseInt(stock_count, 10),
      created_by: created_by || "Admin",
      image_path,
    });

    await db.logActivity(created_by || "Admin", `Added Product : ${product_name.trim()}`);

    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/products/:id
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { category, product_name, condition, price, stock_count, created_by } = req.body;

    if (!product_name || !product_name.trim()) {
      return res.status(400).json({ error: "Please enter Product Name." });
    }
    if (price === undefined || price === "") {
      return res.status(400).json({ error: "Please enter Product Price." });
    }
    if (stock_count === undefined || stock_count === "") {
      return res.status(400).json({ error: "Please enter Stock Quantity." });
    }

    const existing = await db.getProductById(req.params.id);
    if (!existing) return res.status(404).json({ error: "Product not found." });

    const image_path = req.file ? `images/${req.file.filename}` : req.body.existing_image_path || "";

    await db.updateProduct(req.params.id, {
      category,
      product_name: product_name.trim(),
      condition,
      price: parseFloat(price),
      stock_count: parseInt(stock_count, 10),
      created_by: created_by || "Admin",
      image_path,
    });

    await db.logActivity("Admin", `Updated Product : ${product_name.trim()}`);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/products/:id/stock   { operation: "IN"|"OUT", quantity, username }
router.patch("/:id/stock", async (req, res) => {
  try {
    const { operation, quantity, username } = req.body;
    const qty = parseInt(quantity, 10);

    if (!qty || qty <= 0) {
      return res.status(400).json({ error: "Quantity must be greater than zero." });
    }

    const product = await db.getProductById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found." });

    const current = product.stock_count;
    let newStock;

    if (operation === "IN") {
      newStock = current + qty;
    } else {
      if (qty > current) {
        return res.status(400).json({ error: "Not enough stock available." });
      }
      newStock = current - qty;
    }

    await db.updateStock(req.params.id, newStock);
    await db.logActivity(
      username || "Admin",
      `Stock ${operation} : ${product.product_name} (${current} \u2192 ${newStock})`
    );

    res.json({ success: true, new_stock: newStock });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/products/:id
router.delete("/:id", async (req, res) => {
  try {
    const product = await db.getProductById(req.params.id);
    const affected = await db.deleteProduct(req.params.id);
    if (affected === 0) return res.status(404).json({ error: "Product not found." });

    if (product) {
      await db.logActivity("Admin", `Deleted Product : ${product.product_name}`);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
