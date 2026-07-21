import {
  CreateChannelCommand,
  DeleteChannelCommand,
  GetChannelCommand,
  ListChannelsCommand,
  ListStreamsCommand,
  ListTagsForResourceCommand,
} from "@aws-sdk/client-ivs";
import { createIVSClient } from "../config/aws.js";
import { ensureRecordingConfiguration } from "./recordingService.js";

const CHANNEL_TYPES = new Set(["BASIC", "STANDARD", "ADVANCED_SD", "ADVANCED_HD"]);
const LATENCY_MODES = new Set(["LOW", "NORMAL"]);

function normalizeTags(customTags, adminName) {
  const tags = { CreatedBy: String(adminName || "Unknown") };
  if (customTags && !Array.isArray(customTags) && typeof customTags === "object") {
    for (const [rawKey, rawValue] of Object.entries(customTags)) {
      const key = String(rawKey).trim();
      if (!key || key === "CreatedBy") continue;
      tags[key] = rawValue == null ? "" : String(rawValue).trim();
    }
  }
  if (Array.isArray(customTags)) {
    for (const rawTag of customTags) {
      const key = String(rawTag).trim();
      if (key && key !== "CreatedBy") tags[key] = "";
    }
  }
  return tags;
}

function serializeChannel(channel, region, extra = {}) {
  return {
    arn: channel.arn,
    id: channel.channelId,
    name: channel.name,
    region,
    state: extra.state || "OFFLINE",
    type: channel.type,
    latencyMode: channel.latencyMode,
    authorized: channel.authorized,
    insecureIngest: channel.insecureIngest,
    ingestEndpoint: channel.ingestEndpoint,
    playbackUrl: channel.playbackUrl,
    recordingConfigurationArn: channel.recordingConfigurationArn || null,
    recordingEnabled: Boolean(channel.recordingConfigurationArn),
    createdAt: channel.createdAt,
    ...extra,
  };
}

async function listAllLiveStreams(client) {
  const streams = [];
  let nextToken;
  do {
    const response = await client.send(new ListStreamsCommand({ maxResults: 100, nextToken }));
    streams.push(...(response.streams || []));
    nextToken = response.nextToken;
  } while (nextToken);
  return streams;
}

async function listAllChannelSummaries(client) {
  const channels = [];
  let nextToken;
  do {
    const response = await client.send(new ListChannelsCommand({ maxResults: 50, nextToken }));
    channels.push(...(response.channels || []));
    nextToken = response.nextToken;
  } while (nextToken);
  return channels;
}

class IVSService {
  async createChannel({ region, name, adminName, type, latencyMode, customTags, autoRecord = false }) {
    try {
      if (!CHANNEL_TYPES.has(type)) return { success: false, error: `Unsupported channel type: ${type}` };
      if (!LATENCY_MODES.has(latencyMode)) return { success: false, error: `Unsupported latency mode: ${latencyMode}` };

      const client = createIVSClient(region);
      const tags = normalizeTags(customTags, adminName);
      let recordingConfigurationArn;
      let recordingBucket;

      if (autoRecord) {
        recordingConfigurationArn =
          await ensureRecordingConfiguration();

        recordingBucket =
          "awsivs-emp-platform-950363885603";
      }

      console.log("Creating IVS channel:", {
        name,
        region,
        autoRecord,
        recordingConfigurationArn:
          recordingConfigurationArn || null,
      });

      const response = await client.send(new CreateChannelCommand({
        name,
        type,
        latencyMode,
        tags,
        ...(recordingConfigurationArn ? { recordingConfigurationArn } : {}),
      }));

      if (!response.channel) return { success: false, error: "AWS did not return the created channel." };
      return {
        success: true,
        data: serializeChannel(response.channel, region, {
          tags,
          recordingBucket: recordingBucket || null,
          streamKey: response.streamKey ? { value: response.streamKey.value } : null,
        }),
      };
    } catch (error) {
      console.error(`Failed to create IVS channel in ${region}:`, error);
      return { success: false, error: error.message || "Failed to create the channel." };
    }
  }

  async getOperationalMetrics(region) {
    try {
      const client = createIVSClient(region);
      const liveStreams = await listAllLiveStreams(client);
      const viewersByChannel = {};
      liveStreams.forEach((stream) => {
        if (stream.channelArn) viewersByChannel[stream.channelArn] = Number(stream.viewerCount || 0);
      });
      return {
        success: true,
        data: {
          liveChannels: liveStreams.length,
          totalViewers: liveStreams.reduce((sum, stream) => sum + Number(stream.viewerCount || 0), 0),
          liveChannelArns: liveStreams.map((stream) => stream.channelArn).filter(Boolean),
          viewersByChannel,
          streams: liveStreams.map((stream) => ({
            channelArn: stream.channelArn,
            state: stream.state || "LIVE",
            health: stream.health || "UNKNOWN",
            viewerCount: Number(stream.viewerCount || 0),
            startTime: stream.startTime || null,
          })),
          measuredAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error(`Failed to retrieve IVS operational metrics for ${region}:`, error);
      return { success: false, error: error.message || `Failed to retrieve live-stream information for ${region}.` };
    }
  }

  async listChannels(region, isLiveOnly = false) {
    try {
      const client = createIVSClient(region);
      const [channelSummaries, liveStreams] = await Promise.all([listAllChannelSummaries(client), listAllLiveStreams(client)]);
      const liveStreamsByArn = new Map(liveStreams.filter((stream) => stream.channelArn).map((stream) => [stream.channelArn, stream]));
      const channels = [];

      for (const summary of channelSummaries) {
        const liveStream = liveStreamsByArn.get(summary.arn);
        if (isLiveOnly && !liveStream) continue;
        const [detailResponse, tagResponse] = await Promise.all([
          client.send(new GetChannelCommand({ arn: summary.arn })),
          client.send(new ListTagsForResourceCommand({ resourceArn: summary.arn })),
        ]);
        if (!detailResponse.channel) continue;
        const viewerCount = Number(liveStream?.viewerCount || 0);
        channels.push(serializeChannel(detailResponse.channel, region, {
          createdAt: summary.createdAt || detailResponse.channel.createdAt,
          tags: tagResponse.tags || {},
          streamKey: null,
          state: liveStream ? liveStream.state || "LIVE" : "OFFLINE",
          viewerCount,
          session: liveStream ? {
            viewerCount,
            health: liveStream.health || "UNKNOWN",
            state: liveStream.state || "LIVE",
            startTime: liveStream.startTime || null,
          } : null,
        }));
      }
      return { success: true, data: { channels } };
    } catch (error) {
      console.error(`Failed to list IVS channels in ${region}:`, error);
      return { success: false, error: error.message || `Failed to list channels in ${region}.` };
    }
  }

  async deleteChannel(region, arn) {
    try {
      await createIVSClient(region).send(new DeleteChannelCommand({ arn }));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message || "Failed to delete the channel." };
    }
  }
}

export default new IVSService();
