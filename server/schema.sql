-- ============================================================
-- DC STOCK MANAGER - Web Version Schema
-- Run this in MySQL Workbench against your dc_stock_v2 database.
-- It is written with "IF NOT EXISTS" so it's safe to re-run and
-- safe to run on top of your existing data - it will not wipe
-- anything out, it just makes sure every column the web app
-- needs is present (your original files had two slightly
-- different versions of the `users` table, this reconciles them).
-- ============================================================

CREATE DATABASE IF NOT EXISTS dc_stock_v2;
USE dc_stock_v2;

-- ---------------- product ----------------
CREATE TABLE IF NOT EXISTS product (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    `condition` VARCHAR(20) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock_count INT NOT NULL DEFAULT 0,
    created_by VARCHAR(50) NOT NULL,
    image_path VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_product_name ON product(product_name);
CREATE INDEX IF NOT EXISTS idx_category ON product(category);

-- ---------------- users ----------------
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100),
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Active'
);

-- If you already had a `users` table without full_name/status
-- (like the version in sql.sql), these add the missing columns.
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(100) AFTER id;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'Active';

INSERT INTO users (full_name, username, password, role, status)
SELECT 'Administrator', 'admin', 'admin123', 'Admin', 'Active'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

-- ---------------- activity_log ----------------
CREATE TABLE IF NOT EXISTS activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50),
    activity TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------- customer_bills ----------------
-- Historical customer/bill-date lookup, imported once from
-- customer_bills.csv via customer_bills_import.sql. Powers the
-- "Customer Bill" search dialog (Admin only).
CREATE TABLE IF NOT EXISTS customer_bills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    bill_date DATE NULL
);

-- MySQL has no "CREATE INDEX IF NOT EXISTS", so this checks
-- information_schema first to stay safe to re-run.
SET @idx_exists := (
    SELECT COUNT(*) FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'customer_bills' AND index_name = 'idx_customer_bills_name'
);
SET @sql := IF(@idx_exists = 0, 'CREATE INDEX idx_customer_bills_name ON customer_bills(customer_name)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists := (
    SELECT COUNT(*) FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'customer_bills' AND index_name = 'idx_customer_bills_date'
);
SET @sql := IF(@idx_exists = 0, 'CREATE INDEX idx_customer_bills_date ON customer_bills(bill_date)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
