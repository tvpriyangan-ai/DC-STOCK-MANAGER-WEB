// routes/images.js
// Lists image files already present in public/images (e.g. the 50 product
// images already pushed to GitHub) so the Add/Update Product form can offer
// them in a dropdown instead of requiring a fresh upload each time.

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const requireAuth = require('../middleware/requireAuth');

const imagesDir = path.join(__dirname, '..', '..', 'public', 'images');
const validExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

router.get('/', requireAuth, (req, res) => {
  try {
    fs.mkdirSync(imagesDir, { recursive: true });

    const files = fs
      .readdirSync(imagesDir)
      .filter((f) => validExt.includes(path.extname(f).toLowerCase()))
      .sort();

    res.json(files);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
