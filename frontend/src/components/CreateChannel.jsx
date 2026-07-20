import { useState } from "react";
import { Plus, Globe, Tag, Loader2 } from "lucide-react";

export default function CreateChannel({ onCreated }) {
  const [name, setName] = useState("");
  const [region, setRegion] = useState("us-east-1");
  const [tagsInput, setTagsInput] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsCreating(true);
    try {
      const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0);
      const r = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ name: name.trim(), region, tags })
      });
      const d = await r.json();
      if (d.success) { setName(""); setTagsInput(""); onCreated(d.data); } else alert(d.error);
    } catch { alert("Network error"); }
    finally { setIsCreating(false); }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg flex items-center justify-center">
          <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Create New Channel</h3>
      </div>

      <form onSubmit={handleCreate} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Channel Name</label>
          <div className="relative">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              required
              disabled={isCreating}
              placeholder="My Live Stream"
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:opacity-50"
            />
          </div>
        </div>

        <div className="w-full sm:w-44">
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
            <Globe className="w-3 h-3 inline mr-1" />
            Region
          </label>
          <select
            value={region}
            onChange={e => setRegion(e.target.value)}
            disabled={isCreating}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:opacity-50"
          >
            <option value="us-east-1">US East (N. Virginia)</option>
            <option value="us-west-2">US West (Oregon)</option>
            <option value="eu-west-1">EU (Ireland)</option>
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
            <Tag className="w-3 h-3 inline mr-1" />
            Tags (comma separated)
          </label>
          <input
            value={tagsInput}
            onChange={e => setTagsInput(e.target.value)}
            disabled={isCreating}
            placeholder="sports, news, english"
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={isCreating || !name.trim()}
          className="flex items-center justify-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {isCreating ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
          ) : (
            <><Plus className="w-4 h-4" /> Create</>
          )}
        </button>
      </form>
    </div>
  );
}