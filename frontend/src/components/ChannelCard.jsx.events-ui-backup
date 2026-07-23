import { useState } from "react";
import { Check, Copy, ExternalLink, Eye, EyeOff, Globe, Trash2 } from "lucide-react";

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-950/30"
      title="Copy to clipboard"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-orange-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

export default function ChannelCard({ channel, onDelete, userRole }) {
  const [showKey, setShowKey] = useState(false);
  const systemTags = ["CreatedBy"];
  const customTags = Object.entries(channel.tags || {}).filter(([key]) => !systemTags.includes(key));
  const createdBy = channel.tags?.CreatedBy || "Unknown";

  return (
    <div className="saas-card flex flex-col p-5">
      <div className="mb-4 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-semibold text-slate-900 dark:text-white">{channel.name || "Unnamed"}</h4>
          <span className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Globe className="h-3 w-3" /> {channel.region}
          </span>
        </div>
        <span className={`ml-3 inline-flex flex-shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${channel.state === "LIVE" ? "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>
          {channel.state === "LIVE" && <span className="live-dot" />}
          {channel.state}
        </span>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
        <Detail label="Channel type" value={(channel.type || "STANDARD").replaceAll("_", " ")} />
        <Detail label="Video latency" value={channel.latencyMode === "NORMAL" ? "Standard" : "Low"} />
        <Detail label="Created by" value={createdBy} />
        <Detail label="Created" value={(channel.createdAt || channel.creationTime || channel.created) ? new Date(channel.createdAt || channel.creationTime || channel.created).toLocaleString() : "N/A"} />
      </div>

      {customTags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {customTags.map(([key, value]) => (
            <span key={key} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400" title={value || "No value"}>
              {key}{value ? `: ${value}` : ""}
            </span>
          ))}
        </div>
      )}

      <div className="mb-4 space-y-2">
        <UrlRow label="Ingest" value={channel.ingestEndpoint} />
        <UrlRow label="Playback" value={channel.playbackUrl} external />
      </div>

      {channel.streamKey ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">Stream key</span>
            <button type="button" onClick={() => setShowKey((current) => !current)} className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300">
              {showKey ? <><EyeOff className="h-3.5 w-3.5" /> Hide</> : <><Eye className="h-3.5 w-3.5" /> Show</>}
            </button>
          </div>
          {showKey && <div className="mt-2 flex items-center gap-2"><code className="min-w-0 flex-1 truncate text-xs text-amber-900 dark:text-amber-200">{channel.streamKey.value}</code><CopyButton text={channel.streamKey.value} /></div>}
        </div>
      ) : (
        <p className="mb-4 text-xs text-slate-400">Stream key is only shown once when the channel is created.</p>
      )}

      {userRole === "admin" && (
        <div className="mt-auto border-t border-slate-100 pt-3 dark:border-slate-800">
          <button type="button" onClick={() => onDelete(channel)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30">
            <Trash2 className="h-3.5 w-3.5" /> Delete channel
          </button>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }) {
  return <div><span className="mb-0.5 block text-slate-400 dark:text-slate-500">{label}</span><span className="font-medium capitalize text-slate-700 dark:text-slate-300">{value || "N/A"}</span></div>;
}

function UrlRow({ label, value, external = false }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/50">
      <span className="w-16 flex-shrink-0 text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</span>
      {value ? <><span className="min-w-0 flex-1 truncate font-mono text-xs text-slate-600 dark:text-slate-300">{value}</span>{external && <a href={value} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-orange-600"><ExternalLink className="h-3.5 w-3.5" /></a>}<CopyButton text={value} /></> : <span className="text-xs text-slate-400">N/A</span>}
    </div>
  );
}
