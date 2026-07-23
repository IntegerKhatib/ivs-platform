import { useState, useEffect } from "react";
import ChannelCard from "./ChannelCard";
import { Loader2, Inbox, AlertTriangle, X } from "lucide-react";

const SUPPORTED_REGIONS = ["us-east-1", "us-west-2", "eu-west-1"];

export default function ChannelList({ newChannel, addNotification, userRole, isLiveOnly }) {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

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

  const requestDelete = (channel) => {
    setDeleteError("");
    setPendingDelete(channel);
  };

  const confirmDelete = async () => {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/channels/${encodeURIComponent(pendingDelete.arn)}?region=${pendingDelete.region}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Unable to delete event.");
      setChannels(prev => prev.filter(c => c.arn !== pendingDelete.arn));
      addNotification(`Event "${pendingDelete.name}" deleted.`, "delete");
      setPendingDelete(null);
    } catch (error) {
      setDeleteError(error.message || "Unable to delete event.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mb-3" />
        <span className="text-sm">Loading {isLiveOnly ? 'live ' : ''}events...</span>
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
          {isLiveOnly ? 'No events are currently live' : 'No events yet'}
        </h3>
        {!isLiveOnly && userRole === 'admin' && (
          <p className="text-xs text-slate-400">Create your first event using the form above</p>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {channels.map(ch => <ChannelCard key={ch.arn} channel={ch} onDelete={requestDelete} userRole={userRole} />)}
      </div>

      {pendingDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="delete-event-title">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-700">
              <div className="flex gap-3">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"><AlertTriangle className="h-5 w-5" /></div>
                <div><h2 id="delete-event-title" className="text-lg font-bold text-slate-900 dark:text-white">Delete event?</h2><p className="mt-1 text-sm text-slate-500">This action cannot be undone.</p></div>
              </div>
              <button type="button" onClick={() => !deleting && setPendingDelete(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">Are you sure you want to permanently delete <span className="font-semibold text-slate-900 dark:text-white">{pendingDelete.name || "this event"}</span>?</p>
              {deleteError && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{deleteError}</div>}
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-950/40">
              <button type="button" onClick={() => setPendingDelete(null)} disabled={deleting} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">Cancel</button>
              <button type="button" onClick={confirmDelete} disabled={deleting} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">{deleting ? "Deleting…" : "Delete event"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}