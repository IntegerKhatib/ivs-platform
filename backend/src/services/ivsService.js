import { CreateChannelCommand, ListChannelsCommand, DeleteChannelCommand, GetChannelCommand } from "@aws-sdk/client-ivs";
import { createIVSClient } from "../config/aws.js";

class IVSService {
  async createChannel(region, name, userId) {
    try {
      const client = createIVSClient(region);
      const res = await client.send(new CreateChannelCommand({ name, tags: { UserId: userId } }));
      return { success: true, data: { arn: res.channel.arn, id: res.channel.channelId, name: res.channel.name, region, state: res.channel.state, ingestEndpoint: res.channel.ingestEndpoint, playbackUrl: res.channel.playbackUrl, streamKey: res.streamKey ? { value: res.streamKey.value } : null, createdAt: res.channel.createdAt } };
    } catch (e) { return { success: false, error: e.message }; }
  }

  async listChannels(region) {
    try {
      const client = createIVSClient(region);
      
      // 1. Get the list of channel ARNs
      const listRes = await client.send(new ListChannelsCommand({ maxResults: 50 }));
      if (!listRes.channels || listRes.channels.length === 0) {
        return { success: true, data: { channels: [] } };
      }

      const channels = [];
      // 2. Fetch full details for EACH channel one by one (100% reliable)
      for (const ch of listRes.channels) {
        const detailRes = await client.send(new GetChannelCommand({ arn: ch.arn }));
        channels.push({
          arn: detailRes.channel.arn, 
          id: detailRes.channel.channelId, 
          name: detailRes.channel.name, 
          region, 
          state: detailRes.channel.state, 
          ingestEndpoint: detailRes.channel.ingestEndpoint, 
          playbackUrl: detailRes.channel.playbackUrl, 
          streamKey: null, 
          createdAt: ch.createdAt 
        });
      }
      
      return { success: true, data: { channels } };
    } catch (e) { return { success: false, error: e.message }; }
  }

  async deleteChannel(region, arn) {
    try { const client = createIVSClient(region); await client.send(new DeleteChannelCommand({ arn })); return { success: true }; }
    catch (e) { return { success: false, error: e.message }; }
  }
}

export default new IVSService();
