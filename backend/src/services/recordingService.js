import {
  GetBucketLocationCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  CreateRecordingConfigurationCommand,
  DeleteRecordingConfigurationCommand,
  GetRecordingConfigurationCommand,
  ListRecordingConfigurationsCommand,
} from "@aws-sdk/client-ivs";
import { createIVSClient, createS3Client } from "../config/aws.js";

export const RECORDING_BUCKET = "awsivs-emp-platform-950363885603";
export const RECORDING_REGION = "eu-west-1";
export const IVS_RECORDING_ROOT = "ivs/v1/";
const RECORDING_CONFIGURATION_NAME = "EMP-S3-Recording";

const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

function normalizePrefix(prefix = "") {
  const value = String(prefix)
    .replace(/^\/+/, "")
    .replace(/\.\.+/g, "")
    .replace(/\/+/g, "/");

  if (!value) return "";
  return value.endsWith("/") ? value : `${value}/`;
}

function normalizeBucketRegion(locationConstraint) {
  return locationConstraint || "us-east-1";
}

export async function validateRecordingBucket() {
  const s3 = createS3Client(RECORDING_REGION);
  const response = await s3.send(
    new GetBucketLocationCommand({
      Bucket: RECORDING_BUCKET,
    }),
  );

  const actualRegion = normalizeBucketRegion(response.LocationConstraint);

  if (actualRegion !== RECORDING_REGION) {
    throw new Error(
      `Recording bucket ${RECORDING_BUCKET} is in ${actualRegion}, but ${RECORDING_REGION} is required.`,
    );
  }

  return {
    bucketName: RECORDING_BUCKET,
    region: RECORDING_REGION,
  };
}

async function listAllRecordingConfigurations(client) {
  const configurations = [];
  let nextToken;

  do {
    const response = await client.send(
      new ListRecordingConfigurationsCommand({
        maxResults: 50,
        nextToken,
      }),
    );

    configurations.push(...(response.recordingConfigurations || []));
    nextToken = response.nextToken;
  } while (nextToken);

  return configurations;
}

async function waitForRecordingConfiguration(
  client,
  arn,
  { maxAttempts = 30, intervalMilliseconds = 2000 } = {},
) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await client.send(
      new GetRecordingConfigurationCommand({ arn }),
    );

    const configuration = response.recordingConfiguration;

    if (!configuration) {
      throw new Error("IVS did not return the recording configuration.");
    }

    if (configuration.state === "ACTIVE") {
      return configuration;
    }

    if (configuration.state === "CREATE_FAILED") {
      throw new Error(
        "The IVS recording configuration entered CREATE_FAILED. Verify the S3 destination and IVS service-linked role.",
      );
    }

    console.log(
      `Recording configuration ${arn} is ${configuration.state}; waiting (${attempt}/${maxAttempts})...`,
    );

    await sleep(intervalMilliseconds);
  }

  throw new Error(
    "Timed out waiting for the IVS recording configuration to become ACTIVE.",
  );
}

async function deleteFailedConfiguration(client, configuration) {
  if (configuration?.state !== "CREATE_FAILED" || !configuration?.arn) {
    return;
  }

  console.warn(
    `Deleting failed IVS recording configuration: ${configuration.arn}`,
  );

  await client.send(
    new DeleteRecordingConfigurationCommand({
      arn: configuration.arn,
    }),
  );
}

export async function ensureRecordingConfiguration() {
  await validateRecordingBucket();

  const client = createIVSClient(RECORDING_REGION);
  const configurations = await listAllRecordingConfigurations(client);

  const matchingConfigurations = configurations.filter(
    (configuration) =>
      configuration.destinationConfiguration?.s3?.bucketName ===
      RECORDING_BUCKET,
  );

  const activeConfiguration = matchingConfigurations.find(
    (configuration) => configuration.state === "ACTIVE",
  );

  if (activeConfiguration?.arn) {
    return activeConfiguration.arn;
  }

  const creatingConfiguration = matchingConfigurations.find(
    (configuration) => configuration.state === "CREATING",
  );

  if (creatingConfiguration?.arn) {
    const configuration = await waitForRecordingConfiguration(
      client,
      creatingConfiguration.arn,
    );

    return configuration.arn;
  }

  for (const configuration of matchingConfigurations) {
    await deleteFailedConfiguration(client, configuration);
  }

  const response = await client.send(
    new CreateRecordingConfigurationCommand({
      name: RECORDING_CONFIGURATION_NAME,
      destinationConfiguration: {
        s3: {
          bucketName: RECORDING_BUCKET,
        },
      },
      recordingReconnectWindowSeconds: 60,
      renditionConfiguration: {
        renditionSelection: "ALL",
      },
      thumbnailConfiguration: {
        recordingMode: "DISABLED",
      },
    }),
  );

  const createdConfiguration = response.recordingConfiguration;

  if (!createdConfiguration?.arn) {
    throw new Error("IVS did not return a recording-configuration ARN.");
  }

  const activeConfigurationResult = await waitForRecordingConfiguration(
    client,
    createdConfiguration.arn,
  );

  return activeConfigurationResult.arn;
}

export async function listObjects({ prefix = "" } = {}) {
  const normalizedPrefix = normalizePrefix(prefix);
  const s3 = createS3Client(RECORDING_REGION);

  const response = await s3.send(
    new ListObjectsV2Command({
      Bucket: RECORDING_BUCKET,
      Prefix: normalizedPrefix,
      Delimiter: "/",
      MaxKeys: 1000,
    }),
  );

  const folders = (response.CommonPrefixes || []).map((entry) => ({
    prefix: entry.Prefix,
    key: entry.Prefix,
    name: entry.Prefix.slice(normalizedPrefix.length).replace(/\/$/, ""),
  }));

  const files = (response.Contents || [])
    .filter((object) => object.Key !== normalizedPrefix)
    .map((object) => ({
      key: object.Key,
      name: object.Key.slice(normalizedPrefix.length),
      size: object.Size || 0,
      lastModified: object.LastModified || null,
      storageClass: object.StorageClass || null,
    }));

  return {
    bucketName: RECORDING_BUCKET,
    region: RECORDING_REGION,
    prefix: normalizedPrefix,
    folders,
    files,
    // Keep this alias for backward compatibility with older frontends.
    objects: files,
    isTruncated: Boolean(response.IsTruncated),
  };
}

async function listAllObjects(prefix = IVS_RECORDING_ROOT) {
  const s3 = createS3Client(RECORDING_REGION);
  const objects = [];
  let continuationToken;

  do {
    const response = await s3.send(
      new ListObjectsV2Command({
        Bucket: RECORDING_BUCKET,
        Prefix: normalizePrefix(prefix),
        MaxKeys: 1000,
        ContinuationToken: continuationToken,
      }),
    );

    objects.push(...(response.Contents || []));
    continuationToken = response.IsTruncated
      ? response.NextContinuationToken
      : undefined;
  } while (continuationToken);

  return objects;
}

function sessionStartFromPath(parts) {
  const [year, month, day, hour, minute] = parts.slice(4, 9);
  if (![year, month, day, hour, minute].every(Boolean)) return null;

  const value = new Date(
    `${year}-${month}-${day}T${hour}:${minute}:00.000Z`,
  );

  return Number.isNaN(value.getTime()) ? null : value.toISOString();
}

function chooseManifest(files) {
  return (
    files.find((file) => /\/media\/hls\/master\.m3u8$/i.test(file.key)) ||
    files.find((file) => /master\.m3u8$/i.test(file.key)) ||
    files.find((file) => /\.m3u8$/i.test(file.key)) ||
    null
  );
}

export async function listRecordingSessions() {
  const objects = await listAllObjects(IVS_RECORDING_ROOT);
  const sessionsByPrefix = new Map();

  for (const object of objects) {
    const parts = String(object.Key || "").split("/").filter(Boolean);

    // ivs/v1/account/channel/YYYY/MM/DD/HH/mm/recording-id/...
    if (parts.length < 10 || parts[0] !== "ivs" || parts[1] !== "v1") {
      continue;
    }

    const sessionParts = parts.slice(0, 10);
    const sessionPrefix = `${sessionParts.join("/")}/`;

    if (!sessionsByPrefix.has(sessionPrefix)) {
      sessionsByPrefix.set(sessionPrefix, {
        prefix: sessionPrefix,
        accountId: parts[2],
        channelId: parts[3],
        recordingId: parts[9],
        startedAt: sessionStartFromPath(parts),
        files: [],
      });
    }

    sessionsByPrefix.get(sessionPrefix).files.push({
      key: object.Key,
      name: object.Key.slice(sessionPrefix.length),
      size: Number(object.Size || 0),
      lastModified: object.LastModified || null,
      storageClass: object.StorageClass || null,
    });
  }

  const sessions = [...sessionsByPrefix.values()].map((session) => {
    const manifest = chooseManifest(session.files);
    const endedFile = session.files.find((file) =>
      /recording-ended\.json$/i.test(file.key),
    );
    const startedFile = session.files.find((file) =>
      /recording-started\.json$/i.test(file.key),
    );
    const totalSize = session.files.reduce(
      (sum, file) => sum + Number(file.size || 0),
      0,
    );
    const latestModified = session.files.reduce((latest, file) => {
      if (!file.lastModified) return latest;
      const value = new Date(file.lastModified);
      return !latest || value > latest ? value : latest;
    }, null);

    return {
      prefix: session.prefix,
      accountId: session.accountId,
      channelId: session.channelId,
      recordingId: session.recordingId,
      startedAt:
        startedFile?.lastModified ||
        session.startedAt ||
        session.files[0]?.lastModified ||
        null,
      endedAt: endedFile?.lastModified || null,
      lastModified: latestModified || null,
      status: endedFile ? "COMPLETED" : "RECORDING",
      fileCount: session.files.length,
      totalSize,
      manifestKey: manifest?.key || null,
      metadataKey: endedFile?.key || startedFile?.key || null,
    };
  });

  sessions.sort((a, b) => {
    const aTime = new Date(a.startedAt || a.lastModified || 0).getTime();
    const bTime = new Date(b.startedAt || b.lastModified || 0).getTime();
    return bTime - aTime;
  });

  return {
    bucketName: RECORDING_BUCKET,
    region: RECORDING_REGION,
    rootPrefix: IVS_RECORDING_ROOT,
    sessions,
    summary: {
      totalSessions: sessions.length,
      activeSessions: sessions.filter(
        (session) => session.status === "RECORDING",
      ).length,
      completedSessions: sessions.filter(
        (session) => session.status === "COMPLETED",
      ).length,
      totalSize: sessions.reduce(
        (sum, session) => sum + Number(session.totalSize || 0),
        0,
      ),
      totalFiles: sessions.reduce(
        (sum, session) => sum + Number(session.fileCount || 0),
        0,
      ),
    },
  };
}

export async function createFolder({ prefix = "", folderName }) {
  const cleanFolderName = String(folderName || "")
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replace(/\.\.+/g, "")
    .replace(/\/+/g, "-");

  if (!cleanFolderName) {
    throw new Error("Folder name is required.");
  }

  const key = `${normalizePrefix(prefix)}${cleanFolderName}/`;
  const s3 = createS3Client(RECORDING_REGION);

  await s3.send(
    new PutObjectCommand({
      Bucket: RECORDING_BUCKET,
      Key: key,
      Body: "",
      ContentType: "application/x-directory",
    }),
  );

  return {
    bucketName: RECORDING_BUCKET,
    region: RECORDING_REGION,
    key,
  };
}

export async function createDownloadUrl({ key }) {
  if (!key) {
    throw new Error("Recording object key is required.");
  }

  const s3 = createS3Client(RECORDING_REGION);
  const filename = String(key).split("/").pop() || "recording";

  const command = new GetObjectCommand({
    Bucket: RECORDING_BUCKET,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${filename}"`,
  });

  return getSignedUrl(s3, command, {
    expiresIn: 900,
  });
}
