const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    websiteUrl: String,
    image: String,
    category: { type: String, required: true }, // ✅ Added field
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);
