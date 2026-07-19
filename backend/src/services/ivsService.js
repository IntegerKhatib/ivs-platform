import { CreateChannelCommand, ListChannelsCommand, DeleteChannelCommand } from "@aws-sdk/client-ivs";
import { createIVSClient } from "../config/aws.js";

class IVSService {
  async createChannel(region, name, userId) {
    try {
      const client = createIVSClient(region);
      const res = await client.send(new CreateChannelCommand({ name, tags: { UserId: userId } }));
      return { 
        success: true, 
        data: { 
          arn: res.channel.arn, id: res.channel.channelId, name: res.channel.name, 
          region, state: res.channel.state, ingestEndpoint: res.channel.ingestEndpoint, 
          playbackUrl: res.channel.playbackUrl, 
          streamKey: res.streamKey ? { value: res.streamKey.value } : null, 
          createdAt: res.channel.createdAt 
        } 
      };
    } catch (e) { return { success: false, error: e.message }; }
  }

  async listChannels(region) {
    try {
      const client = createIVSClient(region);
      const res = await client.send(new ListChannelsCommand({ maxResults: 50 }));
      // Simple, clean mapping. No metrics to crash it.
      const channels = res.channels.map(ch => ({
        arn: ch.arn, id: ch.channelId, name: ch.name, region, 
        state: ch.state, ingestEndpoint: ch.ingestEndpoint, 
        playbackUrl: ch.playbackUrl, streamKey: null, createdAt: ch.createdAt
      }));
      return { success: true, data: { channels } };
    } catch (e) { return { success: false, error: e.message }; }
  }

  async deleteChannel(region, arn) {
    try { 
      const client = createIVSClient(region); 
      await client.send(new DeleteChannelCommand({ arn })); 
      return { success: true }; 
    } catch (e) { return { success: false, error: e.message }; }
  }
}

export default new IVSService();
