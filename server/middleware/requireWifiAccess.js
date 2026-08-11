// middleware/requireWifiAccess.js
// Gates the "Wifi Numbers" search - only Admin-role users and the specific
// account "thanusi" (even though thanusi is a regular User role) may use it.

const requireAuth = require('./requireAuth');

module.exports = [
  requireAuth,
  function requireWifiRole(req, res, next) {
    const role = (req.user.role || '').trim().toLowerCase();
    const username = (req.user.username || '').trim().toLowerCase();
    if (role !== 'admin' && username !== 'thanusi') {
      return res.status(403).json({ error: 'Access denied.' });
    }
    next();
  },
];
