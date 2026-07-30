const express = require("express");
const router = express.Router();
const db = require("../dbFunctions");
const requireAdmin = require("../middleware/requireAdmin");

// Every route in this file is Admin-only - only Admin manages users.
router.use(requireAdmin);

// GET /api/users
router.get("/", async (req, res) => {
  try {
    res.json(await db.getAllUsers());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:id
router.get("/:id", async (req, res) => {
  try {
    const row = await db.getUserById(req.params.id);
    if (!row) return res.status(404).json({ error: "User not found." });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users
router.post("/", async (req, res) => {
  try {
    const { full_name, username, password, role, status } = req.body;
    const id = await db.addUser({
      full_name,
      username,
      password,
      role: role || "User",
      status: status || "Active",
    });
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id
router.put("/:id", async (req, res) => {
  try {
    const { full_name, username, password, role, status } = req.body;
    await db.updateUser(req.params.id, { full_name, username, password, role, status });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/users/:id/toggle-status
router.patch("/:id/toggle-status", async (req, res) => {
  try {
    const current = await db.getUserStatus(req.params.id);
    if (current === null) return res.status(404).json({ error: "User not found." });
    const next = current === "Active" ? "Inactive" : "Active";
    await db.updateUserStatus(req.params.id, next);
    res.json({ success: true, status: next });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/users/:id
router.delete("/:id", async (req, res) => {
  try {
    await db.deleteUser(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
