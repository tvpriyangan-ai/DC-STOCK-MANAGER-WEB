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
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
