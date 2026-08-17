// routes/auth.js
// Mirrors login.py -> login()

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !username.trim()) {
    return res.status(400).json({ error: 'Please enter username.' });
  }
  if (!password || !password.trim()) {
    return res.status(400).json({ error: 'Please enter password.' });
  }

  try {
    // TEMP DIAGNOSTIC - logs only lengths/booleans, never the actual password. Remove once login issue is found.
    console.log('LOGIN DEBUG: username=%j (len %d), password length=%d', username.trim(), username.trim().length, password.trim().length);

    const [rows] = await pool.query(
      `SELECT username, password, role, full_name FROM users
       WHERE username = ? AND status = 'Active'`,
      [username.trim()]
    );
    const user = rows[0];
    console.log('LOGIN DEBUG: matching active user found in DB?', !!user);

    const passwordMatches = user ? await bcrypt.compare(password.trim(), user.password) : false;
    console.log('LOGIN DEBUG: password matches?', passwordMatches);

    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid Username or Password.' });
    }

    const token = jwt.sign(
      { username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      token,
      username: user.username,
      role: user.role,
      full_name: user.full_name
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
