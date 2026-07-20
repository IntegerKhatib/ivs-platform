import { useState, useEffect } from "react";
import ChannelCard from "./ChannelCard";
import { LayoutGrid, Loader2, Inbox } from "lucide-react";

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mb-3" />
        <span className="text-sm">Loading {isLiveOnly ? 'live ' : ''}channels...</span>
      </div>
    );
  }

  if (!channels.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center mb-4">
          <Inbox className="w-6 h-6 text-slate-400" />
        </div>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
          {isLiveOnly ? 'No channels are currently live' : 'No channels yet'}
        </h3>
        {!isLiveOnly && userRole === 'admin' && (
          <p className="text-xs text-slate-400">Create your first channel using the form above</p>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {channels.map(ch => <ChannelCard key={ch.arn} channel={ch} onDelete={handleDelete} userRole={userRole} />)}
    </div>
  );
}