// middleware/authMiddleware.js
module.exports.isAdmin = (req, res, next) => {
  if (req.session?.user) {
    next(); // Logged in
  } else {
    res.redirect("/auth/login"); // Not logged in
  }
};
