# user-profile-manager
Berikut isi **README.md** yang bisa langsung kamu **copy-paste ke GitHub** tanpa emoji dan tanpa format AI:

---

# User Profile Manager

Aplikasi sederhana untuk manajemen pengguna dengan fitur simpan dan tampil data user menggunakan **Node.js + Express + Supabase + EJS**.
Aplikasi ini dibuat sebagai implementasi studi kasus koneksi aplikasi dengan database PostgreSQL di platform **Supabase** dan deploy di **Vercel**.

---

## Alasan Pemilihan Teknologi

* **Supabase** digunakan karena menyediakan database PostgreSQL dan storage dalam satu platform yang mudah diintegrasikan.
* **Express.js** digunakan untuk membuat server sederhana dengan API dan routing dinamis.
* **EJS** digunakan sebagai template engine agar tampilan bisa dibuat dengan HTML dan data bisa langsung ditampilkan dari server.
* **Vercel** digunakan sebagai platform deployment yang mendukung Node.js tanpa konfigurasi kompleks.
* **GitHub** digunakan untuk version control dan integrasi otomatis ke Vercel.

---

## Fitur Aplikasi

1. Form input data pengguna (nama, email, dan foto profil)
2. Penyimpanan data pengguna ke database PostgreSQL di Supabase
3. Upload file foto profil ke Supabase Storage
4. Menampilkan daftar pengguna yang telah disimpan
5. Menggunakan environment variable untuk keamanan koneksi database

---

## Struktur Folder

```
user-profile-manager/
├─ public/
│  └─ style.css
├─ uploads/
├─ views/
│  └─ index.ejs
├─ db.js
├─ server.js
├─ .env
├─ package.json
└─ README.md
```

---

## Langkah Setup

### 1. Install Dependencies

```
npm install
```

### 2. Setup Supabase Database

Buka [https://supabase.com](https://supabase.com) dan buat project baru.
Masuk ke menu **SQL Editor**, lalu jalankan query berikut:

```sql
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'Active' NOT NULL;

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON users FOR INSERT WITH CHECK (true);
```

---

### 3. Setup Supabase Storage

Masuk ke menu **Storage → New bucket**
Nama bucket: `user-uploads`
Centang **Public bucket**

Kemudian di **SQL Editor**, jalankan policy berikut:

```sql
CREATE POLICY "Allow public upload" ON storage.objects
FOR INSERT TO public WITH CHECK (bucket_id = 'user-uploads');

CREATE POLICY "Allow public read" ON storage.objects
FOR SELECT TO public USING (bucket_id = 'user-uploads');
```

---

### 4. Konfigurasi Environment Variables

Buat file `.env` di root folder proyek:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
PORT=3000
```

Ganti `your-anon-key` dengan key dari menu **Settings → API** di dashboard Supabase.

---

### 5. File Konfigurasi Database (`db.js`)

```js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

---

### 6. File Server Utama (`server.js`)

```js
import express from "express";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import { supabase } from "./db.js";

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(process.cwd(), "public")));

const storage = multer.memoryStorage();
const upload = multer({ storage });

// GET: Halaman utama (tampil semua user)
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

// POST: Tambah user baru
app.post("/add", upload.single("photo"), async (req, res) => {
  const { name, email } = req.body;
  const file = req.file;
  let photoUrl = null;

  try {
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

    const { error: insertError } = await supabase
      .from("users")
      .insert([{ name, email, photo_url: photoUrl, status: "Active" }]);

    if (insertError) throw insertError;

    res.json({ success: true });
  } catch (err) {
    console.error("Unexpected server error:", err);
    res.json({ success: false, message: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
```

---

### 7. Tampilan Utama (`views/index.ejs`)

File ini berisi form input pengguna dan daftar user yang sudah disimpan:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>User Management Dashboard</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <header class="header">
    <h1>User Management</h1>
    <p>Add and manage users with profile pictures.</p>
  </header>

  <main class="container">
    <section class="add-user-section">
      <form id="userForm" enctype="multipart/form-data" class="user-form">
        <h2>Add New User</h2>
        <label>Full Name</label>
        <input type="text" name="name" placeholder="Enter full name" required />
        <label>Email Address</label>
        <input type="email" name="email" placeholder="Enter email address" required />
        <label>Profile Photo</label>
        <input type="file" name="photo" id="photo" />
        <div class="form-buttons">
          <button type="submit" class="btn save">Save User</button>
          <button type="reset" class="btn cancel">Cancel</button>
        </div>
      </form>
    </section>

    <section class="team-section">
      <h2>Team Members</h2>
      <p><%= users.length %> total users</p>
      <div class="user-list">
        <% users.forEach(user => { %>
          <div class="user-card">
            <img src="<%= user.photo_url || 'https://via.placeholder.com/80' %>" alt="User Photo" />
            <div class="info">
              <h3><%= user.name %></h3>
              <p><%= user.email %></p>
              <span class="status active">Active</span>
            </div>
          </div>
        <% }) %>
      </div>
    </section>
  </main>

  <script>
    document.getElementById("userForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.target;
      const formData = new FormData(form);
      const response = await fetch("/add", { method: "POST", body: formData });
      const result = await response.json();
      if (result.success) {
        alert("User berhasil ditambahkan!");
        location.reload();
      } else {
        alert("Gagal menambah user: " + (result.message || "Unknown error"));
      }
    });
  </script>
</body>
</html>
```

---

### 8. Jalankan Aplikasi

```
npm run start
```

Buka di browser:

```
http://localhost:3000
```

---

### 9. Deploy ke Vercel

1. Push project ke GitHub
2. Buka [https://vercel.com](https://vercel.com)
3. Import repository dari GitHub
4. Tambahkan environment variables:

   * `SUPABASE_URL`
   * `SUPABASE_KEY`
   * `PORT` (opsional)
5. Klik Deploy

---

### 10. Hasil Akhir

Aplikasi berhasil menampilkan form input, menyimpan data ke Supabase, dan menampilkan daftar user dengan foto profil.
Data dan foto tetap tersimpan walaupun server di-restart karena menggunakan persistent storage dari Supabase.
