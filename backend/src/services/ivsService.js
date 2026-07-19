import { CreateChannelCommand, ListChannelsCommand, DeleteChannelCommand, GetChannelCommand, ListTagsForResourceCommand, ListStreamSessionsCommand } from "@aws-sdk/client-ivs";
import { createIVSClient } from "../config/aws.js";

class IVSService {
  async createChannel(region, name, adminName, customTags) {
    try {
      const client = createIVSClient(region);
      const awsTags = { CreatedBy: adminName };
      if (customTags && Array.isArray(customTags)) {
        customTags.forEach(tag => { if(tag.trim()) awsTags[tag.trim()] = ""; });
      }
      const res = await client.send(new CreateChannelCommand({ name, tags: awsTags }));
      return { success: true, data: { arn: res.channel.arn, id: res.channel.channelId, name: res.channel.name, region, state: res.channel.state, ingestEndpoint: res.channel.ingestEndpoint, playbackUrl: res.channel.playbackUrl, streamKey: res.streamKey ? { value: res.streamKey.value } : null, createdAt: res.channel.createdAt } };
    } catch (e) { return { success: false, error: e.message }; }
  }

  async listChannels(region, isLiveOnly = false) {
    try {
      const client = createIVSClient(region);
      const params = { maxResults: 50 };
      const listRes = await client.send(new ListChannelsCommand(params));
      
      if (!listRes.channels || listRes.channels.length === 0) {
        return { success: true, data: { channels: [] } };
      }

      const channels = [];
      for (const ch of listRes.channels) {
        const detailRes = await client.send(new GetChannelCommand({ arn: ch.arn }));
        const tagRes = await client.send(new ListTagsForResourceCommand({ resourceArn: ch.arn }));
        
        let session = null;
        // Only fetch sessions if we are looking at the Live tab AND the channel is actually LIVE
        if (isLiveOnly && detailRes.channel.state === "LIVE") {
          const sessRes = await client.send(new ListStreamSessionsCommand({ channelArn: ch.arn }));
          if (sessRes.streamSessions && sessRes.streamSessions.length > 0) {
            session = sessRes.streamSessions[0];
          }
        }

        // If we are on the Live tab, ONLY push channels that are actually LIVE
        if (isLiveOnly && detailRes.channel.state !== "LIVE") {
          continue; 
        }

        channels.push({
          arn: detailRes.channel.arn, 
          id: detailRes.channel.channelId, 
          name: detailRes.channel.name, 
          region, 
          state: detailRes.channel.state, 
          ingestEndpoint: detailRes.channel.ingestEndpoint, 
          playbackUrl: detailRes.channel.playbackUrl, 
          streamKey: null, 
          createdAt: ch.createdAt,
          tags: tagRes.tags || {},
          session: session ? { startTime: session.startTime, viewerCount: session.viewerCount || 0, health: session.hasError ? 'Unhealthy' : 'Healthy' } : null
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
