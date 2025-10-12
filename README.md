# User Profile Manager  
Aplikasi sederhana untuk manajemen pengguna dengan fitur simpan dan tampil data user menggunakan **Node.js + Express + PostgreSQL (Railway)**.  

---
## 1. Fitur 

1. Form input data pengguna (nama, email, dan foto profil)
2. Simpan data ke PostgreSQL di Railway
3. Upload foto profil ke storage lokal (persisten)
4. Menampilkan daftar pengguna dari database
5. Kolom `status` otomatis `'Active'`
6. Kolom `created_at` otomatis waktu saat data disimpan
---

## 2. Struktur Folder 

```

user-profile-manager/
├─ uploads/
├─ views/
│  └─ index.ejs
│  └─ style.css
├─ db.js
├─ server.js
├─ .env
├─ package.json
└─ README.md

```

---

## 3. Setup Database PostgreSQL di Railway

1. Masuk ke [https://railway.app](https://railway.app)
2. Buat project baru → pilih template **PostgreSQL**
3. Setelah database aktif, buka tab **Connect**
4. Salin **connection string** (jangan dibagikan ke publik!)
5. Simpan di file `.env` seperti berikut:

```

DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<database>
STORAGE_PATH=./storage
PORT=3000

````

---

## 4. Struktur Tabel Database

Masuk ke SQL Editor Railway, lalu jalankan perintah berikut:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  photo_url TEXT,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT NOW()
);
````

Untuk melihat tabel:

```sql
\d users;
```

Contoh hasil:

```
 Column     | Type                     | Default
-------------+--------------------------+------------------------
 id          | integer                  | nextval('users_id_seq')
 name        | text                     |
 email       | text                     |
 photo_url   | text                     |
 status      | text                     | 'Active'
 created_at  | timestamp without time zone | now()
```

---
## 5. File `db.js`

```js
import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
```

---

## 6. File `server.js`

```js
import express from "express";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import { pool } from "./db.js";
import fs from "fs";

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;
const storagePath = process.env.STORAGE_PATH || "./storage";

// Buat folder storage jika belum ada
if (!fs.existsSync(storagePath)) fs.mkdirSync(storagePath);

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, storagePath),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// GET: tampil semua user
app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users ORDER BY id ASC");
    res.render("index", { users: result.rows });
  } catch (err) {
    console.error("Error:", err);
    res.render("index", { users: [] });
  }
});

// POST: tambah user baru
app.post("/add", upload.single("photo"), async (req, res) => {
  const { name, email } = req.body;
  const photo_url = req.file ? req.file.filename : null;

  try {
    await pool.query(
      "INSERT INTO users (name, email, photo_url, status, created_at) VALUES ($1, $2, $3, 'Active', NOW())",
      [name, email, photo_url]
    );
    res.redirect("/");
  } catch (err) {
    console.error("Error inserting data:", err);
    res.send("Gagal menambah user");
  }
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
```

---

## 7. File Tampilan (`views/index.ejs`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>User Dashboard</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <header>
    <h1>User Management (Railway)</h1>
  </header>

  <main>
    <form action="/add" method="POST" enctype="multipart/form-data">
      <h2>Add User</h2>
      <label>Name</label>
      <input type="text" name="name" required>
      <label>Email</label>
      <input type="email" name="email" required>
      <label>Photo</label>
      <input type="file" name="photo">
      <button type="submit">Save</button>
    </form>

    <h2>List of Users</h2>
    <table border="1">
      <tr>
        <th>ID</th><th>Name</th><th>Email</th><th>Photo</th><th>Status</th><th>Created</th>
      </tr>
      <% users.forEach(user => { %>
      <tr>
        <td><%= user.id %></td>
        <td><%= user.name %></td>
        <td><%= user.email %></td>
        <td>
          <% if (user.photo_url) { %>
            <img src="/../storage/<%= user.photo_url %>" width="60" height="60">
          <% } else { %>
            No Photo
          <% } %>
        </td>
        <td><%= user.status %></td>
        <td><%= user.created_at %></td>
      </tr>
      <% }) %>
    </table>
  </main>
</body>
</html>
```

---

## 8. Jalankan Aplikasi

```bash
npm install
npm start
```

Lalu buka browser ke:

```
http://localhost:3000
```

Jika koneksi berhasil, terminal akan menampilkan:

```
✅ Database connected successfully
```

---
## 9. Deployment (Opsional)

1. Push proyek ke GitHub
2. Buka Railway → buat proyek baru → hubungkan ke repo GitHub
3. Railway otomatis mendeteksi Node.js dan akan menjalankan `npm start`
4. Tambahkan environment variable dari `.env`
5. Tunggu hingga status **Deployed ✅**