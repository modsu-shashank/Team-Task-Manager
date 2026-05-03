require("dotenv").config({ path: __dirname + "/.env" });
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const crypto = require("crypto");

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

let cache = global.__mongooseCache || (global.__mongooseCache = { conn: null, promise: null });

async function connectDB() {
  if (cache.conn) return cache.conn;
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI missing");

  if (!cache.promise) {
    cache.promise = mongoose.connect(process.env.MONGO_URI);
  }

  cache.conn = await cache.promise;
  return cache.conn;
}

const getId = (v) => (v && v._id ? v._id.toString() : v ? v.toString() : null);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 }
  },
  { timestamps: true }
);

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    inviteCode: { type: String, required: true, unique: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        role: { type: String, enum: ["Admin", "Member"], default: "Member" }
      }
    ]
  },
  { timestamps: true }
);

const taskSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    dueDate: { type: Date, required: true },
    priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
    status: { type: String, enum: ["To Do", "In Progress", "Done"], default: "To Do" },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);
const Project = mongoose.models.Project || mongoose.model("Project", projectSchema);
const Task = mongoose.models.Task || mongoose.model("Task", taskSchema);

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

const buildUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  token: signToken(user._id)
});

const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.split(" ")[1] : null;

  if (!token) {
    return res.status(401).json({ message: "Not authorized" });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.userId).select("-password");

  if (!user) {
    return res.status(401).json({ message: "User not found" });
  }

  req.user = user;
  next();
});

const ensureProjectAccess = asyncHandler(async (req, res, next) => {
  const projectId = req.params.projectId || req.params.id;
  const project = await Project.findById(projectId)
    .populate("createdBy", "name email")
    .populate("members.user", "name email");

  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }

  const member = project.members.find((m) => getId(m.user) === req.user._id.toString());

  if (!member) {
    return res.status(403).json({ message: "Access denied" });
  }

  req.project = project;
  req.projectRole = member.role;
  next();
});

const adminOnly = (req, res, next) => {
  if (req.projectRole !== "Admin") {
    return res.status(403).json({ message: "Admin only" });
  }
  next();
};

const api = express.Router();

api.use((req, res, next) => {
  connectDB().then(() => next()).catch(next);
});

api.get(["/", "/health"], asyncHandler(async (req, res) => {
  res.json({ message: "API working 🚀" });
}));

api.post("/auth/register", asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const exists = await User.findOne({ email });
  if (exists) {
    return res.status(400).json({ message: "Email already exists" });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashed });

  res.status(201).json(buildUser(user));
}));

api.post("/auth/login", asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  res.json(buildUser(user));
}));

api.get("/auth/me", protect, asyncHandler(async (req, res) => {
  res.json(req.user);
}));

api.get("/projects", protect, asyncHandler(async (req, res) => {
  const projects = await Project.find({ "members.user": req.user._id })
    .populate("createdBy", "name email")
    .populate("members.user", "name email")
    .sort({ createdAt: -1 });

  res.json(projects);
}));

api.post("/projects", protect, asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Project name is required" });
  }

  const inviteCode = crypto.randomBytes(3).toString("hex").toUpperCase();

  const project = await Project.create({
    name,
    description: description || "",
    inviteCode,
    createdBy: req.user._id,
    members: [{ user: req.user._id, role: "Admin" }]
  });

  const populated = await Project.findById(project._id)
    .populate("createdBy", "name email")
    .populate("members.user", "name email");

  res.status(201).json(populated);
}));

api.post("/projects/join", protect, asyncHandler(async (req, res) => {
  const { inviteCode } = req.body;

  if (!inviteCode) {
    return res.status(400).json({ message: "Invite code is required" });
  }

  const project = await Project.findOne({ inviteCode });
  if (!project) {
    return res.status(404).json({ message: "Invalid invite code" });
  }

  const already = project.members.some((m) => getId(m.user) === req.user._id.toString());
  if (!already) {
    project.members.push({ user: req.user._id, role: "Member" });
    await project.save();
  }

  res.json({ message: "Joined project", projectId: project._id });
}));

api.get("/projects/:id", protect, ensureProjectAccess, asyncHandler(async (req, res) => {
  res.json(req.project);
}));

api.post("/projects/:id/members", protect, ensureProjectAccess, adminOnly, asyncHandler(async (req, res) => {
  const { email, role = "Member" } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const exists = req.project.members.some((m) => getId(m.user) === user._id.toString());
  if (exists) {
    return res.status(400).json({ message: "User already a member" });
  }

  req.project.members.push({ user: user._id, role });
  await req.project.save();

  res.json({ message: "Member added" });
}));

api.delete("/projects/:id/members/:userId", protect, ensureProjectAccess, adminOnly, asyncHandler(async (req, res) => {
  req.project.members = req.project.members.filter((m) => getId(m.user) !== req.params.userId);
  await req.project.save();

  res.json({ message: "Member removed" });
}));

api.get("/tasks/project/:projectId", protect, ensureProjectAccess, asyncHandler(async (req, res) => {
  const tasks = await Task.find({ project: req.project._id })
    .populate("assignedTo", "name email")
    .populate("createdBy", "name email")
    .sort({ createdAt: -1 });

  res.json(tasks);
}));

api.post("/tasks/project/:projectId", protect, ensureProjectAccess, asyncHandler(async (req, res) => {
  const { title, description, dueDate, priority, assignedTo } = req.body;

  if (!title || !dueDate) {
    return res.status(400).json({ message: "Title and due date are required" });
  }

  if (assignedTo) {
    if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
      return res.status(400).json({ message: "Invalid assigned user ID" });
    }

    const member = req.project.members.find((m) => getId(m.user) === assignedTo.toString());
    if (!member) {
      return res.status(400).json({ message: "Assigned user must be a project member" });
    }
  }

  const task = await Task.create({
    project: req.project._id,
    title,
    description: description || "",
    dueDate,
    priority: priority || "Medium",
    status: "To Do",
    assignedTo: assignedTo || null,
    createdBy: req.user._id
  });

  const populated = await Task.findById(task._id)
    .populate("assignedTo", "name email")
    .populate("createdBy", "name email");

  res.status(201).json(populated);
}));

api.put("/tasks/:id/project/:projectId", protect, ensureProjectAccess, asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  if (task.project.toString() !== req.project._id.toString()) {
    return res.status(403).json({ message: "Task does not belong to this project" });
  }

  const isAdmin = req.projectRole === "Admin";
  const isAssignee = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();

  if (!isAdmin && !isAssignee) {
    return res.status(403).json({ message: "Not allowed to update this task" });
  }

  const fields = ["title", "description", "dueDate", "priority", "assignedTo"];
  for (const field of fields) {
    if (req.body[field] !== undefined) task[field] = req.body[field];
  }

  if (req.body.assignedTo !== undefined && req.body.assignedTo !== "") {
    const member = req.project.members.find((m) => getId(m.user) === req.body.assignedTo.toString());
    if (!member) {
      return res.status(400).json({ message: "Assigned user must be a project member" });
    }
  }

  await task.save();

  const updated = await Task.findById(task._id)
    .populate("assignedTo", "name email")
    .populate("createdBy", "name email");

  res.json(updated);
}));

api.patch("/tasks/:id/status/project/:projectId", protect, ensureProjectAccess, asyncHandler(async (req, res) => {
  const { status } = req.body;
  const valid = ["To Do", "In Progress", "Done"];

  if (!valid.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const task = await Task.findById(req.params.id);
  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  const isAdmin = req.projectRole === "Admin";
  const isAssignee = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();

  if (!isAdmin && !isAssignee) {
    return res.status(403).json({ message: "Only assignee or admin can update status" });
  }

  task.status = status;
  await task.save();

  const updated = await Task.findById(task._id)
    .populate("assignedTo", "name email")
    .populate("createdBy", "name email");

  res.json(updated);
}));

api.delete("/tasks/:id/project/:projectId", protect, ensureProjectAccess, asyncHandler(async (req, res) => {
  if (req.projectRole !== "Admin") {
    return res.status(403).json({ message: "Admin only" });
  }

  const task = await Task.findById(req.params.id);
  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  await task.deleteOne();
  res.json({ message: "Task deleted" });
}));

api.get("/dashboard/:projectId", protect, ensureProjectAccess, asyncHandler(async (req, res) => {
  const projectId = req.project._id;

  const totalTasks = await Task.countDocuments({ project: projectId });
  const overdueTasks = await Task.countDocuments({
    project: projectId,
    dueDate: { $lt: new Date() },
    status: { $ne: "Done" }
  });

  const byStatus = await Task.aggregate([
    { $match: { project: projectId } },
    { $group: { _id: "$status", count: { $sum: 1 } } }
  ]);

  const tasksPerUser = await Task.aggregate([
    { $match: { project: projectId, assignedTo: { $ne: null } } },
    { $group: { _id: "$assignedTo", count: { $sum: 1 } } },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user"
      }
    },
    { $unwind: "$user" },
    {
      $project: {
        _id: 0,
        userId: "$user._id",
        name: "$user.name",
        email: "$user.email",
        count: 1
      }
    }
  ]);

  const recentTasks = await Task.find({ project: projectId })
    .populate("assignedTo", "name email")
    .sort({ createdAt: -1 })
    .limit(6);

  res.json({
    totalTasks,
    overdueTasks,
    byStatus,
    tasksPerUser,
    recentTasks
  });
}));

app.use("/", api);
app.use("/api", api);

app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || "Server error"
  });
});

module.exports = app;