import { CreateChannelCommand, ListChannelsCommand, DeleteChannelCommand, ListStreamSessionsCommand } from "@aws-sdk/client-ivs";
import { createIVSClient } from "../config/aws.js";
class IVSService {
  async createChannel(region, name, userId) {
    try {
      const client = createIVSClient(region);
      const res = await client.send(new CreateChannelCommand({ name, tags: { UserId: userId } }));
      return { success: true, data: { arn: res.channel.arn, id: res.channel.channelId, name: res.channel.name, region, state: res.channel.state, ingestEndpoint: res.channel.ingestEndpoint, playbackUrl: res.channel.playbackUrl, streamKey: res.streamKey ? { value: res.streamKey.value } : null, createdAt: res.channel.createdAt } };
    } catch (e) { return { success: false, error: e.message }; }
  }
  async getLatestSession(region, channelArn) {
    try {
      const client = createIVSClient(region);
      const res = await client.send(new ListStreamSessionsCommand({ channelArn }));
      return (res.streamSessions && res.streamSessions.length > 0) ? res.streamSessions[0] : null;
    } catch (e) { 
      // If permission denied or fails, just return null so the channel list doesn't crash
      return null; 
    }
  }
  async listChannels(region) {
    try {
      const client = createIVSClient(region);
      const res = await client.send(new ListChannelsCommand({ maxResults: 50 }));
      const channels = [];
      for (const ch of res.channels) {
        // Fetch session safely. If it fails, session will just be null
        const session = await this.getLatestSession(region, ch.arn);
        channels.push({ arn: ch.arn, id: ch.channelId, name: ch.name, region, state: ch.state, ingestEndpoint: ch.ingestEndpoint, playbackUrl: ch.playbackUrl, streamKey: null, createdAt: ch.createdAt, streamSession: session });
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
