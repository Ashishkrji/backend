const express = require("express");
const router = express.Router();
const multer = require("multer");
const methodOverride = require("method-override");

// Model
const Portfolio = require("../models/Portfolio");

// File upload setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  }
});
const upload = multer({ storage });

// Method override
router.use(methodOverride("_method"));

// ------------------ Routes ------------------

// Add new portfolio
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { title, description, website } = req.body;
    const image = req.file ? req.file.filename : null;

    await Portfolio.create({ title, description, website, image });
    res.redirect("/dashboard");
  } catch (err) {
    console.error(err);
    res.status(500).send("Portfolio creation failed");
  }
});

// Update portfolio
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { title, description, website } = req.body;
    const updateData = { title, description, website };
    if (req.file) updateData.image = req.file.filename;

    await Portfolio.findByIdAndUpdate(req.params.id, updateData);
    res.redirect("/dashboard");
  } catch (err) {
    console.error(err);
    res.status(500).send("Portfolio update failed");
  }
});

// Delete portfolio
router.delete("/:id", async (req, res) => {
  try {
    await Portfolio.findByIdAndDelete(req.params.id);
    res.redirect("/dashboard");
  } catch (err) {
    console.error(err);
    res.status(500).send("Portfolio deletion failed");
  }
});

module.exports = router;
