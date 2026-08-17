const express = require("express");
const router = express.Router();
const db = require("../dbFunctions");
const requireAuth = require("../middleware/requireAuth");
const requireAdmin = require("../middleware/requireAdmin");

// Open to any logged-in user (Admin or staff) - unlike Customer Bill /
// Users, invoice creation isn't gated by requireAdmin.

// GET /api/invoices?q=keyword - Invoice History (Admin only).
router.get("/", requireAdmin, async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    res.json(await db.getAllInvoices(q));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

// GET /api/invoices/:id - Invoice History detail view (Admin only).
router.get("/:id", requireAdmin, async (req, res) => {
  try {
    const invoice = await db.getInvoiceById(req.params.id);
    if (!invoice) return res.status(404).json({ error: "Invoice not found." });
    res.json(invoice);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

// POST /api/invoices
router.post("/", requireAuth, async (req, res) => {
  const {
    customer_name,
    customer_mobile,
    customer_address,
    invoice_date,
    items,
    discount,
    advance_paid,
  } = req.body;

  if (!customer_name || !customer_name.trim()) {
    return res.status(400).json({ error: "Please enter Customer Name." });
  }
  if (!customer_mobile || !customer_mobile.trim()) {
    return res.status(400).json({ error: "Please enter Customer Mobile No." });
  }
  if (!customer_address || !customer_address.trim()) {
    return res.status(400).json({ error: "Please enter Address." });
  }
  if (!invoice_date) {
    return res.status(400).json({ error: "Please select a Date." });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Add at least one item to the invoice." });
  }

  const cleanItems = [];
  for (const it of items) {
    const item_name = (it.item_name || "").trim();
    const quantity = parseInt(it.quantity);
    const unit_price = parseFloat(it.unit_price);

    if (!item_name) return res.status(400).json({ error: "Every item needs a name." });
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: `Quantity for "${item_name}" must be greater than zero.` });
    }
    if (isNaN(unit_price) || unit_price < 0) {
      return res.status(400).json({ error: `Unit price for "${item_name}" is invalid.` });
    }

    cleanItems.push({
      product_id: it.product_id || null,
      item_name,
      warranty: (it.warranty || "").trim(),
      quantity,
      unit_price,
    });
  }

  const discountNum = parseFloat(discount) || 0;
  const advanceNum = parseFloat(advance_paid) || 0;

  try {
    const invoice = await db.createInvoice({
      customer_name: customer_name.trim(),
      customer_mobile: customer_mobile.trim(),
      customer_address: customer_address.trim(),
      invoice_date,
      items: cleanItems,
      discount: discountNum,
      advance_paid: advanceNum,
      created_by: req.user.username,
    });
    res.status(201).json(invoice);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

module.exports = router;
