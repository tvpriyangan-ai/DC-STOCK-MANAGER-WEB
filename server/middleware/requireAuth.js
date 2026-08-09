// middleware/requireAuth.js
// Verifies the "Authorization: Bearer <token>" header issued at login,
// then re-checks the user's current role/status in the DB (not just what
// was in the token) so a deactivated/deleted user's existing token stops
// working immediately instead of staying valid until it expires.

const jwt = require('jsonwebtoken');
const db = require('../dbFunctions');

module.exports = async function requireAuth(req, res, next) {
  const header = req.header('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  if (!token) {
    return res.status(401).json({ error: 'Login required.' });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }

  try {
    const user = await db.getUserByUsername(payload.username);
    if (!user || (user.status || '').trim().toLowerCase() !== 'active') {
      return res.status(401).json({ error: 'Login required.' });
    }
    req.user = user;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};
