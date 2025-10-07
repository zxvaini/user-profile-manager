// server.js
import express from "express";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import { supabase } from "./db.js";

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// Setup view engine & public folder
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // untuk handle JSON request
app.use(express.static(path.join(process.cwd(), "public"))); // pastikan folder public terbaca

// Setup Multer untuk upload file ke memory
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 🔹 GET: Halaman utama (form + daftar user)
app.get("/", async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching users:", error.message);
      return res.render("index", { users: [] });
    }

    res.render("index", { users: users || [] });
  } catch (err) {
    console.error("Unexpected error:", err);
    res.render("index", { users: [] });
  }
});

// 🔹 POST: Tambah user baru (tanpa redirect)
app.post("/add", upload.single("photo"), async (req, res) => {
  const { name, email } = req.body;
  const file = req.file;
  let photoUrl = null;

  try {
    // Upload foto ke Supabase Storage (jika ada)
    if (file) {
      const fileName = `${Date.now()}-${file.originalname}`;
      const { error: uploadError } = await supabase.storage
        .from("user-uploads")
        .upload(`avatars/${fileName}`, file.buffer, {
          contentType: file.mimetype,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("user-uploads")
        .getPublicUrl(`avatars/${fileName}`);

      photoUrl = publicUrlData.publicUrl;
    }

    // Simpan ke tabel users
    const { error: insertError } = await supabase
      .from("users")
      .insert([{ name, email, photo_url: photoUrl, status: "Active" }]);

    if (insertError) throw insertError;

    // Kirim respon JSON tanpa reload halaman
    res.json({ success: true });
  } catch (err) {
    console.error("Unexpected server error:", err);
    res.json({ success: false, message: err.message });
  }
});

// Jalankan server
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});