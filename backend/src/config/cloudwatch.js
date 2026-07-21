import { CloudWatchClient } from "@aws-sdk/client-cloudwatch";

/**
 * Uses the EC2 instance profile through the AWS SDK default credential chain.
 */
export function createCloudWatchClient(region = process.env.AWS_REGION || "eu-west-1") {
  return new CloudWatchClient({ region });
}
