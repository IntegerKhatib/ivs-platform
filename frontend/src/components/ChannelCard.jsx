import { useState } from "react";

const CopyIcon = ({ text }) => (
  <button onClick={() => { navigator.clipboard.writeText(text); alert("Copied!"); }} style={{background:'none', border:'none', cursor:'pointer', marginLeft:'8px', color:'#3b82f6', display:'inline-flex'}}>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
  </button>
);

export default function ChannelCard({ channel, onDelete, userRole }) {
  const [showKey, setShowKey] = useState(false);
  const systemTags = ['CreatedBy'];
  const customTags = Object.keys(channel.tags || {}).filter(t => !systemTags.includes(t));
  const createdBy = channel.tags?.CreatedBy || "Unknown";

  return (
    <div className="channel-card">
      <div className="channel-card-header">
        <div className="info"><h4>{channel.name || "Unnamed"}</h4><span className="region">🌍 {channel.region}</span></div>
        <span className="status-badge active"><span className="dot"></span>{channel.state}</span>
      </div>
      
      <div className="channel-details">
        <div className="channel-detail"><span className="label">Created By</span><span className="value">{createdBy}</span></div>
        <div className="channel-detail"><span className="label">Created</span><span className="value">{channel.createdAt ? new Date(channel.createdAt).toLocaleString() : "N/A"}</span></div>
        <div className="channel-detail" style={{gridColumn: '1 / -1'}}><span className="label">Ingest Endpoint</span><span className="value" style={{fontSize:'12px', display:'flex', alignItems:'center'}}>{channel.ingestEndpoint || "N/A"} {channel.ingestEndpoint && <CopyIcon text={channel.ingestEndpoint} />}</span></div>
        <div className="channel-detail" style={{gridColumn: '1 / -1'}}><span className="label">Playback URL</span><span className="value" style={{display:'flex', alignItems:'center'}}><a href={channel.playbackUrl} target="_blank" rel="noreferrer">{channel.playbackUrl || "N/A"}</a> {channel.playbackUrl && <CopyIcon text={channel.playbackUrl} />}</span></div>
      </div>
      
      {customTags.length > 0 && (
        <div style={{marginBottom:'16px', display:'flex', flexWrap:'wrap', gap:'6px'}}>
          {customTags.map(tag => (
            <span key={tag} style={{background:'#f1f5f9', color:'#475569', padding:'4px 8px', borderRadius:'12px', fontSize:'12px', fontWeight:'500'}}>#{tag}</span>
          ))}
        </div>
      )}

      {channel.streamKey ? (
        <div className="stream-key-section">
          <div className="header"><span>Stream Key</span><button className="btn btn-sm btn-secondary" onClick={() => setShowKey(!showKey)}>{showKey ? "Hide" : "Show"}</button></div>
          {showKey && <div className="stream-key-value visible"><span className="key">{channel.streamKey.value}</span></div>}
        </div>
      ) : (
        <div style={{background: '#fefce8', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '13px', color: '#92400e'}}>
          ⚠️ Stream key is only shown once when created.
        </div>
      )}

      <div className="channel-card-actions">
        {userRole === 'admin' && <button className="btn btn-sm btn-danger" onClick={() => onDelete(channel)}>Delete</button>}
      </div>
    </div>
  );
}
