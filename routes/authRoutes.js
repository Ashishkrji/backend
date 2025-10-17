// const express = require("express");
// const router = express.Router();
// const bcrypt = require("bcrypt"); // अगर password hash use कर रहे हो
// const Admin = require("../models/Admin"); // Admin model

// // GET login page
// router.get("/login", (req, res) => {
//   res.render("login", { error: null });
// });

// // POST login form
// router.post("/login", async (req, res) => {
//   const { username, password } = req.body;

//   try {
//     const admin = await Admin.findOne({ username });
//     if (!admin) {
//       return res.render("login", { error: "Invalid username or password" });
//     }

//     const isMatch = await bcrypt.compare(password, admin.password);
//     if (!isMatch) {
//       return res.render("login", { error: "Invalid username or password" });
//     }

//     // Save user in session
//     req.session.user = { id: admin._id, name: admin.username };
//     req.session.isAdmin = true;

//     // Redirect to dashboard after login
//     res.redirect("/dashboard");
//   } catch (err) {
//     console.error(err);
//     res.render("login", { error: "Something went wrong. Try again!" });
//   }
// });

// // GET logout
// router.get("/logout", (req, res) => {
//   req.session.destroy((err) => {
//     if (err) console.error(err);
//     res.redirect("/");
//   });
// });

// module.exports = router;

const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const Admin = require("../models/Admin");

// GET login page
router.get("/login", (req, res) => {
  res.render("login", { error: null });
});

// POST login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const admin = await Admin.findOne({ username });
    if (!admin) return res.render("login", { error: "Invalid username or password" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.render("login", { error: "Invalid username or password" });

    req.session.user = { id: admin._id, name: admin.username };
    req.session.isAdmin = true;

    res.redirect("/dashboard");
  } catch (err) {
    console.error(err);
    res.render("login", { error: "Something went wrong. Try again!" });
  }
});

// GET logout
router.get("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) console.error(err);
    res.redirect("/");
  });
});

module.exports = router;
