const express = require("express");
const router = express.Router();
const db = require("../dbFunctions");
const requireWifiAccess = require("../middleware/requireWifiAccess");
const requireAdmin = require("../middleware/requireAdmin");

// GET /api/wifi-numbers/search?q=keyword
// Admin, and the user "thanusi", only - see requireWifiAccess.
router.get("/search", requireWifiAccess, async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.json([]);
    res.json(await db.searchWifiNumbers(q));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

// POST /api/wifi-numbers - Admin only.
router.post("/", requireAdmin, async (req, res) => {
  const { code, number, name } = req.body;

  if (!code || !code.trim()) return res.status(400).json({ error: "Please enter a Code." });
  if (!number || !number.trim()) return res.status(400).json({ error: "Please enter a Number." });
  if (!name || !name.trim()) return res.status(400).json({ error: "Please enter a Name." });

  try {
    const id = await db.addWifiNumber({
      code: code.trim(),
      number: number.trim(),
      name: name.trim(),
    });
    await db.logActivity(req.user.username, `Added Wifi Number : ${name.trim()} (${number.trim()})`);
    res.status(201).json({ id, code: code.trim(), number: number.trim(), name: name.trim() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

module.exports = router;
