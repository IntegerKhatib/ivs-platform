import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const SUPPORTED_REGIONS = ["us-east-1", "us-west-2", "eu-west-1"];

// FIX: Stop the timer if state isn't live
function LiveTimer({ startTime, isLive }) {
  const [time, setTime] = useState("00:00:00");
  useEffect(() => {
    if (!startTime || !isLive) {
      setTime("00:00:00"); // Reset to 00:00:00 if stream stops
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

  // FIX: Safely open details without crashing
  const handleViewDetails = () => {
    if (selectedChannel && selectedChannel.playbackUrl) {
      window.open(selectedChannel.playbackUrl, '_blank');
    } else {
      alert("Please click a channel row first to select it.");
    }
  };

  return (
    <div style={{background:'white', borderRadius:'12px', border:'1px solid #e2e8f0', overflow:'hidden'}}>
      <div style={{padding:'16px 24px', borderBottom:'1px solid #e2e8f0'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px'}}>
          <h3 style={{fontSize:'18px', fontWeight:'600', color:'#1e293b'}}>Live channels</h3>
          <div style={{display:'flex', gap:'8px'}}>
            <button className="btn btn-sm btn-danger">Stop stream</button>
            <button className="btn btn-sm btn-secondary" onClick={handleViewDetails}>View details</button>
            <button className="btn btn-sm btn-secondary" onClick={fetchChannels} style={{padding:'6px 8px'}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            </button>
          </div>
        </div>
        
        <input 
          type="text" 
          placeholder="Filter by health" 
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{padding:'8px 12px', border:'1px solid #d1d5db', borderRadius:'6px', fontSize:'14px', width:'100%', maxWidth:'300px', boxSizing:'border-box'}}
        />
      </div>

      <div style={{minHeight:'200px'}}>
        {loading ? (
          <div style={{textAlign:'center',padding:'50px', color:'#64748b'}}>Scanning for live streams...</div>
        ) : filteredChannels.length === 0 ? (
          <div style={{textAlign:'center',padding:'60px 20px', color:'#64748b'}}>
            <h3 style={{fontSize:'16px', fontWeight:'600', color:'#475569'}}>No live channels found</h3>
            <p style={{fontSize:'14px', marginTop:'8px'}}>Channels actively streaming will appear here.</p>
          </div>
        ) : (
          <table style={{width:'100%', borderCollapse:'collapse'}}>
            <thead>
              <tr style={{background:'#f8fafc', textAlign:'left', fontSize:'12px', color:'#64748b', textTransform:'uppercase', letterSpacing:'0.5px', borderBottom:'1px solid #e2e8f0'}}>
                <th style={{padding:'12px 24px', fontWeight:'600'}}>Channel</th>
                <th style={{padding:'12px 24px', fontWeight:'600'}}>State</th>
                <th style={{padding:'12px 24px', fontWeight:'600'}}>Health</th>
                <th style={{padding:'12px 24px', fontWeight:'600'}}>Duration</th>
                <th style={{padding:'12px 24px', fontWeight:'600'}}>Views</th>
              </tr>
            </thead>
            <tbody>
              {filteredChannels.map(ch => (
                <tr 
                  key={ch.arn} 
                  style={{borderTop:'1px solid #f1f5f9', fontSize:'14px', cursor:'pointer', background: selectedChannel?.arn === ch.arn ? '#f8fafc' : 'white'}}
                  onClick={() => setSelectedChannel(ch)}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = selectedChannel?.arn === ch.arn ? '#f8fafc' : 'white'}
                >
                  <td style={{padding:'16px 24px', fontWeight:'500', color:'#1e293b'}}>{ch.name}</td>
                  <td style={{padding:'16px 24px'}}>
                    <span style={{background:'#fee2e2', color:'#dc2626', padding:'4px 10px', borderRadius:'20px', fontSize:'12px', fontWeight:'600', display:'inline-flex', alignItems:'center', gap:'6px'}}>
                      <span style={{width:'6px', height:'6px', background:'#dc2626', borderRadius:'50%', display:'inline-block'}}></span> LIVE
                    </span>
                  </td>
                  <td style={{padding:'16px 24px'}}>
                    <span style={{display:'inline-flex', alignItems:'center', gap:'6px', color:'#16a34a', fontWeight:'500', fontSize:'14px'}}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      {ch.session?.health || 'Healthy'}
                    </span>
                  </td>
                  <td style={{padding:'16px 24px', fontFamily:'monospace', fontSize:'14px', color:'#334155', letterSpacing:'0.5px'}}>
                    {/* FIX: Pass state to timer so it stops when stream stops */}
                    <LiveTimer startTime={ch.session?.startTime} isLive={ch.state === 'LIVE'} />
                  </td>
                  <td style={{padding:'16px 24px', fontWeight:'500', color:'#1e293b'}}>
                    {ch.session?.viewerCount || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
