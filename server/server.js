require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make sure the images upload folder exists
const imagesDir = path.join(__dirname, "../public/images");
if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

// Serve the frontend (public/) as static files, and uploaded images with it
app.use(express.static(path.join(__dirname, "../public")));

// ----- API routes -----
app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/users", require("./routes/users"));
app.use("/api/activity", require("./routes/activity"));

app.listen(PORT, () => {
  console.log(`🚀 DC Stock Manager server running at http://localhost:${PORT}`);
});
