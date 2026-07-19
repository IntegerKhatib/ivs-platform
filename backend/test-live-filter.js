import { ListChannelsCommand, IvsClient } from "@aws-sdk/client-ivs";

const client = new IvsClient({
  region: "us-east-1",
  credentials: { 
    accessKeyId: process.env.AWS_ACCESS_KEY_ID, 
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY 
  }
});

console.log("Testing AWS Live Filter...");

const res = await client.send(new ListChannelsCommand({ 
  maxResults: 50, 
  filterBy: [{ name: "is-live", value: "true" }] 
}));

console.log("Channels returned:", res.channels.length);
