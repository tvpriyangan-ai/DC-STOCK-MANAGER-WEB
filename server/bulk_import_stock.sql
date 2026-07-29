-- ===========================================
-- DC STOCK MANAGER - Bulk Product Registration
-- Generated from stock_web.pdf (139-row list)
-- Run this ONCE in your TiDB Cloud SQL editor
-- (or MySQL Workbench) after schema.sql has
-- already created the `product` table.
--
-- All stock_count values are set to 0 and price
-- to 0.00 as placeholders - update these through
-- the app's Stock button / Update Product screen
-- once this import is done.
-- ===========================================

USE dc_stock_v2;

INSERT INTO product (category, product_name, `condition`, price, stock_count, created_by, image_path) VALUES
-- ---------- CCTV ----------
('CCTV', '32ch DVR HIKVISION', 'New', 0.00, 0, 'Admin', ''),
('CCTV', '16CH DVR HIKVISION', 'New', 0.00, 0, 'Admin', ''),
('CCTV', '8CH DVR HIKVISION', 'New', 0.00, 0, 'Admin', ''),
('CCTV', '4CH DVR HIKVISION', 'New', 0.00, 0, 'Admin', ''),
('CCTV', '8CH Trueview dvr', 'New', 0.00, 0, 'Admin', ''),
('CCTV', '4CH Trueview DVR', 'New', 0.00, 0, 'Admin', ''),
('CCTV', 'Night Vision NEW Trueview cam', 'New', 0.00, 0, 'Admin', ''),
('CCTV', '20m colour+mic trueview cam', 'New', 0.00, 0, 'Admin', ''),
('CCTV', '40m Trueview colour camera', 'New', 0.00, 0, 'Admin', ''),
('CCTV', 'Nightvision Camera- used', 'Used', 0.00, 0, 'Admin', ''),
('CCTV', '40m Colour Camera-used', 'Used', 0.00, 0, 'Admin', ''),
('CCTV', '20m Hikvision Colour+Mic Cam', 'New', 0.00, 0, 'Admin', ''),
('CCTV', '40m Hikvision colour+mic cam', 'New', 0.00, 0, 'Admin', ''),
('CCTV', 'wire rotation trueview camera', 'New', 0.00, 0, 'Admin', ''),
('CCTV', 'wire rotation hikvision camera', 'New', 0.00, 0, 'Admin', ''),
('CCTV', 'Fisheye lens IR Indoor Camera', 'New', 0.00, 0, 'Admin', ''),
('CCTV', 'Fisheye lens Indoor Colour Cam', 'New', 0.00, 0, 'Admin', ''),
('CCTV', 'Fisheye Outdoor Camera', 'New', 0.00, 0, 'Admin', ''),
('CCTV', 'Zoom camera-Dark vision', 'New', 0.00, 0, 'Admin', ''),
('CCTV', 'V380pro single lens WIFI', 'New', 0.00, 0, 'Admin', ''),
('CCTV', 'V380pro single lens 4G', 'New', 0.00, 0, 'Admin', ''),
('CCTV', 'V380pro DUAL lens WIFI', 'New', 0.00, 0, 'Admin', ''),
('CCTV', 'V380pro DUAL lens 4G', 'New', 0.00, 0, 'Admin', ''),
('CCTV', 'ICSEE DUAL LENS WIFI', 'New', 0.00, 0, 'Admin', ''),
('CCTV', 'Hikvision SINGLE Lens 4G', 'New', 0.00, 0, 'Admin', ''),
('CCTV', 'Hikvision EZVIZ Dual lens 4G', 'New', 0.00, 0, 'Admin', ''),
('CCTV', 'SOALR CAMERA 4G DUAL LENS', 'New', 0.00, 0, 'Admin', ''),
('CCTV', 'Bulb Camera WIFI', 'New', 0.00, 0, 'Admin', ''),
('CCTV', 'Hikvision Dual Lens indoor', 'New', 0.00, 0, 'Admin', ''),
('CCTV', 'Triple lens v380po', 'New', 0.00, 0, 'Admin', ''),
('CCTV', 'v380pro dual lens camera-used', 'Used', 0.00, 0, 'Admin', ''),
('CCTV', 'v380pro single lens camera-used', 'Used', 0.00, 0, 'Admin', ''),
('CCTV', 'ICSEE Dual Lens-used', 'Used', 0.00, 0, 'Admin', ''),

-- ---------- CABLES ----------
('Cables', 'TT Power Cable', 'New', 0.00, 0, 'Admin', ''),
('Cables', '3C2V Coxial Cable', 'New', 0.00, 0, 'Admin', ''),
('Cables', 'Cat 6 Outdoor Black Cable', 'New', 0.00, 0, 'Admin', ''),
('Cables', 'Cat 6 Hikvision Gray Cable', 'New', 0.00, 0, 'Admin', ''),
('Cables', 'Cat 6 Orange Indoor Cable', 'New', 0.00, 0, 'Admin', ''),
('Cables', 'HDMI 1.5M', 'New', 0.00, 0, 'Admin', ''),
('Cables', 'HDMI 3M', 'New', 0.00, 0, 'Admin', ''),
('Cables', 'HDMI 5M', 'New', 0.00, 0, 'Admin', ''),
('Cables', 'HDMI 10M', 'New', 0.00, 0, 'Admin', ''),
('Cables', 'HDMI 15M', 'New', 0.00, 0, 'Admin', ''),
('Cables', 'HDMI 20M', 'New', 0.00, 0, 'Admin', ''),
('Cables', 'VGA 1.5M', 'New', 0.00, 0, 'Admin', ''),
('Cables', 'VGA 3M', 'New', 0.00, 0, 'Admin', ''),
('Cables', 'VGA 5M', 'New', 0.00, 0, 'Admin', ''),
('Cables', 'VGA 10M', 'New', 0.00, 0, 'Admin', ''),
('Cables', 'VGA 15M', 'New', 0.00, 0, 'Admin', ''),
('Cables', 'VGA 20M', 'New', 0.00, 0, 'Admin', ''),
('Cables', 'USB Cable 1.5m', 'New', 0.00, 0, 'Admin', ''),
('Cables', 'USB Cable 3m', 'New', 0.00, 0, 'Admin', ''),
('Cables', 'USB Cable 5m', 'New', 0.00, 0, 'Admin', ''),
('Cables', 'USB Cable 10m', 'New', 0.00, 0, 'Admin', ''),
('Cables', 'USB Cable 15m', 'New', 0.00, 0, 'Admin', ''),
('Cables', 'USB Cable 20m', 'New', 0.00, 0, 'Admin', ''),
('Cables', 'Printer Cable', 'New', 0.00, 0, 'Admin', ''),
('Cables', 'DC Cable -male', 'New', 0.00, 0, 'Admin', ''),
('Cables', 'DC Cable female', 'New', 0.00, 0, 'Admin', ''),
('Cables', 'Network Cable 1.5m yellow', 'New', 0.00, 0, 'Admin', ''),
('Cables', 'DVR HDD sata cable', 'New', 0.00, 0, 'Admin', ''),
('Cables', 'DVR HDD Power Cable', 'New', 0.00, 0, 'Admin', ''),
('Cables', 'DESKTOP POWER CABLE', 'New', 0.00, 0, 'Admin', ''),

-- ---------- POWER SUPPLY ----------
('Power Supply', '12V 2A CCTV Power Supply', 'New', 0.00, 0, 'Admin', ''),
('Power Supply', '12V 2A Rotation Power supply', 'New', 0.00, 0, 'Admin', ''),
('Power Supply', '12V DVR Power supply -HIKVISION', 'New', 0.00, 0, 'Admin', ''),
('Power Supply', '12V 5A Power Supply- BLACK', 'New', 0.00, 0, 'Admin', ''),
('Power Supply', '12V Router Power Supply', 'New', 0.00, 0, 'Admin', ''),
('Power Supply', '21V 2A Power Supply', 'New', 0.00, 0, 'Admin', ''),
('Power Supply', 'UPS', 'New', 0.00, 0, 'Admin', ''),

-- ---------- HARD DISK ----------
('Hard Disk', '500GB HDD', 'New', 0.00, 0, 'Admin', ''),
('Hard Disk', '1TB HDD', 'New', 0.00, 0, 'Admin', ''),
('Hard Disk', '2TB HDD', 'New', 0.00, 0, 'Admin', ''),
('Hard Disk', '4TB HDD', 'New', 0.00, 0, 'Admin', ''),

-- ---------- SD CARDS ----------
('SD Cards', '64GB SD Card', 'New', 0.00, 0, 'Admin', ''),
('SD Cards', '128G SD Card', 'New', 0.00, 0, 'Admin', ''),

-- ---------- ACCESSORIES ----------
('Accessories', 'Cabin Box 3U', 'New', 0.00, 0, 'Admin', ''),
('Accessories', 'alarm sensor', 'New', 0.00, 0, 'Admin', ''),
('Accessories', 'door sensor', 'New', 0.00, 0, 'Admin', ''),
('Accessories', 'GPS', 'New', 0.00, 0, 'Admin', ''),
('Accessories', 'WIRELESS MOUSE BATTERY', 'New', 0.00, 0, 'Admin', ''),
('Accessories', 'WIRELESS MOUSE RECHARGE', 'New', 0.00, 0, 'Admin', ''),
('Accessories', 'WIRE MOUSE', 'New', 0.00, 0, 'Admin', ''),
('Accessories', 'rain guard cover', 'New', 0.00, 0, 'Admin', ''),
('Accessories', 'BNC', 'New', 0.00, 0, 'Admin', ''),
('Accessories', 'AV Pin', 'New', 0.00, 0, 'Admin', ''),
('Accessories', 'HDMI connector', 'New', 0.00, 0, 'Admin', ''),
('Accessories', 'CAT6 connector', 'New', 0.00, 0, 'Admin', ''),
('Accessories', '2MP BALUN CONNECTOR', 'New', 0.00, 0, 'Admin', ''),
('Accessories', '5MP BALUN', 'New', 0.00, 0, 'Admin', ''),
('Accessories', '8MP BALUN', 'New', 0.00, 0, 'Admin', ''),
('Accessories', 'Balun extender', 'New', 0.00, 0, 'Admin', ''),
('Accessories', 'HDMI extender', 'New', 0.00, 0, 'Admin', ''),
('Accessories', 'Keyboard MAT', 'New', 0.00, 0, 'Admin', ''),
('Accessories', 'MIC', 'New', 0.00, 0, 'Admin', ''),
('Accessories', 'CONTACT CLEANER SPRAY', 'New', 0.00, 0, 'Admin', ''),
('Accessories', 'AIR SPRAY', 'New', 0.00, 0, 'Admin', ''),
('Accessories', 'co2 Spray', 'New', 0.00, 0, 'Admin', ''),
('Accessories', 'cctv stand steel- small', 'New', 0.00, 0, 'Admin', ''),
('Accessories', 'cctv stand plastic- normal', 'New', 0.00, 0, 'Admin', ''),
('Accessories', 'cctv stabd aluminium -big', 'New', 0.00, 0, 'Admin', ''),
('Accessories', 'cctv stand 1 feet white steel', 'New', 0.00, 0, 'Admin', ''),
('Accessories', 'rotation stand', 'New', 0.00, 0, 'Admin', ''),
('Accessories', 'safety net box', 'New', 0.00, 0, 'Admin', ''),

-- ---------- NETWORKING ----------
('Networking', 'DIALOG ROUTER OLD', 'New', 0.00, 0, 'Admin', ''),
('Networking', 'DIALOG ROUTER NEW', 'New', 0.00, 0, 'Admin', ''),
('Networking', 'Dialog router full set - NEW', 'New', 0.00, 0, 'Admin', ''),
('Networking', 'Dialog sim only - USED', 'Used', 0.00, 0, 'Admin', ''),
('Networking', 'Dialog sim only - NEW', 'New', 0.00, 0, 'Admin', ''),
('Networking', 'SLT Wifi NEW', 'New', 0.00, 0, 'Admin', ''),
('Networking', 'Wifi switch', 'New', 0.00, 0, 'Admin', ''),
('Networking', 'wifi extender', 'New', 0.00, 0, 'Admin', ''),
('Networking', 'wifi 5ch switch', 'New', 0.00, 0, 'Admin', ''),
('Networking', 'wifi 8ch switch', 'New', 0.00, 0, 'Admin', ''),
('Networking', 'wifi dongle', 'New', 0.00, 0, 'Admin', ''),

-- ---------- MONITOR ----------
('Monitor', '17'' Monitor', 'New', 0.00, 0, 'Admin', ''),
('Monitor', '19'' Monitor', 'New', 0.00, 0, 'Admin', ''),
('Monitor', '22'' Monitor', 'New', 0.00, 0, 'Admin', '');

-- Check the import worked
SELECT category, COUNT(*) AS item_count FROM product GROUP BY category ORDER BY category;
SELECT COUNT(*) AS total_products FROM product;
