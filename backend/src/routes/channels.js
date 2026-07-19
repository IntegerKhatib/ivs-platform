import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import ivsService from "../services/ivsService.js";

const router = Router();
router.use(authenticate);

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden: Admins only" });
  next();
};

// GET - Supports ?live=true query param
router.get("/", async (req, res) => {
  const isLive = req.query.live === 'true';
  const result = await ivsService.listChannels(req.query.region || "us-east-1", isLive);
  res.status(result.success ? 200 : 500).json(result);
});

// POST - ADMIN ONLY (Passes tags)
router.post("/", requireAdmin, async (req, res) => {
  const { name, region, tags } = req.body;
  const result = await ivsService.createChannel(region || "us-east-1", name, req.user.name, tags);
  res.status(result.success ? 201 : 500).json(result);
});

// DELETE - ADMIN ONLY
router.delete("/:arn", requireAdmin, async (req, res) => {
  const result = await ivsService.deleteChannel(req.query.region || "us-east-1", decodeURIComponent(req.params.arn));
  res.status(result.success ? 200 : 500).json(result);
});

export default router;
