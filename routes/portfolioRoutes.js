const express = require("express");
const router = express.Router();
const Project = require("../models/Project"); // या Portfolio model use करो अगर अलग है
const multer = require("multer");
const path = require("path");

// Multer setup for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Get all projects / portfolio
router.get("/", async (req, res) => {
  const projects = await Project.find().sort({ createdAt: -1 });
  res.render("portfolio", { projects });
});

// Add new project (admin dashboard)
router.post("/", upload.single("image"), async (req, res) => {
  const { title, description, website } = req.body;
  const image = req.file ? req.file.filename : null;
  await Project.create({ title, description, website, image });
  res.redirect("/dashboard");
});

// Update project
router.put("/:id", upload.single("image"), async (req, res) => {
  const { title, description, website } = req.body;
  const updateData = { title, description, website };
  if (req.file) updateData.image = req.file.filename;
  await Project.findByIdAndUpdate(req.params.id, updateData);
  res.redirect("/dashboard");
});

// Delete project
router.delete("/:id", async (req, res) => {
  await Project.findByIdAndDelete(req.params.id);
  res.redirect("/dashboard");
});

module.exports = router;
