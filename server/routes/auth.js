const express = require("express");
const router = express.Router();
const db = require("../dbFunctions");

// POST /api/login  { username, password }
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !username.trim()) {
    return res.status(400).json({ error: "Please enter username." });
  }
  if (!password || !password.trim()) {
    return res.status(400).json({ error: "Please enter password." });
  }

  try {
    const user = await db.findLoginUser(username.trim(), password.trim());

    if (!user) {
      return res.status(401).json({ error: "Invalid Username or Password." });
    }

    // No session/cookie system yet - the frontend stores this in memory
    // for the duration of the visit. See README for adding real auth tokens.
    res.json({ username: user.username, role: user.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
