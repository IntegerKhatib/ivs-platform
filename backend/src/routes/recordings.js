import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import {
  createDownloadUrl,
  createFolder,
  IVS_RECORDING_ROOT,
  listObjects,
  listRecordingSessions,
  RECORDING_BUCKET,
  RECORDING_REGION,
  validateRecordingBucket,
} from "../services/recordingService.js";

const router = Router();
router.use(authenticate);

const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, error: "Admins only." });
  }
  next();
};

router.get("/storage", async (_req, res) => {
  try {
    await validateRecordingBucket();
    res.json({
      success: true,
      data: {
        bucketName: RECORDING_BUCKET,
        region: RECORDING_REGION,
        rootPrefix: IVS_RECORDING_ROOT,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get("/sessions", async (_req, res) => {
  try {
    const data = await listRecordingSessions();
    res.json({ success: true, data });
  } catch (error) {
    console.error("Failed to load recording sessions:", error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get("/objects", async (req, res) => {
  try {
    const data = await listObjects({ prefix: req.query.prefix || "" });
    res.json({ success: true, data });
  } catch (error) {
    console.error("Failed to browse recording objects:", error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post("/folders", requireAdmin, async (req, res) => {
  try {
    const data = await createFolder({
      prefix: req.body.prefix || "",
      folderName: req.body.folderName,
    });
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post("/download", async (req, res) => {
  try {
    const url = await createDownloadUrl({ key: req.body.key });
    res.json({ success: true, data: { url, expiresInSeconds: 900 } });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
