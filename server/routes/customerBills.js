const express = require("express");
const router = express.Router();
const db = require("../dbFunctions");
const requireAdmin = require("../middleware/requireAdmin");

// Admin-only, same as user management - regular staff don't get this button.
router.use(requireAdmin);

// GET /api/customer-bills/search?q=keyword
router.get("/search", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.json([]);
    res.json(await db.searchCustomerBills(q));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

// POST /api/customer-bills - Admin only (whole router is gated above).
router.post("/", async (req, res) => {
  const { customer_name, bill_date } = req.body;

  if (!customer_name || !customer_name.trim()) {
    return res.status(400).json({ error: "Please enter Customer Name." });
  }
  if (!bill_date) {
    return res.status(400).json({ error: "Please select a Bill Date." });
  }

  try {
    const id = await db.addCustomerBill({ customer_name: customer_name.trim(), bill_date });
    await db.logActivity(req.user.username, `Added Customer Bill : ${customer_name.trim()}`);
    res.status(201).json({ id, customer_name: customer_name.trim(), bill_date });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

module.exports = router;
