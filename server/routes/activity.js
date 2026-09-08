const express = require("express");
const router = express.Router();
const db = require("../dbFunctions");
const requireAuth = require("../middleware/requireAuth");

// GET /api/activity?limit=400&q=keyword
router.get("/", requireAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 400;
    const q = (req.query.q || "").trim();
    res.json(await db.getRecentActivities(limit, q));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

module.exports = router;
