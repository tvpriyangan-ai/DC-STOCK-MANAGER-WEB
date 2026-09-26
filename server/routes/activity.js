const express = require("express");
const router = express.Router();
const db = require("../dbFunctions");
const requireAuth = require("../middleware/requireAuth");

// GET /api/activity?limit=400&q=keyword&type=used|in|invoice|product
router.get("/", requireAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 400;
    const q = (req.query.q || "").trim();
    const type = (req.query.type || "").trim();
    const isAdmin = (req.user.role || "").trim().toLowerCase() === "admin";
    res.json(await db.getRecentActivities(limit, q, type, !isAdmin));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

module.exports = router;
