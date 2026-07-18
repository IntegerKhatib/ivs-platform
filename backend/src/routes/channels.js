import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import ivsService from "../services/ivsService.js";
const router = Router();
router.use(authenticate);

router.post("/", async (req, res) => {
  const result = await ivsService.createChannel(req.body.region || "us-east-1", req.body.name, req.user.id);
  res.status(result.success ? 201 : 500).json(result);
});

router.get("/", async (req, res) => {
  const result = await ivsService.listChannels(req.query.region || "us-east-1");
  res.status(result.success ? 200 : 500).json(result);
});

router.delete("/:arn", async (req, res) => {
  const result = await ivsService.deleteChannel(req.query.region || "us-east-1", decodeURIComponent(req.params.arn));
  res.status(result.success ? 200 : 500).json(result);
});
export default router;
