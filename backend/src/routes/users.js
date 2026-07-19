import { Router } from "express";
import bcrypt from "bcryptjs";
import pool from "../db.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden: Admins only" });
  next();
};

router.get("/", requireAdmin, async (req, res) => {
  try { const r = await pool.query("SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC"); res.json({ success: true, data: r.rows }); }
  catch (err) { res.status(500).json({ error: "Failed to fetch users" }); }
});

router.post("/", requireAdmin, async (req, res) => {
  const { email, password, name, role } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: "Missing fields" });
  try {
    const hash = await bcrypt.hash(password, 10);
    const r = await pool.query("INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role", [email, hash, name, role || 'user']);
    res.status(201).json({ success: true, data: r.rows[0] });
  } catch (err) { res.status(500).json({ error: "Email might already exist" }); }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  if (req.user.id === req.params.id) return res.status(400).json({ error: "Cannot delete yourself" });
  try { await pool.query("DELETE FROM users WHERE id = $1", [req.params.id]); res.json({ success: true, message: "User deleted" }); }
  catch (err) { res.status(500).json({ error: "Failed to delete user" }); }
});
export default router;
