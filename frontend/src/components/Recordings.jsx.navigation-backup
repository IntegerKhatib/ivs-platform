import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Database,
  Download,
  File,
  Folder,
  FolderOpen,
  FolderPlus,
  HardDrive,
  Loader2,
  Radio,
  RefreshCw,
  Search,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const RECORDING_BUCKET = "awsivs-emp-platform-950363885603";
const RECORDING_REGION = "eu-west-1";
const IVS_ROOT = "ivs/v1/";

const inputClass =
  "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-orange-950";

function formatBytes(bytes) {
  const value = Number(bytes || 0);
  if (!value) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),
    units.length - 1,
  );
  return `${(value / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}

function formatDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not available" : date.toLocaleString();
}

function shortId(value, length = 12) {
  if (!value) return "Unknown";
  return value.length > length ? `${value.slice(0, length)}…` : value;
}

function StatCard({ label, value, detail, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-500">{detail}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/40">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function Recordings() {
  const { user } = useAuth();
  const token = localStorage.getItem("token");
  const [view, setView] = useState("sessions");
  const [prefix, setPrefix] = useState(IVS_ROOT);
  const [browserData, setBrowserData] = useState({
    folders: [],
    files: [],
  });
  const [sessionData, setSessionData] = useState({
    sessions: [],
    summary: {},
  });
  const [folderName, setFolderName] = useState("");
  const [search, setSearch] = useState("");
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingBrowser, setLoadingBrowser] = useState(false);
  const [error, setError] = useState("");

  const crumbs = useMemo(() => {
    const parts = prefix.split("/").filter(Boolean);
    const result = [{ label: RECORDING_BUCKET, prefix: "" }];
    let current = "";
    for (const part of parts) {
      current += `${part}/`;
      result.push({ label: part, prefix: current });
    }
    return result;
  }, [prefix]);

  const filteredSessions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sessionData.sessions || [];

    return (sessionData.sessions || []).filter((session) =>
      [
        session.channelId,
        session.recordingId,
        session.status,
        session.prefix,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [search, sessionData.sessions]);

  const loadSessions = async () => {
    setLoadingSessions(true);
    setError("");
    try {
      const response = await fetch("/api/recordings/sessions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to load recording sessions.");
      }
      setSessionData(result.data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoadingSessions(false);
    }
  };

  const loadBrowser = async (nextPrefix = prefix) => {
    setLoadingBrowser(true);
    setError("");
    try {
      const params = new URLSearchParams({ prefix: nextPrefix });
      const response = await fetch(`/api/recordings/objects?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to load recording storage.");
      }
      setPrefix(result.data.prefix || "");
      setBrowserData({
        folders: result.data.folders || [],
        files: result.data.files || result.data.objects || [],
      });
    } catch (requestError) {
      setError(requestError.message);
      setBrowserData({ folders: [], files: [] });
    } finally {
      setLoadingBrowser(false);
    }
  };

  useEffect(() => {
    loadSessions();
    loadBrowser(IVS_ROOT);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = async () => {
    if (view === "sessions") {
      await loadSessions();
    } else {
      await loadBrowser(prefix);
    }
  };

  const createFolder = async () => {
    if (!folderName.trim()) return;
    setError("");
    try {
      const response = await fetch("/api/recordings/folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prefix, folderName: folderName.trim() }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to create folder.");
      }
      setFolderName("");
      await loadBrowser(prefix);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const download = async (key) => {
    if (!key) return;
    setError("");
    try {
      const response = await fetch("/api/recordings/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ key }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to create download link.");
      }
      window.location.assign(result.data.url);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const browseSession = async (sessionPrefix) => {
    setView("browser");
    await loadBrowser(sessionPrefix);
  };

  const goUp = () => {
    const parts = prefix.split("/").filter(Boolean);
    if (!parts.length) return;
    const parent = parts.length > 1 ? `${parts.slice(0, -1).join("/")}/` : "";
    loadBrowser(parent);
  };

  const summary = sessionData.summary || {};

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Recordings
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Review recorded sessions, browse their files, and download assets.
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loadingSessions || loadingBrowser}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              loadingSessions || loadingBrowser ? "animate-spin" : ""
            }`}
          />
          Refresh
        </button>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/40">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {RECORDING_BUCKET}
              </p>
              <p className="text-xs text-slate-500">
                EU West (Ireland) · {RECORDING_REGION}
              </p>
            </div>
          </div>
          <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button
              onClick={() => setView("sessions")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                view === "sessions"
                  ? "bg-white text-orange-600 shadow-sm dark:bg-slate-900"
                  : "text-slate-500"
              }`}
            >
              Recording sessions
            </button>
            <button
              onClick={() => setView("browser")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                view === "browser"
                  ? "bg-white text-orange-600 shadow-sm dark:bg-slate-900"
                  : "text-slate-500"
              }`}
            >
              Storage browser
            </button>
          </div>
        </div>
        <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-xs leading-5 text-orange-800 dark:border-orange-900 dark:bg-orange-950/30 dark:text-orange-300">
          Amazon IVS stores each session under its managed{" "}
          <strong>ivs/v1/...</strong> hierarchy. The session view groups those
          nested folders into one readable recording entry.
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {view === "sessions" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Recording sessions"
              value={summary.totalSessions || 0}
              detail="Sessions discovered in S3"
              icon={Archive}
            />
            <StatCard
              label="Recording now"
              value={summary.activeSessions || 0}
              detail="Sessions without an end marker"
              icon={Radio}
            />
            <StatCard
              label="Completed"
              value={summary.completedSessions || 0}
              detail="Sessions with recording-ended metadata"
              icon={CheckCircle2}
            />
            <StatCard
              label="Stored data"
              value={formatBytes(summary.totalSize)}
              detail={`${summary.totalFiles || 0} objects`}
              icon={HardDrive}
            />
          </div>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by channel or recording ID"
                  className={`${inputClass} w-full pl-9`}
                />
              </div>
            </div>

            {loadingSessions ? (
              <div className="flex items-center justify-center py-20 text-slate-400">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading recording sessions...
              </div>
            ) : filteredSessions.length ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSessions.map((session) => (
                  <div
                    key={session.prefix}
                    className="grid gap-4 px-5 py-4 lg:grid-cols-[1.25fr_1fr_auto] lg:items-center"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/40">
                        <Archive className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                            Channel {shortId(session.channelId, 16)}
                          </p>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                              session.status === "COMPLETED"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                                : "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300"
                            }`}
                          >
                            {session.status === "COMPLETED"
                              ? "Completed"
                              : "Recording"}
                          </span>
                        </div>
                        <p className="mt-1 truncate font-mono text-xs text-slate-400">
                          {session.recordingId}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-slate-400">Started</p>
                        <p className="mt-1 font-semibold text-slate-700 dark:text-slate-200">
                          {formatDate(session.startedAt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400">Storage</p>
                        <p className="mt-1 font-semibold text-slate-700 dark:text-slate-200">
                          {formatBytes(session.totalSize)} · {session.fileCount} files
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      {session.manifestKey && (
                        <button
                          onClick={() => download(session.manifestKey)}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Manifest
                        </button>
                      )}
                      <button
                        onClick={() => browseSession(session.prefix)}
                        className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-700"
                      >
                        <FolderOpen className="h-3.5 w-3.5" />
                        Browse files
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 py-20 text-center">
                <Archive className="mx-auto h-9 w-9 text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  No recording sessions found
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Start a stream on a recording-enabled channel, then refresh.
                </p>
              </div>
            )}
          </section>
        </>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <button
                onClick={goUp}
                disabled={!prefix}
                className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
                title="Go to parent folder"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex min-w-0 flex-wrap items-center gap-1 text-sm">
                {crumbs.map((crumb, index) => (
                  <div key={crumb.prefix || "root"} className="flex items-center gap-1">
                    <button
                      onClick={() => loadBrowser(crumb.prefix)}
                      className="max-w-48 truncate font-medium text-slate-600 hover:text-orange-600 dark:text-slate-300"
                    >
                      {crumb.label}
                    </button>
                    {index < crumbs.length - 1 && (
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {user?.role === "admin" && (
              <div className="flex gap-2">
                <input
                  value={folderName}
                  onChange={(event) => setFolderName(event.target.value)}
                  onKeyDown={(event) =>
                    event.key === "Enter" && createFolder()
                  }
                  placeholder="New folder"
                  className={`${inputClass} min-w-44`}
                />
                <button
                  onClick={createFolder}
                  disabled={!folderName.trim()}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  <FolderPlus className="h-4 w-4" />
                  Create
                </button>
              </div>
            )}
          </div>

          {loadingBrowser ? (
            <div className="flex items-center justify-center py-20 text-slate-400">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading storage...
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {(browserData.folders || []).map((folder) => (
                <button
                  key={folder.prefix || folder.key}
                  onClick={() => loadBrowser(folder.prefix || folder.key)}
                  className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/40">
                    <Folder className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {folder.name}
                    </p>
                    <p className="text-xs text-slate-400">Folder</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>
              ))}

              {(browserData.files || []).map((file) => (
                <div key={file.key} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800">
                    <File className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatBytes(file.size)} · {formatDate(file.lastModified)}
                    </p>
                  </div>
                  <button
                    onClick={() => download(file.key)}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </button>
                </div>
              ))}

              {!browserData.folders?.length &&
                !browserData.files?.length && (
                  <div className="px-5 py-20 text-center">
                    <Folder className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-3 text-sm font-medium text-slate-500">
                      This folder is empty
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Recorded objects can take a short time to appear.
                    </p>
                  </div>
                )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
