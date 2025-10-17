// run: node createAdmin.js
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Admin = require("./models/Admin");

mongoose
  .connect("mongodb://127.0.0.1:27017/myagency")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

async function createAdmin() {
  const username = "admin";
  const password = "admin123";
  const hashed = await bcrypt.hash(password, 10);
  await Admin.create({ username, password: hashed });
  console.log("Admin created:", username, "/", password);
  mongoose.disconnect();
}
createAdmin();
