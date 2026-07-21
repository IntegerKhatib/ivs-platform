import { IvsClient } from "@aws-sdk/client-ivs";
import { S3Client } from "@aws-sdk/client-s3";

/**
 * AWS SDK clients intentionally do not receive static credentials.
 * The SDK uses its default credential provider chain, including the
 * EC2 instance profile attached to the server.
 */
export function createIVSClient(region = process.env.IVS_DEFAULT_REGION || "eu-west-1") {
  return new IvsClient({ region });
}

export function createS3Client(region = process.env.AWS_REGION || "eu-west-1") {
  return new S3Client({ region });
}
