// db.js
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Test koneksi
pool.connect()
  .then(() => console.log("✅ Connected to Railway PostgreSQL"))
  .catch(err => console.error("❌ Connection error:", err.message));