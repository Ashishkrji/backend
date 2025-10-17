const mongoose = require("mongoose");

const careerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    position: { type: String, required: true },
    message: { type: String, required: true },
    cv: { type: String, required: true },
    status: { type: String, enum: ["Pending", "Reviewed", "Hired"], default: "Pending" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CareerApplication", careerSchema);
