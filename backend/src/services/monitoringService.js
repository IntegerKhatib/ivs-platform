import { GetStreamSessionCommand, ListChannelsCommand, ListStreamsCommand } from "@aws-sdk/client-ivs";
import { createIVSClient } from "../config/aws.js";

export async function getMonitoring(region) {
  const client=createIVSClient(region);
  const [streamResult, channelResult]=await Promise.all([
    client.send(new ListStreamsCommand({maxResults:100})),
    client.send(new ListChannelsCommand({maxResults:50}))
  ]);
  const names=new Map((channelResult.channels||[]).map(c=>[c.arn,c.name]));
  const streams=await Promise.all((streamResult.streams||[]).map(async stream=>{
    let session={};
    try { const r=await client.send(new GetStreamSessionCommand({channelArn:stream.channelArn,streamId:stream.streamId})); session=r.streamSession||{}; } catch(error) { console.warn(`Unable to retrieve stream session ${stream.streamId}:`,error.message); }
    return { ...stream, channelName:names.get(stream.channelArn)||null, video:session.ingestConfiguration?.video||null, audio:session.ingestConfiguration?.audio||null, events:session.truncatedEvents||[] };
  }));
  return { liveChannels:streams.length,totalViewers:streams.reduce((sum,s)=>sum+Number(s.viewerCount||0),0),streams,measuredAt:new Date().toISOString() };
}
