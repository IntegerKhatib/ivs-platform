import { useState } from "react";
export default function ChannelCard({ channel, onDelete }) {
  const [showKey, setShowKey] = useState(false);
  return (
    <div className="channel-card">
      <div className="channel-card-header">
        <div className="info"><h4>{channel.name}</h4><span className="region">🌍 {channel.region}</span></div>
        <span className="status-badge active"><span className="dot"></span>{channel.state}</span>
      </div>
      <div className="channel-details">
        <div className="channel-detail"><span className="label">ID</span><span className="value">{channel.id}</span></div>
        <div className="channel-detail"><span className="label">Ingest</span><span className="value" style={{fontSize:'12px'}}>{channel.ingestEndpoint}</span></div>
      </div>
      {channel.streamKey && (
        <div className="stream-key-section">
          <div className="header"><span>Stream Key</span><button className="btn btn-sm btn-secondary" onClick={() => setShowKey(!showKey)}>{showKey ? "Hide" : "Show"}</button></div>
          {showKey && <div className="stream-key-value visible"><span className="key">{channel.streamKey.value}</span></div>}
        </div>
      )}
      <div className="channel-card-actions"><button className="btn btn-sm btn-danger" onClick={() => onDelete(channel.arn, channel.region)}>Delete</button></div>
    </div>
  );
}
