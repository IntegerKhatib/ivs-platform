import pool from "../db.js";
import bcrypt from "bcryptjs";

async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    const res = await pool.query(`SELECT id FROM users WHERE email = 'admin@example.com'`);
    if (res.rowCount === 0) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      await pool.query(`INSERT INTO users (email, password, name, role) VALUES ('admin@example.com', $1, 'Admin User', 'admin')`, [hashedPassword]);
      console.log("✅ Default Admin user created (password: password123)");
    }
  } catch (err) { console.error("DB Init Error:", err.message); }
}
export default initDB;
