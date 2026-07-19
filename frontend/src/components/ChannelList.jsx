import { useState, useEffect } from "react";
import ChannelCard from "./ChannelCard";

// All the regions your platform supports
const SUPPORTED_REGIONS = ["us-east-1", "us-west-2", "eu-west-1"];

export default function ChannelList({ newChannel, addNotification }) {
  const [channels, setChannels] = useState([]); 
  const [loading, setLoading] = useState(true);

  const fetchChannels = async () => { 
    setLoading(true);
    try { 
      // Ask AWS for channels in ALL regions at the same time
      const promises = SUPPORTED_REGIONS.map(async (region) => {
        const r = await fetch(`/api/channels?region=${region}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        const d = await r.json(); 
        return d.success ? d.data.channels : [];
      });

      // Wait for all regions to finish loading
      const results = await Promise.all(promises);
      
      // Combine all channels into one list
      const allChannels = results.flat();
      
      // Sort them so the newest created channel is at the top
      allChannels.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setChannels(allChannels); 
    } catch (err) { 
      console.error("Failed to fetch channels", err); 
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
      addNotification(`Channel "${channel.name}" deleted from ${channel.region}.`, "delete");
    } else {
      alert("Failed to delete: " + data.error);
    }
  };

  if (loading) return <div style={{textAlign:'center',padding:'50px'}}>Loading channels from all regions...</div>;
  if (!channels.length) return <div className="empty-state"><h3>No channels</h3><p>Create one above</p></div>;
  
  return <div className="channels-grid">{channels.map(ch => <ChannelCard key={ch.arn} channel={ch} onDelete={handleDelete} />)}</div>;
}
