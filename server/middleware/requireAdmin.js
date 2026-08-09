// middleware/requireAdmin.js
// Confirms the caller has a valid login token (requireAuth) AND that their
// current DB role is Admin, before letting the request through. Used to
// gate product create/update/delete and all user-management routes so the
// non-admin staff accounts can only view products and adjust stock counts.

const requireAuth = require('./requireAuth');

module.exports = [
  requireAuth,
  function requireAdminRole(req, res, next) {
    if ((req.user.role || '').trim().toLowerCase() !== 'admin') {
      return res.status(403).json({ error: 'Admin access required.' });
    }
    next();
  },
];
