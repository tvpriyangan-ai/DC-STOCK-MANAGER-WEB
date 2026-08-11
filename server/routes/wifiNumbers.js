const express = require("express");
const router = express.Router();
const db = require("../dbFunctions");
const requireWifiAccess = require("../middleware/requireWifiAccess");

// Admin, and the user "thanusi", only - see requireWifiAccess.
router.use(requireWifiAccess);

// GET /api/wifi-numbers/search?q=keyword
router.get("/search", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.json([]);
    res.json(await db.searchWifiNumbers(q));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

module.exports = router;
