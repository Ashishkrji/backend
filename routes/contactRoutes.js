const express = require("express");
const router = express.Router();
const Contact = require("../models/Contact");
const { isAdmin } = require("../middleware/authMiddleware");

// Note: dashboard lists contacts; these routes are used by forms / AJAX

// PUT - update contact (edit)
router.put("/:id", isAdmin, async (req, res) => {
  try {
    const { name, email, phone, service, message } = req.body;
    await Contact.findByIdAndUpdate(req.params.id, {
      name,
      email,
      phone,
      service,
      message,
    });
    // for form submit we redirect back to dashboard
    return res.redirect("/dashboard");
  } catch (err) {
    console.error("Contact update error:", err);
    return res.redirect("/dashboard");
  }
});

// PUT - toggle status (this route supports AJAX or redirect)
router.put("/:id/status", isAdmin, async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) return res.status(404).json({ message: "Not found" });
    contact.status = contact.status === "Read" ? "Unread" : "Read";
    await contact.save();
    // if AJAX request: respond JSON
    if (req.xhr || req.headers.accept.indexOf("json") > -1) {
      return res.json({
        message: `Status set to ${contact.status}`,
        status: contact.status,
      });
    }
    return res.redirect("/dashboard");
  } catch (err) {
    console.error("Toggle status error:", err);
    return res.status(500).json({ message: "Error" });
  }
});

// DELETE - delete contact
router.delete("/:id", isAdmin, async (req, res) => {
  try {
    await Contact.findByIdAndDelete(req.params.id);
    return res.redirect("/dashboard");
  } catch (err) {
    console.error("Contact delete error:", err);
    return res.redirect("/dashboard");
  }
});

module.exports = router;
