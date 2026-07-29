const express = require("express");
const router = express.Router();
const db = require("../dbFunctions");

// GET /api/activity?limit=100
router.get("/", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 100;
    res.json(await db.getRecentActivities(limit));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
