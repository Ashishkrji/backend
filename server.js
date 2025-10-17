// ---------------------- IMPORTS ----------------------
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const path = require("path");
const methodOverride = require("method-override");
const cors = require("cors");
const bcrypt = require("bcrypt");
const multer = require("multer");
const fs = require("fs");

// ---------------------- APP INIT ----------------------
const app = express();
const PORT = process.env.PORT || 5000;

// ---------------------- MODELS ----------------------
const Project = require("./models/Project");
const Contact = require("./models/Contact");
const Admin = require("./models/Admin");
const CareerApplication = require("./models/CareerApplication");

// ---------------------- MIDDLEWARES ----------------------
const authMiddleware = require("./middleware/authMiddleware");

// ---------------------- ROUTES ----------------------
const authRoutes = require("./routes/authRoutes");
const contactRoutes = require("./routes/contactRoutes");
const projectRoutes = require("./routes/projectRoutes");
const portfolioRoutes = require("./routes/portfolioRoutes");

// ---------------------- MIDDLEWARE SETUP ----------------------
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(
  session({
    secret: "mysecretkey123",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

// ---------------------- VIEW ENGINE ----------------------
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ---------------------- MONGODB ----------------------
mongoose
  .connect("mongodb://127.0.0.1:27017/myagency", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ---------------------- MULTER SETUP ----------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});
const upload = multer({ storage });

// ---------------------- AUTH ROUTES ----------------------
app.use("/auth", authRoutes);

app.get("/auth/login", (req, res) => res.render("login", { error: null }));

app.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const admin = await Admin.findOne({ username });
    if (!admin)
      return res.render("login", { error: "Invalid username or password" });

    const match = await bcrypt.compare(password, admin.password);
    if (!match)
      return res.render("login", { error: "Invalid username or password" });

    req.session.user = { id: admin._id, name: admin.username };
    res.redirect("/dashboard");
  } catch (err) {
    console.error("Login error:", err);
    res.render("login", { error: "Something went wrong" });
  }
});

app.get("/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error(err);
    res.redirect("/");
  });
});

// ---------------------- API ROUTES ----------------------
// Contact form submit
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, phone, service, message } = req.body;
    if (!name || !email || !phone || !service || !message)
      return res.status(400).json({ message: "All fields are required" });

    await Contact.create({ name, email, phone, service, message });
    res.status(200).json({ message: "Form submitted successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Form submission failed!" });
  }
});

// Career form submit
app.post("/api/career", upload.single("cv"), async (req, res) => {
  try {
    const { name, email, phone, position, message } = req.body;
    if (!name || !email || !phone || !position || !message || !req.file) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newApplication = new CareerApplication({
      name,
      email,
      phone,
      position,
      message,
      cv: req.file.filename,
    });

    await newApplication.save();
    console.log("✅ Career application submitted:", newApplication);
    res.status(201).json({ message: "Application submitted successfully!" });
  } catch (err) {
    console.error("❌ Career submission error:", err);
    res.status(500).json({ message: "Failed to submit application" });
  }
});

// ---------------------- OTHER ROUTES ----------------------
app.use("/contacts", contactRoutes);
app.use("/projects", projectRoutes);
app.use("/portfolio", portfolioRoutes);

// ---------------------- HOME PAGE ----------------------
app.get("/", async (req, res) => {
  try {
    const user = req.session.user || null;
    const projects = await Project.find().sort({ createdAt: -1 });
    res.render("home", { user, projects });
  } catch (err) {
    console.error(err);
    res.render("home", { user: null, projects: [] });
  }
});

// ---------------------- DASHBOARD PAGE ----------------------
app.get("/dashboard", authMiddleware.isAdmin, async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    const projects = await Project.find().sort({ createdAt: -1 });
    const careerApps = await CareerApplication.find().sort({ createdAt: -1 });
    const categories = [
      ...new Set(projects.map((p) => p.category).filter(Boolean)),
    ];

    res.render("dashboard", {
      user: req.session.user,
      contacts,
      projects,
      categories,
      careerApps,
    });
  } catch (err) {
    console.error("❌ Dashboard load error:", err);
    res.render("dashboard", {
      user: req.session.user,
      contacts: [],
      projects: [],
      categories: [],
      careerApps: [],
    });
  }
});

// ---------------------- PROJECTS CRUD ----------------------

// Add project
app.post(
  "/dashboard/projects/add",
  authMiddleware.isAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      const { title, description, websiteUrl, category } = req.body;
      if (!title || !description || !category)
        return res
          .status(400)
          .json({ error: "Title, description, and category are required." });

      const newProject = new Project({
        title,
        description,
        websiteUrl,
        category,
        image: req.file ? req.file.filename : null,
      });

      await newProject.save();
      console.log("✅ Project added:", newProject);
      res.status(200).json(newProject);
    } catch (err) {
      console.error("❌ Error adding project:", err);
      res.status(500).json({ error: "Failed to add project" });
    }
  }
);

// Edit project
app.post(
  "/dashboard/projects/edit/:id",
  authMiddleware.isAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      const project = await Project.findById(req.params.id);
      if (!project) return res.status(404).json({ error: "Project not found" });

      project.title = req.body.title || project.title;
      project.description = req.body.description || project.description;
      project.websiteUrl = req.body.websiteUrl || project.websiteUrl;
      project.category = req.body.category || project.category;

      if (req.file) {
        if (project.image && fs.existsSync(`uploads/${project.image}`)) {
          fs.unlinkSync(`uploads/${project.image}`);
        }
        project.image = req.file.filename;
      }

      await project.save();
      console.log("✅ Project updated:", project);
      res.status(200).json(project);
    } catch (err) {
      console.error("❌ Error updating project:", err);
      res.status(500).json({ error: "Failed to update project" });
    }
  }
);

// Delete project
app.delete(
  "/dashboard/projects/delete/:id",
  authMiddleware.isAdmin,
  async (req, res) => {
    try {
      const project = await Project.findById(req.params.id);
      if (!project) return res.status(404).json({ error: "Project not found" });

      if (project.image && fs.existsSync(`uploads/${project.image}`)) {
        fs.unlinkSync(`uploads/${project.image}`);
      }

      await Project.findByIdAndDelete(req.params.id);
      console.log("🗑️ Project deleted:", project.title);
      res.status(200).json({ message: "Project deleted successfully!" });
    } catch (err) {
      console.error("❌ Error deleting project:", err);
      res.status(500).json({ error: "Failed to delete project" });
    }
  }
);

// Filter projects by category
app.get(
  "/dashboard/category/:category",
  authMiddleware.isAdmin,
  async (req, res) => {
    try {
      const category = req.params.category;
      const contacts = await Contact.find().sort({ createdAt: -1 });
      const projects = await Project.find({ category }).sort({ createdAt: -1 });
      const careerApps = await CareerApplication.find().sort({ createdAt: -1 });
      const categories = [
        ...new Set(
          (await Project.find()).map((p) => p.category).filter(Boolean)
        ),
      ];

      res.render("dashboard", {
        user: req.session.user,
        contacts,
        projects,
        categories,
        careerApps,
        selectedCategory: category,
      });
    } catch (err) {
      console.error("❌ Category filter error:", err);
      res.redirect("/dashboard");
    }
  }
);

// ---------------------- CAREER STATUS UPDATE ----------------------
app.post(
  "/dashboard/careers/update/:id",
  authMiddleware.isAdmin,
  async (req, res) => {
    try {
      const { status } = req.body;
      if (!["Pending", "Reviewed", "Hired"].includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
      }

      const app = await CareerApplication.findById(req.params.id);
      if (!app) return res.status(404).json({ error: "Application not found" });

      app.status = status;
      await app.save();

      console.log(
        `✅ Career application ${app.name} status updated to ${status}`
      );
      res.status(200).json({ message: "Status updated successfully" });
    } catch (err) {
      console.error("❌ Career status update error:", err);
      res.status(500).json({ error: "Failed to update status" });
    }
  }
);

// ---------------------- START SERVER ----------------------
app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);
