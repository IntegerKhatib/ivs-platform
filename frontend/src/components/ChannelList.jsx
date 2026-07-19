import { useState, useEffect } from "react";
import ChannelCard from "./ChannelCard";

export default function ChannelList({ newChannel, addNotification }) {
  const [channels, setChannels] = useState([]); 
  const [loading, setLoading] = useState(true);

  const fetchChannels = async () => { 
    setLoading(true);
    try { 
      const r = await fetch("/api/channels?region=us-east-1", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const d = await r.json(); 
      
      if (d.success) { 
        setChannels(d.data.channels); 
      } else {
        alert("Backend Error: " + d.error);
      }
    } catch (err) { 
      alert("Network Error: " + err.message); 
    } finally { 
      setLoading(false); 
    } 
  };

  useEffect(() => { fetchChannels(); }, []);
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
    } else {
      alert("Failed to delete: " + data.error);
    }
  };

  if (loading) return <div style={{textAlign:'center',padding:'50px'}}>Loading channels...</div>;
  if (!channels.length) return <div className="empty-state"><h3>No channels</h3><p>Create one above</p></div>;
  
  return <div className="channels-grid">{channels.map(ch => <ChannelCard key={ch.arn} channel={ch} onDelete={handleDelete} />)}</div>;
}
