// Corrected block for backend/src/services/ivsService.js

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

const response = await client.send(
  new CreateChannelCommand({
    name,
    type,
    latencyMode,
    tags,
    ...(recordingConfigurationArn
      ? { recordingConfigurationArn }
      : {}),
  })
);
