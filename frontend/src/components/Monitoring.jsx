import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, Clock3, Eye, Radio, RefreshCw, Signal, Video } from "lucide-react";

const REGIONS = ["us-east-1", "us-west-2", "eu-west-1"];
const fmtDuration = (start) => { if (!start) return "—"; const sec=Math.max(0,Math.floor((Date.now()-new Date(start).getTime())/1000)); const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60); return `${h}h ${m}m`; };

export default function Monitoring({ refreshKey = 0 }) {
  const [region, setRegion] = useState("eu-west-1");
  const [data, setData] = useState({ streams: [], liveChannels: 0, totalViewers: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const load = async () => {
    setLoading(true); setError("");
    try {
      const token=localStorage.getItem("token");
      const response=await fetch(`/api/channels/monitoring?region=${region}`, { headers:{Authorization:`Bearer ${token}`} });
      const json=await response.json();
      if(!response.ok || !json.success) throw new Error(json.error || "Unable to load monitoring data");
      setData(json.data);
    } catch(e) { setError(e.message); } finally { setLoading(false); }
  };
  useEffect(()=>{ load(); },[region,refreshKey]);
  const starving=useMemo(()=>data.streams.filter(s=>String(s.health).toUpperCase()==="STARVING").length,[data]);
  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center">
      <div><h2 className="text-xl font-bold text-slate-900 dark:text-white">StreamBridge monitoring</h2><p className="mt-1 text-sm text-slate-500">Live operational health, audience, encoder details, and recent session events.</p></div>
      <div className="flex gap-2"><select value={region} onChange={e=>setRegion(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">{REGIONS.map(r=><option key={r}>{r}</option>)}</select><button onClick={load} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"><RefreshCw className={`h-4 w-4 ${loading?"animate-spin":""}`}/>Refresh</button></div>
    </div>
    {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card icon={Radio} label="Live streams" value={data.liveChannels||0}/><Card icon={Eye} label="Current viewers" value={data.totalViewers||0}/><Card icon={Signal} label="Healthy streams" value={(data.streams||[]).filter(s=>String(s.health).toUpperCase()==="HEALTHY").length}/><Card icon={AlertTriangle} label="Starving streams" value={starving}/>
    </div>
    <div className="space-y-4">{!loading && data.streams?.length===0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900">No live streams in {region}.</div>}{data.streams?.map(s=><div key={s.channelArn} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col justify-between gap-3 md:flex-row"><div><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse"/><h3 className="font-semibold text-slate-900 dark:text-white">{s.channelName||s.channelArn.split('/').pop()}</h3></div><p className="mt-1 break-all text-xs text-slate-400">{s.channelArn}</p></div><span className={`h-fit rounded-full px-3 py-1 text-xs font-semibold ${String(s.health).toUpperCase()==="HEALTHY"?"bg-emerald-50 text-emerald-700":"bg-amber-50 text-amber-700"}`}>{s.health||"UNKNOWN"}</span></div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5"><Info icon={Eye} label="Viewers" value={s.viewerCount||0}/><Info icon={Clock3} label="Uptime" value={fmtDuration(s.startTime)}/><Info icon={Video} label="Video" value={s.video ? `${s.video.width||"?"}×${s.video.height||"?"} ${s.video.codec||""}` : "—"}/><Info icon={Activity} label="Target bitrate" value={s.video?.targetBitrate ? `${Math.round(s.video.targetBitrate/1000)} kbps` : "—"}/><Info icon={Signal} label="Audio" value={s.audio ? `${s.audio.channels||"?"} ch · ${s.audio.sampleRate||"?"} Hz` : "—"}/></div>
      {s.events?.length>0 && <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800"><p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Recent events</p><div className="space-y-2">{s.events.slice(0,5).map((e,i)=><div key={`${e.eventTime}-${i}`} className="flex justify-between gap-4 rounded-lg bg-slate-50 px-3 py-2 text-xs dark:bg-slate-800"><span className="text-slate-700 dark:text-slate-300">{e.name||e.type}</span><span className="text-slate-400">{e.eventTime?new Date(e.eventTime).toLocaleString():""}</span></div>)}</div></div>}
    </div>)}</div>
  </div>;
}
function Card({icon:Icon,label,value}){return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{value}</p></div><div className="rounded-xl bg-orange-50 p-3 text-orange-600 dark:bg-orange-950/40"><Icon className="h-5 w-5"/></div></div></div>}
function Info({icon:Icon,label,value}){return <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60"><div className="flex items-center gap-2 text-xs text-slate-400"><Icon className="h-3.5 w-3.5"/>{label}</div><p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-200">{value}</p></div>}
