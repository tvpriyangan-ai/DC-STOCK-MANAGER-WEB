// server.js
// DC STOCK MANAGER - Web/Mobile Version
// Serves the frontend (public/) and the JSON API that replicates
// database_functions.py's DatabaseFunctions class.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const userRoutes = require('./routes/users');
const activityRoutes = require('./routes/activity');
const imageRoutes = require('./routes/images');
const customerBillsRoutes = require('./routes/customerBills');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the frontend
// NOTE: in this repo, "public" sits next to "server" (not inside it),
// so we go up one level from this file's folder to find it.
app.use(express.static(path.join(__dirname, '..', 'public')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/customer-bills', customerBillsRoutes);

app.listen(PORT, () => {
  console.log(`DC STOCK MANAGER running at http://localhost:${PORT}`);
});
