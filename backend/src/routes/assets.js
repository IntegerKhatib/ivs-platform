import express from "express";
import { randomUUID } from "node:crypto";
import { authenticate } from "../middleware/auth.js";
import {
  abortMultipartUpload,
  bucket,
  buildObjectKey,
  completeMultipartUpload,
  createMultipartUpload,
  createPartUploadUrls,
  defaultPartSize,
} from "../services/s3.js";
import {
  getAsset,
  listAssets,
  putAsset,
  updateCompletedAsset,
  updateFailedOrCancelledAsset,
} from "../services/dynamodb.js";

const router = express.Router();
router.use(authenticate);

const ALLOWED_METADATA_FIELDS = [
  "assetName",
  "description",
  "notes",
  "tags",
  "category",
  "language",
  "source",
  "productionDate",
  "rightsOwner",
  "rightsExpiryDate",
  "location",
  "externalReference",
  "retentionClass",
];

function sanitizeMetadata(input = {}) {
  const metadata = {};

  for (const field of ALLOWED_METADATA_FIELDS) {
    if (field === "tags") {
      metadata.tags = Array.isArray(input.tags)
        ? input.tags.map((value) => String(value).trim()).filter(Boolean)
        : [];
      continue;
    }

    metadata[field] = String(input[field] ?? "").trim();
  }

  if (!metadata.assetName) {
    throw new Error("Asset name is required.");
  }

  if (!metadata.retentionClass) metadata.retentionClass = "Standard";
  return metadata;
}

function identity(req) {
  return {
    uploadedBy:
      req.user?.name ||
      req.user?.username ||
      req.user?.email ||
      req.user?.sub ||
      "authenticated-user",
    uploadedById: req.user?.id || req.user?.sub || req.user?.email || null,
    organization: req.user?.organization || req.user?.org || null,
  };
}

router.post("/uploads/initiate", async (req, res) => {
  try {
    const fileName = String(req.body?.fileName || "").trim();
    const fileSize = Number(req.body?.fileSize || 0);
    const contentType = String(req.body?.contentType || "application/octet-stream");
    const metadata = sanitizeMetadata(req.body?.metadata || {});

    if (!fileName) return res.status(400).json({ error: "fileName is required." });
    if (!Number.isFinite(fileSize) || fileSize <= 0) {
      return res.status(400).json({ error: "fileSize must be greater than zero." });
    }

    const assetId = randomUUID();
    const objectKey = buildObjectKey(assetId, fileName);
    const uploadId = await createMultipartUpload({
      key: objectKey,
      contentType,
      assetId,
    });

    const now = new Date().toISOString();

    const asset = {
      assetId,

      // User-entered MAM asset metadata
      assetName: metadata.assetName,
      description: metadata.description,
      notes: metadata.notes,
      tags: metadata.tags,
      category: metadata.category,
      language: metadata.language,
      source: metadata.source,
      productionDate: metadata.productionDate,
      rightsOwner: metadata.rightsOwner,
      rightsExpiryDate: metadata.rightsExpiryDate,
      location: metadata.location,
      externalReference: metadata.externalReference,
      retentionClass: metadata.retentionClass,

      // Automatically generated technical and audit metadata
      ...identity(req),
      bucket,
      objectKey,
      s3Uri: `s3://${bucket}/${objectKey}`,
      originalFileName: fileName,
      fileSize,
      contentType,
      uploadId,
      partSize: defaultPartSize,
      status: "UPLOADING",
      createdAt: now,
      updatedAt: now,
    };

    await putAsset(asset);

    res.status(201).json({
      assetId,
      uploadId,
      bucket,
      objectKey,
      partSize: defaultPartSize,
      status: "UPLOADING",
    });
  } catch (error) {
    console.error("MAM initiate upload failed:", error);
    res.status(400).json({
      error: "Unable to initiate asset upload.",
      message: error.message,
    });
  }
});

router.post("/uploads/:assetId/parts", async (req, res) => {
  try {
    const asset = await getAsset(req.params.assetId);
    if (!asset) return res.status(404).json({ error: "Asset not found." });

    const uploadId = String(req.body?.uploadId || "");
    const partNumbers = Array.isArray(req.body?.partNumbers)
      ? req.body.partNumbers.map(Number)
      : [];

    if (!uploadId || uploadId !== asset.uploadId) {
      return res.status(409).json({ error: "Invalid upload session." });
    }

    const parts = await createPartUploadUrls({
      key: asset.objectKey,
      uploadId,
      partNumbers,
    });

    res.json({ assetId: asset.assetId, uploadId, parts });
  } catch (error) {
    console.error("MAM presign parts failed:", error);
    res.status(500).json({ error: "Unable to generate upload URLs.", message: error.message });
  }
});

router.post("/uploads/:assetId/complete", async (req, res) => {
  try {
    const asset = await getAsset(req.params.assetId);
    if (!asset) return res.status(404).json({ error: "Asset not found." });

    const uploadId = String(req.body?.uploadId || "");
    const parts = Array.isArray(req.body?.parts) ? req.body.parts : [];

    if (!uploadId || uploadId !== asset.uploadId) {
      return res.status(409).json({ error: "Invalid upload session." });
    }

    const completed = await completeMultipartUpload({
      key: asset.objectKey,
      uploadId,
      parts,
    });

    const completedAt = new Date().toISOString();
    const updated = await updateCompletedAsset(asset.assetId, {
      completedAt,
      s3Location: `s3://${asset.bucket}/${asset.objectKey}`,
      etag: completed.ETag || null,
      metadata: {
        assetName: asset.assetName,
        description: asset.description,
        notes: asset.notes,
        tags: asset.tags,
        category: asset.category,
        language: asset.language,
        source: asset.source,
        productionDate: asset.productionDate,
        rightsOwner: asset.rightsOwner,
        rightsExpiryDate: asset.rightsExpiryDate,
        location: asset.location,
        externalReference: asset.externalReference,
        retentionClass: asset.retentionClass,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("MAM complete upload failed:", error);
    res.status(500).json({ error: "Unable to complete upload.", message: error.message });
  }
});

router.delete("/uploads/:assetId", async (req, res) => {
  try {
    const asset = await getAsset(req.params.assetId);
    if (!asset) return res.status(404).json({ error: "Asset not found." });

    const uploadId = String(req.body?.uploadId || "");
    if (!uploadId || uploadId !== asset.uploadId) {
      return res.status(409).json({ error: "Invalid upload session." });
    }

    await abortMultipartUpload({ key: asset.objectKey, uploadId });
    await updateFailedOrCancelledAsset(asset.assetId, "CANCELLED");
    res.status(204).end();
  } catch (error) {
    console.error("MAM abort upload failed:", error);
    res.status(500).json({ error: "Unable to cancel upload.", message: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    res.json({ items: await listAssets(req.query.limit) });
  } catch (error) {
    res.status(500).json({ error: "Unable to list assets.", message: error.message });
  }
});

router.get("/:assetId", async (req, res) => {
  try {
    const asset = await getAsset(req.params.assetId);
    if (!asset) return res.status(404).json({ error: "Asset not found." });
    res.json(asset);
  } catch (error) {
    res.status(500).json({ error: "Unable to read asset.", message: error.message });
  }
});

export default router;
