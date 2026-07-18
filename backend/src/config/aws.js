import { IvsClient } from "@aws-sdk/client-ivs";
export function createIVSClient(region) {
  return new IvsClient({
    region,
    credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY }
  });
}
