import { useState } from "react";
export default function ChannelCard({ channel, onDelete }) {
  const [showKey, setShowKey] = useState(false);
  return (
    <div className="channel-card">
      <div className="channel-card-header">
        <div className="info"><h4>{channel.name || "Unnamed"}</h4><span className="region">🌍 {channel.region}</span></div>
        <span className="status-badge active"><span className="dot"></span>{channel.state}</span>
      </div>
      <div className="channel-details">
        <div className="channel-detail"><span className="label">Channel ID</span><span className="value">{channel.id}</span></div>
        <div className="channel-detail"><span className="label">Created</span><span className="value">{channel.createdAt ? new Date(channel.createdAt).toLocaleString() : "N/A"}</span></div>
        <div className="channel-detail"><span className="label">Ingest Endpoint</span><span className="value" style={{fontSize:'12px'}}>{channel.ingestEndpoint || "N/A"}</span></div>
        <div className="channel-detail"><span className="label">Playback URL</span><span className="value"><a href={channel.playbackUrl} target="_blank" rel="noreferrer">{channel.playbackUrl || "N/A"}</a></span></div>
      </div>
      
      {channel.streamKey ? (
        <div className="stream-key-section">
          <div className="header"><span>Stream Key</span><button className="btn btn-sm btn-secondary" onClick={() => setShowKey(!showKey)}>{showKey ? "Hide" : "Show"}</button></div>
          {showKey && <div className="stream-key-value visible"><span className="key">{channel.streamKey.value}</span></div>}
        </div>
      ) : (
        <div style={{background: '#fefce8', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '13px', color: '#92400e'}}>
          ⚠️ Stream key is only shown once when created. If you lost it, you must reset it in the AWS IVS Console.
        </div>
      )}

      <div className="channel-card-actions">
        <button className="btn btn-sm btn-danger" onClick={() => onDelete(channel)}>Delete</button>
      </div>
    </div>
  );
}
