// server.js
import express from "express";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import fs from "fs";
import { pool } from "./db.js";

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// Pastikan folder upload ada
if (!fs.existsSync(process.env.STORAGE_PATH)) {
  fs.mkdirSync(process.env.STORAGE_PATH, { recursive: true });
}

// Setup view engine & public folder
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(process.cwd(), "public")));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Setup Multer untuk upload file ke folder uploads/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.STORAGE_PATH);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// 🔹 GET: Halaman utama
app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users ORDER BY created_at DESC");
    res.render("index", { users: result.rows });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.render("index", { users: [] });
  }
});

// 🔹 POST: Tambah user baru
app.post("/add", upload.single("photo"), async (req, res) => {
  const { name, email } = req.body;
  const photo = req.file ? req.file.filename : null;

  try {
    await pool.query(
      "INSERT INTO users (name, email, photo_url, status, created_at) VALUES ($1, $2, $3, $4, NOW())",
      [name, email, photo, "Active"]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Database insert error:", err.message);
    res.json({ success: false, message: err.message });
  }
});

// Jalankan server
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});