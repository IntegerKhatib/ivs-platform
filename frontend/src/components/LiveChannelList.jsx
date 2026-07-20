import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Loader2, Radio, RefreshCw, Search, Eye, Square } from "lucide-react";

const SUPPORTED_REGIONS = ["us-east-1", "us-west-2", "eu-west-1"];

function LiveTimer({ startTime, isLive }) {
  const [time, setTime] = useState("00:00:00");
  useEffect(() => {
    if (!startTime || !isLive) {
      setTime("00:00:00");
      return;
    }
    const updateTime = () => {
      const diff = Math.max(0, Date.now() - new Date(startTime).getTime());
      const hrs = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const mins = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const secs = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      setTime(`${hrs}:${mins}:${secs}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [startTime, isLive]);
  return <span>{time}</span>;
}

export default function LiveChannelList() {
  const { user } = useAuth();
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [selectedChannel, setSelectedChannel] = useState(null);

  const fetchChannels = async () => {
    setLoading(true);
    try {
      const promises = SUPPORTED_REGIONS.map(async (region) => {
        const r = await fetch(`/api/channels?region=${region}&live=true`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        const d = await r.json();
        return d.success ? d.data.channels : [];
      });
      setChannels((await Promise.all(promises)).flat());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchChannels(); }, []);

  const filteredChannels = channels.filter(ch => {
    if (!filter) return true;
    return ch.session?.health?.toLowerCase().includes(filter.toLowerCase());
  });

  const handleViewDetails = () => {
    if (selectedChannel && selectedChannel.playbackUrl) {
      window.open(selectedChannel.playbackUrl, '_blank');
    } else {
      alert("Please click a channel row first to select it.");
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-50 dark:bg-red-950/50 rounded-lg flex items-center justify-center">
              <Radio className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Live Channels</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {channels.length} channel{channels.length !== 1 ? 's' : ''} streaming
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter by health..."
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-48"
              />
            </div>
            <button className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-medium rounded-lg hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors border border-red-200 dark:border-red-800/50">
              <Square className="w-3.5 h-3.5" />
              Stop
            </button>
            <button
              onClick={handleViewDetails}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
            >
              <Eye className="w-3.5 h-3.5" />
              Details
            </button>
            <button
              onClick={fetchChannels}
              className="w-9 h-9 flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="min-h-[200px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mb-3" />
            <span className="text-sm">Scanning for live streams...</span>
          </div>
        ) : filteredChannels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center mb-4">
              <Radio className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">No live channels found</h3>
            <p className="text-xs text-slate-400">Channels actively streaming will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Channel</th>
                  <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">State</th>
                  <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Health</th>
                  <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Duration</th>
                  <th className="text-left px-6 py-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Views</th>
                </tr>
              </thead>
              <tbody>
                {filteredChannels.map(ch => (
                  <tr
                    key={ch.arn}
                    onClick={() => setSelectedChannel(ch)}
                    className={`border-b border-slate-50 dark:border-slate-800/50 cursor-pointer transition-colors text-sm ${
                      selectedChannel?.arn === ch.arn
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{ch.name}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-full text-xs font-semibold">
                        <span className="live-dot" />
                        LIVE
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        {ch.session?.health || 'Healthy'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-slate-600 dark:text-slate-300 tracking-wide">
                      <LiveTimer startTime={ch.session?.startTime} isLive={ch.state === 'LIVE'} />
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                      {ch.session?.viewerCount || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}