// db.js
// Replaces the Tkinter app's database.py
// Uses a connection POOL instead of one single connection, because a web
// server can get many requests at the same time (unlike a desktop app).

require("dotenv").config();
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "dc_stock_v2",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
});

// Quick startup check, same idea as the old "Database Connected Successfully" print
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ Database Connected Successfully to", process.env.DB_NAME);
    conn.release();
  } catch (err) {
    console.error("❌ Database Connection Failed:", err.message);
    console.error(
      "   Check your server/.env file matches your MySQL Workbench login."
    );
  }
})();

module.exports = pool;
