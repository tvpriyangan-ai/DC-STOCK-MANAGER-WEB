// scripts/migrate_passwords_to_bcrypt.js
//
// One-time migration: hashes any plaintext passwords in the `users` table
// with bcrypt, in place. Safe to run more than once - rows whose password
// already looks like a bcrypt hash ($2a$/$2b$/$2y$ prefix) are skipped.
//
// Run once, from the server/ folder, after pulling the auth changes and
// before anyone logs in again:
//
//   node scripts/migrate_passwords_to_bcrypt.js
//
// Requires server/.env to be filled in (same DB_* values used by the app).

require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../db');

const BCRYPT_HASH_RE = /^\$2[aby]\$/;

(async () => {
  try {
    const [users] = await pool.query('SELECT id, username, password FROM users');

    let migrated = 0;
    let skipped = 0;

    for (const user of users) {
      if (BCRYPT_HASH_RE.test(user.password)) {
        skipped++;
        continue;
      }
      const hashed = await bcrypt.hash(user.password, 10);
      await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, user.id]);
      console.log(`Hashed password for user "${user.username}"`);
      migrated++;
    }

    console.log(`\nDone. ${migrated} password(s) hashed, ${skipped} already hashed.`);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
