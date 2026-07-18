import { useState, useEffect } from "react";
import ChannelCard from "./ChannelCard";
export default function ChannelList({ newChannel }) {
  const [channels, setChannels] = useState([]); const [loading, setLoading] = useState(true);
  const fetchChannels = async () => { try { const r = await fetch("/api/channels?region=us-east-1", {headers:{Authorization:`Bearer ${localStorage.getItem("token")}`}}); const d = await r.json(); if(d.success) setChannels(d.data.channels); } catch {} finally { setLoading(false); } };
  useEffect(() => { fetchChannels(); }, []);
  useEffect(() => { if(newChannel) setChannels(prev => [newChannel, ...prev]); }, [newChannel]);
  const handleDelete = async (arn, region) => { if(!confirm("Delete this channel?")) return; await fetch(`/api/channels/${encodeURIComponent(arn)}?region=${region}`, {method:"DELETE", headers:{Authorization:`Bearer ${localStorage.getItem("token")}`}}); setChannels(prev => prev.filter(c => c.arn !== arn)); };
  if(loading) return <div style={{textAlign:'center',padding:'50px'}}>Loading...</div>;
  if(!channels.length) return <div className="empty-state"><h3>No channels</h3><p>Create one above</p></div>;
  return <div className="channels-grid">{channels.map(ch => <ChannelCard key={ch.arn} channel={ch} onDelete={handleDelete} />)}</div>;
}
