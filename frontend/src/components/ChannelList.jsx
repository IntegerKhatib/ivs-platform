import { useState, useEffect } from "react";
import ChannelCard from "./ChannelCard";
const SUPPORTED_REGIONS = ["us-east-1", "us-west-2", "eu-west-1"];

export default function ChannelList({ newChannel, addNotification, userRole, isLiveOnly }) {
  const [channels, setChannels] = useState([]); 
  const [loading, setLoading] = useState(true);

  const fetchChannels = async () => { 
    setLoading(true);
    try { 
      const liveQuery = isLiveOnly ? "&live=true" : "";
      const promises = SUPPORTED_REGIONS.map(async (region) => {
        const r = await fetch(`/api/channels?region=${region}${liveQuery}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        const d = await r.json(); 
        return d.success ? d.data.channels : [];
      });
      const results = await Promise.all(promises);
      const allChannels = results.flat();
      allChannels.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setChannels(allChannels); 
    } catch (err) { console.error(err); } 
    finally { setLoading(false); } 
  };

  useEffect(() => { fetchChannels(); }, [isLiveOnly]);
  useEffect(() => { if (newChannel) setChannels(prev => [newChannel, ...prev]); }, [newChannel]);

  const handleDelete = async (channel) => { 
    if (!confirm(`Delete "${channel.name}"?`)) return; 
    const res = await fetch(`/api/channels/${encodeURIComponent(channel.arn)}?region=${channel.region}`, {
      method: "DELETE", 
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    }); 
    const data = await res.json();
    if (data.success) {
      setChannels(prev => prev.filter(c => c.arn !== channel.arn)); 
      addNotification(`Channel "${channel.name}" deleted.`, "delete");
    } else { alert(data.error); }
  };

  if (loading) return <div style={{textAlign:'center',padding:'50px'}}>Loading {isLiveOnly ? 'live ' : ''}channels...</div>;
  if (!channels.length) return <div className="empty-state"><h3>{isLiveOnly ? 'No channels are currently live' : 'No channels'}</h3><p>{!isLiveOnly && userRole === 'admin' ? "Create one above" : ""}</p></div>;
  
  return <div className="channels-grid">{channels.map(ch => <ChannelCard key={ch.arn} channel={ch} onDelete={handleDelete} userRole={userRole} />)}</div>;
}
