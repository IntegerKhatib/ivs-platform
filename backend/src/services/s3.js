import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { UploadPartCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const region = process.env.MAMBRIDGE_AWS_REGION || process.env.AWS_REGION || "eu-central-1";
const client = new S3Client({ region });

export const bucket = process.env.MAMBRIDGE_BUCKET || "busbybucket";
export const uploadPrefix = (process.env.MAMBRIDGE_UPLOAD_PREFIX || "uploads").replace(/^\/+|\/+$/g, "");
export const defaultPartSize = Number(process.env.MAMBRIDGE_PART_SIZE || 64 * 1024 * 1024);

export function safeFileName(fileName = "asset.bin") {
  const cleaned = String(fileName)
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^[_\.]+|[_\.]+$/g, "");
  return cleaned || "asset.bin";
}

export function buildObjectKey(assetId, fileName) {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  return `${uploadPrefix}/${yyyy}/${mm}/${dd}/${assetId}/${safeFileName(fileName)}`;
}

export async function createMultipartUpload({ key, contentType, assetId }) {
  const response = await client.send(
    new CreateMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType || "application/octet-stream",
      ServerSideEncryption: "AES256",
      Metadata: {
        "asset-id": assetId,
        "managed-by": "emp-mambridge",
      },
    }),
  );

  if (!response.UploadId) {
    throw new Error("Amazon S3 did not return a multipart upload ID.");
  }

  return response.UploadId;
}

export async function createPartUploadUrls({ key, uploadId, partNumbers }) {
  const expiresIn = Number(process.env.MAMBRIDGE_PRESIGNED_URL_TTL || 3600);

  return Promise.all(
    partNumbers.map(async (partNumber) => {
      const url = await getSignedUrl(
        client,
        new UploadPartCommand({
          Bucket: bucket,
          Key: key,
          UploadId: uploadId,
          PartNumber: partNumber,
        }),
        { expiresIn },
      );

      return { partNumber, url };
    }),
  );
}

export async function completeMultipartUpload({ key, uploadId, parts }) {
  const normalizedParts = [...parts]
    .map((part) => ({
      ETag: String(part.etag || part.ETag || "").replace(/^"|"$/g, ""),
      PartNumber: Number(part.partNumber || part.PartNumber),
    }))
    .sort((a, b) => a.PartNumber - b.PartNumber);

  if (!normalizedParts.length || normalizedParts.some((part) => !part.ETag || !part.PartNumber)) {
    throw new Error("The uploaded-part list is incomplete.");
  }

  return client.send(
    new CompleteMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: normalizedParts,
      },
    }),
  );
}

export async function abortMultipartUpload({ key, uploadId }) {
  await client.send(
    new AbortMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      UploadId: uploadId,
    }),
  );
}
