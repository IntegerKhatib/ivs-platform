import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

const region = process.env.MAMBRIDGE_AWS_REGION || process.env.AWS_REGION || "eu-central-1";
const rawClient = new DynamoDBClient({ region });

const client = DynamoDBDocumentClient.from(rawClient, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: false,
  },
});

export const tableName = process.env.MAMBRIDGE_DYNAMODB_TABLE || "MAMBridgeAssets";

export async function putAsset(asset) {
  await client.send(
    new PutCommand({
      TableName: tableName,
      Item: asset,
      ConditionExpression: "attribute_not_exists(assetId)",
    }),
  );
  return asset;
}

export async function getAsset(assetId) {
  const result = await client.send(
    new GetCommand({
      TableName: tableName,
      Key: { assetId },
    }),
  );
  return result.Item || null;
}

export async function updateCompletedAsset(assetId, values) {
  const result = await client.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { assetId },
      UpdateExpression: [
        "SET #status = :status",
        "completedAt = :completedAt",
        "updatedAt = :updatedAt",
        "s3Location = :s3Location",
        "etag = :etag",
        "metadata = :metadata",
      ].join(", "),
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":status": "COMPLETED",
        ":completedAt": values.completedAt,
        ":updatedAt": values.completedAt,
        ":s3Location": values.s3Location,
        ":etag": values.etag || null,
        ":metadata": values.metadata || {},
      },
      ReturnValues: "ALL_NEW",
    }),
  );
  return result.Attributes;
}

export async function updateFailedOrCancelledAsset(assetId, status) {
  const now = new Date().toISOString();
  const result = await client.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { assetId },
      UpdateExpression: "SET #status = :status, updatedAt = :updatedAt",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":status": status,
        ":updatedAt": now,
      },
      ReturnValues: "ALL_NEW",
    }),
  );
  return result.Attributes;
}

export async function listAssets(limit = 100) {
  const result = await client.send(
    new ScanCommand({
      TableName: tableName,
      Limit: Math.min(Math.max(Number(limit) || 100, 1), 250),
    }),
  );
  return (result.Items || []).sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
  );
}

export async function deleteAssetRecord(assetId) {
  await client.send(
    new DeleteCommand({
      TableName: tableName,
      Key: { assetId },
    }),
  );
}
