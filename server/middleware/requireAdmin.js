// middleware/requireAdmin.js
// Confirms the caller (identified by the X-Username header the frontend
// sends on every request, set from the logged-in session) is an active
// Admin before letting the request through. Used to gate product
// create/update/delete and all user-management routes so the 5 non-admin
// staff accounts can only view products and adjust stock counts.

const db = require('../dbFunctions');

module.exports = async function requireAdmin(req, res, next) {
  const username = req.header('x-username');
  if (!username) {
    return res.status(401).json({ error: 'Login required.' });
  }

  try {
    const user = await db.getUserByUsername(username);
    if (!user || (user.status || '').trim().toLowerCase() !== 'active') {
      return res.status(401).json({ error: 'Login required.' });
    }
    if ((user.role || '').trim().toLowerCase() !== 'admin') {
      return res.status(403).json({ error: 'Admin access required.' });
    }
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
