const express = require("express");
const router = express.Router();
const Project = require("../models/Project");

// Public portfolio page
router.get("/", async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.render("portfolio", { projects }); // portfolio.ejs render हो रहा है
  } catch (err) {
    console.error("Portfolio error:", err);
    res.render("portfolio", { projects: [] });
  }
});

module.exports = router;
