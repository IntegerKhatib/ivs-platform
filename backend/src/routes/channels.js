import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import ivsService from "../services/ivsService.js";
import { getMonitoring } from "../services/monitoringService.js";
import { RECORDING_REGION } from "../services/recordingService.js";

const router = Router();
router.use(authenticate);

const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admins only" });
  }
  next();
};

router.get("/monitoring", async (req, res) => {
  try {
    const data = await getMonitoring(req.query.region || "us-east-1");
    res.json({ success: true, data });
  } catch (error) {
    console.error("Monitoring endpoint failed:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Unable to retrieve monitoring data",
    });
  }
});

router.get("/metrics", async (req, res) => {
  const result = await ivsService.getOperationalMetrics(
    req.query.region || "us-east-1",
  );
  res.status(result.success ? 200 : 500).json(result);
});

router.get("/", async (req, res) => {
  const result = await ivsService.listChannels(
    req.query.region || "us-east-1",
    req.query.live === "true",
  );
  res.status(result.success ? 200 : 500).json(result);
});

router.post("/", requireAdmin, async (req, res) => {
  const {
    name,
    region = "us-east-1",
    type = "STANDARD",
    latencyMode = "LOW",
    tags = {},
    autoRecord = false,
  } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({
      success: false,
      error: "Channel name is required.",
    });
  }

  if (autoRecord && region !== RECORDING_REGION) {
    return res.status(400).json({
      success: false,
      error:
        "Auto-recording is available only for channels created in eu-west-1.",
    });
  }

  const result = await ivsService.createChannel({
    region,
    name: name.trim(),
    adminName: req.user.name || req.user.username,
    type,
    latencyMode,
    customTags: tags,
    autoRecord: Boolean(autoRecord),
  });
  res.status(result.success ? 201 : 400).json(result);
});

router.delete("/:arn", requireAdmin, async (req, res) => {
  const result = await ivsService.deleteChannel(
    req.query.region || "us-east-1",
    decodeURIComponent(req.params.arn),
  );
  res.status(result.success ? 200 : 500).json(result);
});

export default router;
