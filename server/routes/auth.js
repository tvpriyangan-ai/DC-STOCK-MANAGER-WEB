// routes/auth.js
// Mirrors login.py -> login()

const express = require('express');
const router = express.Router();
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
    // TEMPORARY DEBUG LOGGING - remove once login issue is fixed
    console.log('LOGIN ATTEMPT - username:', JSON.stringify(username.trim()), 'length:', username.trim().length);
    console.log('LOGIN ATTEMPT - password:', JSON.stringify(password.trim()), 'length:', password.trim().length);

    const [rows] = await pool.query(
      `SELECT username, role, full_name FROM users
       WHERE username = ? AND status = 'Active'`,
      [username.trim()]
    );
    console.log('LOGIN DEBUG - rows found for this username (ignoring password):', rows.length);
    if (rows.length > 0) {
      console.log('LOGIN DEBUG - user found:', JSON.stringify(rows[0]));
    }

    const [matchRows] = await pool.query(
      `SELECT username, role, full_name FROM users
       WHERE username = ? AND password = ? AND status = 'Active'`,
      [username.trim(), password.trim()]
    );
    const rowsResult = matchRows;

    if (rowsResult.length === 0) {
      return res.status(401).json({ error: 'Invalid Username or Password.' });
    }

    const user = rowsResult[0];
    res.json({
      username: user.username,
      role: user.role,
      full_name: user.full_name
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
