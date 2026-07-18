import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const getUsers = () => JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "users.json"), "utf-8"));

router.post("/login", async (req, res) => {
  const user = getUsers().find(u => u.email === req.body.email);
  if (!user || !(await bcrypt.compare(req.body.password, user.password))) return res.status(401).json({ error: "Invalid creds" });
  const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, process.env.JWT_SECRET, { expiresIn: "24h" });
  res.json({ success: true, data: { token, user: { id: user.id, email: user.email, name: user.name } } });
});
export default router;
