import { useState } from "react";
import { Copy, Check, ExternalLink, AlertTriangle, Trash2, Eye, EyeOff } from "lucide-react";

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="inline-flex items-center justify-center w-7 h-7 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
      title="Copy to clipboard"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export default function ChannelCard({ channel, onDelete, userRole }) {
  const [showKey, setShowKey] = useState(false);
  const systemTags = ['CreatedBy'];
  const customTags = Object.keys(channel.tags || {}).filter(t => !systemTags.includes(t));
  const createdBy = channel.tags?.CreatedBy || "Unknown";

  return (
    <div className="saas-card p-5 flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">{channel.name || "Unnamed"}</h4>
          <span className="inline-flex items-center gap-1.5 mt-1 text-xs text-slate-500 dark:text-slate-400">
            <Globe className="w-3 h-3" />
            {channel.region}
          </span>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-3 ${
          channel.state === 'LIVE'
            ? 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
        }`}>
          {channel.state === 'LIVE' && <span className="live-dot" />}
          {channel.state}
        </span>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-4 text-xs">
        <div>
          <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Created By</span>
          <span className="text-slate-700 dark:text-slate-300 font-medium">{createdBy}</span>
        </div>
        <div>
          <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Created</span>
          <span className="text-slate-700 dark:text-slate-300 font-medium">{channel.createdAt ? new Date(channel.createdAt).toLocaleDateString() : "N/A"}</span>
        </div>
      </div>

      {/* Tags */}
      {customTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {customTags.map(tag => (
            <span key={tag} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md text-xs font-medium">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* URLs */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider w-16 flex-shrink-0">Ingest</span>
          <span className="text-xs text-slate-600 dark:text-slate-300 truncate flex-1 font-mono">{channel.ingestEndpoint || "N/A"}</span>
          {channel.ingestEndpoint && <CopyButton text={channel.ingestEndpoint} />}
        </div>
        <div className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider w-16 flex-shrink-0">Playback</span>
          {channel.playbackUrl ? (
            <>
              <a href={channel.playbackUrl} target="_blank" rel="noreferrer" className="text-xs text-emerald-600 dark:text-emerald-400 truncate flex-1 font-mono hover:underline">
                {channel.playbackUrl}
              </a>
              <a href={channel.playbackUrl} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <CopyButton text={channel.playbackUrl} />
            </>
          ) : (
            <span className="text-xs text-slate-400">N/A</span>
          )}
        </div>
      </div>

      {/* Stream key section */}
      {channel.streamKey ? (
        <div className="p-3 bg-slate-900 dark:bg-slate-950 rounded-lg mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Stream Key</span>
            <button
              onClick={() => setShowKey(!showKey)}
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
            >
              {showKey ? <><EyeOff className="w-3 h-3" /> Hide</> : <><Eye className="w-3 h-3" /> Show</>}
            </button>
          </div>
          {showKey && (
            <div className="flex items-center gap-2 p-2 bg-slate-800 rounded">
              <code className="text-xs text-emerald-400 font-mono truncate flex-1">{channel.streamKey.value}</code>
              <CopyButton text={channel.streamKey.value} />
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-start gap-2.5 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg mb-4">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <span className="text-xs text-amber-700 dark:text-amber-400">Stream key is only shown once when created.</span>
        </div>
      )}

      {/* Actions */}
      {userRole === 'admin' && (
        <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => onDelete(channel)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Channel
          </button>
        </div>
      )}
    </div>
  );
}

function Globe(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>
    </svg>
  );
}