const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const path = require("path");

// Load .env if present (npm install dotenv  — or set env vars directly)
try { require("dotenv").config(); } catch(e) {}

const app = express();
const PORT = 3000;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ─── Simple in-memory DB ──────────────────────────────────────────────────────
const users = new Map();
const sessions = new Map();

// Seed default demo user
users.set("user@gmail.com", {
  id: "u001",
  name: "Alex Johnson",
  email: "user@gmail.com",
  passwordHash: hashPassword("1234"),
  plan: "Pro",
  createdAt: new Date().toISOString(),
  moodLogs: [],
  journalEntries: [
    { id: 1, date: "Mon, 9 Mar", mood: "🙂", text: "Did the breathing exercise Dr. Shivani suggested. Felt calmer in the afternoon. Need to sleep earlier tonight..." },
    { id: 2, date: "Sun, 8 Mar", mood: "😔", text: "Hard day today. Lots of anxiety in the morning but the meditation helped a bit. Grateful for this platform." }
  ],
  streak: 14,
  sessionsCount: 12,
  wellnessScore: 78,
  anxietyLevel: 32
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function hashPassword(pw) {
  return crypto.createHash("sha256").update(pw + "mindease_salt").digest("hex");
}

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

function getUser(req) {
  const auth = req.headers.authorization || "";
  const token = auth.replace("Bearer ", "").trim();
  if (!token) return null;
  const userId = sessions.get(token);
  if (!userId) return null;
  for (const [, user] of users) {
    if (user.id === userId) return { user, token };
  }
  return null;
}

// ─── AUTH ROUTES ──────────────────────────────────────────────────────────────

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: "Email and password are required" });

  const user = users.get(email.toLowerCase().trim());
  if (!user || user.passwordHash !== hashPassword(password))
    return res.status(401).json({ success: false, message: "Invalid email or password" });

  const token = generateToken();
  sessions.set(token, user.id);

  return res.json({
    success: true,
    message: "Login successful",
    token,
    user: { id: user.id, name: user.name, email: user.email, plan: user.plan }
  });
});

app.post("/signup", (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ success: false, message: "All fields are required" });

  if (password.length < 4)
    return res.status(400).json({ success: false, message: "Password must be at least 4 characters" });

  const key = email.toLowerCase().trim();
  if (users.has(key))
    return res.status(409).json({ success: false, message: "An account with this email already exists" });

  const id = "u" + Date.now();
  const newUser = {
    id, name, email: key,
    passwordHash: hashPassword(password),
    plan: "Free",
    createdAt: new Date().toISOString(),
    moodLogs: [], journalEntries: [],
    streak: 1, sessionsCount: 0, wellnessScore: 60, anxietyLevel: 50
  };
  users.set(key, newUser);

  const token = generateToken();
  sessions.set(token, id);

  return res.status(201).json({
    success: true, message: "Account created successfully", token,
    user: { id, name, email: key, plan: "Free" }
  });
});

app.post("/logout", (req, res) => {
  const auth = req.headers.authorization || "";
  const token = auth.replace("Bearer ", "").trim();
  sessions.delete(token);
  res.json({ success: true, message: "Logged out" });
});

// ─── PROTECTED ROUTES ─────────────────────────────────────────────────────────

app.get("/me", (req, res) => {
  const result = getUser(req);
  if (!result) return res.status(401).json({ success: false, message: "Unauthorized" });
  const { user } = result;
  res.json({
    success: true,
    user: {
      id: user.id, name: user.name, email: user.email, plan: user.plan,
      streak: user.streak, sessionsCount: user.sessionsCount,
      wellnessScore: user.wellnessScore, anxietyLevel: user.anxietyLevel
    }
  });
});

app.post("/mood", (req, res) => {
  const result = getUser(req);
  if (!result) return res.status(401).json({ success: false, message: "Unauthorized" });
  const { emoji, label } = req.body;
  if (!emoji || !label) return res.status(400).json({ success: false, message: "Mood data required" });
  result.user.moodLogs.push({ emoji, label, date: new Date().toISOString() });
  res.json({ success: true, message: `Mood logged: ${emoji} ${label}` });
});

app.get("/mood", (req, res) => {
  const result = getUser(req);
  if (!result) return res.status(401).json({ success: false, message: "Unauthorized" });
  res.json({ success: true, moods: result.user.moodLogs.slice(-7) });
});

app.post("/journal", (req, res) => {
  const result = getUser(req);
  if (!result) return res.status(401).json({ success: false, message: "Unauthorized" });
  const { text, mood } = req.body;
  if (!text) return res.status(400).json({ success: false, message: "Journal text required" });
  const entry = {
    id: Date.now(),
    date: new Date().toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" }),
    mood: mood || "🙂", text, createdAt: new Date().toISOString()
  };
  result.user.journalEntries.unshift(entry);
  res.json({ success: true, message: "Journal entry saved", entry });
});

app.get("/journal", (req, res) => {
  const result = getUser(req);
  if (!result) return res.status(401).json({ success: false, message: "Unauthorized" });
  res.json({ success: true, entries: result.user.journalEntries });
});

app.get("/dashboard-data", (req, res) => {
  const result = getUser(req);
  if (!result) return res.status(401).json({ success: false, message: "Unauthorized" });
  const { user } = result;
  res.json({
    success: true,
    data: {
      name: user.name, plan: user.plan, streak: user.streak,
      sessionsCount: user.sessionsCount, wellnessScore: user.wellnessScore,
      anxietyLevel: user.anxietyLevel,
      recentMoods: user.moodLogs.slice(-7),
      recentJournal: user.journalEntries.slice(0, 2)
    }
  });
});

// ─── Claude AI Proxy ──────────────────────────────────────────────────────────
// Keeps your Anthropic API key safe on the server — never exposed to the browser
app.post("/api/claude", async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not set in environment" });
  }
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Static pages ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "home.html")));

// ─── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅  MindEase server running at http://localhost:${PORT}`);
  console.log(`   Demo login: user@gmail.com / 1234\n`);
});