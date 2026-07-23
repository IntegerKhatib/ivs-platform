import { useMemo, useRef, useState } from "react";
import "../styles/mambridge.css";
import {
  Archive,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  FileAudio,
  FileImage,
  FileText,
  FileVideo,
  Film,
  Globe2,
  Hash,
  Info,
  LoaderCircle,
  MapPin,
  RotateCcw,
  ShieldCheck,
  Tag,
  UploadCloud,
  UserRound,
  X,
} from "lucide-react";
import {
  abortAssetUpload,
  completeAssetUpload,
  getPartUploadUrls,
  initiateAssetUpload,
  uploadPart,
} from "../api/assets";

const ACCEPTED = ["video/*", "audio/*", "image/*", ".mxf", ".mov", ".mp4", ".wav", ".mp3", ".jpg", ".jpeg", ".png"];
const DEFAULT_PART_SIZE = 64 * 1024 * 1024;

const initialMetadata = {
  assetName: "",
  description: "",
  notes: "",
  tags: [],
  category: "",
  language: "",
  source: "",
  productionDate: "",
  rightsOwner: "",
  rightsExpiryDate: "",
  location: "",
  externalReference: "",
  retentionClass: "Standard",
};

function formatBytes(bytes = 0) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index > 1 ? 1 : 0)} ${units[index]}`;
}

function fileIcon(file) {
  if (!file) return Film;
  if (file.type.startsWith("video/")) return FileVideo;
  if (file.type.startsWith("audio/")) return FileAudio;
  if (file.type.startsWith("image/")) return FileImage;
  return FileText;
}

function Input({ label, required, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">
        {label}{required && <span className="text-rose-500">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

export default function MAMBridge({ onUploaded }) {
  const fileInputRef = useRef(null);
  const abortControllerRef = useRef(null);
  const [file, setFile] = useState(null);
  const [metadata, setMetadata] = useState(initialMetadata);
  const [tagText, setTagText] = useState("");
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const uploadSessionRef = useRef(null);

  const FileIcon = useMemo(() => fileIcon(file), [file]);
  const isBusy = ["preparing", "uploading", "completing"].includes(status);
  const canUpload = Boolean(file && metadata.assetName.trim() && !isBusy);

  const update = (field, value) => setMetadata((current) => ({ ...current, [field]: value }));

  const selectFile = (selected) => {
    if (!selected || isBusy) return;
    setFile(selected);
    setResult(null);
    setError("");
    setProgress(0);
    setUploadedBytes(0);
    if (!metadata.assetName) update("assetName", selected.name.replace(/\.[^/.]+$/, ""));
  };

  const addTag = () => {
    const value = tagText.trim();
    if (!value || metadata.tags.includes(value)) return setTagText("");
    update("tags", [...metadata.tags, value]);
    setTagText("");
  };

  const removeTag = (value) => update("tags", metadata.tags.filter((tag) => tag !== value));

  const reset = () => {
    setFile(null);
    setMetadata(initialMetadata);
    setTagText("");
    setStatus("idle");
    setProgress(0);
    setUploadedBytes(0);
    setSpeed(0);
    setError("");
    setResult(null);
  };

  const cancelUpload = async () => {
    abortControllerRef.current?.abort();
    const session = uploadSessionRef.current;
    if (session?.assetId && session?.uploadId) {
      try { await abortAssetUpload(session.assetId, session.uploadId); } catch { /* best effort */ }
    }
    setStatus("cancelled");
    setError("Upload cancelled. You can retry when ready.");
  };

  const startUpload = async () => {
    if (!canUpload) return;
    setError("");
    setResult(null);
    setStatus("preparing");
    setProgress(0);
    setUploadedBytes(0);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const startedAt = Date.now();

    try {
      const session = await initiateAssetUpload({
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type || "application/octet-stream",
        metadata,
      });
      uploadSessionRef.current = session;

      const partSize = session.partSize || DEFAULT_PART_SIZE;
      const totalParts = Math.ceil(file.size / partSize);
      const partNumbers = Array.from({ length: totalParts }, (_, index) => index + 1);
      const urlResponse = await getPartUploadUrls(session.assetId, session.uploadId, partNumbers);
      const urls = urlResponse.parts || urlResponse.urls || [];
      if (urls.length !== totalParts) throw new Error("The backend did not return an upload URL for every file part.");

      setStatus("uploading");
      let completedBytes = 0;
      const completedParts = [];

      for (let index = 0; index < totalParts; index += 1) {
        const partNumber = index + 1;
        const start = index * partSize;
        const end = Math.min(start + partSize, file.size);
        const blob = file.slice(start, end);
        const entry = urls.find((item) => item.partNumber === partNumber) || urls[index];

        const etag = await uploadPart(
          entry.url || entry,
          blob,
          (partLoaded) => {
            const currentBytes = completedBytes + Math.min(partLoaded, blob.size);
            const elapsed = Math.max((Date.now() - startedAt) / 1000, 0.1);
            setUploadedBytes(currentBytes);
            setProgress(Math.min(100, Math.round((currentBytes / file.size) * 100)));
            setSpeed(currentBytes / elapsed);
          },
          controller.signal,
        );

        completedBytes += blob.size;
        completedParts.push({ partNumber, etag });
      }

      setStatus("completing");
      const completed = await completeAssetUpload(session.assetId, session.uploadId, completedParts, metadata);
      setProgress(100);
      setUploadedBytes(file.size);
      setStatus("completed");
      setResult(completed);
      onUploaded?.(completed);
    } catch (uploadError) {
      if (uploadError?.name === "CanceledError" || uploadError?.name === "AbortError") return;
      setStatus("failed");
      setError(uploadError?.response?.data?.message || uploadError?.message || "Upload failed. Please try again.");
    }
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 p-5 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            <Archive className="h-4 w-4" /> MAM BRIDGE
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Upload a new media asset</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Send original media directly to Amazon S3 and register searchable editorial metadata.</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          <ShieldCheck className="h-4 w-4 text-emerald-500" /> Private, encrypted S3 upload
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(420px,.85fr)]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 px-6 py-5 dark:border-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-white">Media file</h2>
            <p className="mt-1 text-sm text-slate-500">Choose the original asset to upload.</p>
          </div>
          <div className="space-y-5 p-6">
            <button
              type="button"
              disabled={isBusy}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => { event.preventDefault(); setDragging(false); selectFile(event.dataTransfer.files?.[0]); }}
              className={`group flex min-h-64 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 text-center transition ${dragging ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" : "border-slate-300 bg-slate-50/70 hover:border-emerald-400 hover:bg-emerald-50/40 dark:border-slate-700 dark:bg-slate-950/40"}`}
            >
              <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200 group-hover:scale-105 dark:bg-slate-900 dark:ring-slate-700">
                <UploadCloud className="h-7 w-7" />
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">Drop your media file here</span>
              <span className="mt-1 text-sm text-slate-500">or click to browse from your computer</span>
              <span className="mt-4 rounded-full bg-white px-3 py-1 text-xs text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">MP4, MOV, MXF, WAV, MP3, JPEG or PNG</span>
            </button>
            <input ref={fileInputRef} hidden type="file" accept={ACCEPTED.join(",")} onChange={(event) => selectFile(event.target.files?.[0])} />

            {file && (
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"><FileIcon className="h-6 w-6" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{file.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatBytes(file.size)} · {file.type || "Unknown media type"}</p>
                  </div>
                  {!isBusy && <button type="button" onClick={() => setFile(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"><X className="h-4 w-4" /></button>}
                </div>

                {status !== "idle" && (
                  <div className="mt-5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-600 dark:text-slate-300">{status === "preparing" ? "Preparing secure upload…" : status === "completing" ? "Finalizing asset…" : status === "completed" ? "Upload complete" : status === "failed" ? "Upload failed" : "Uploading to S3"}</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{progress}%</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-emerald-500 transition-all duration-300" style={{ width: `${progress}%` }} /></div>
                    <div className="flex justify-between text-xs text-slate-400"><span>{formatBytes(uploadedBytes)} of {formatBytes(file.size)}</span><span>{speed > 0 ? `${formatBytes(speed)}/s` : ""}</span></div>
                  </div>
                )}
              </div>
            )}

            {error && <div className="flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0" /><span>{error}</span></div>}
            {result && <div className="flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/30"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /><div><p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Asset uploaded successfully</p><p className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-400">Asset ID: {result.assetId || uploadSessionRef.current?.assetId || "Created"}</p></div></div>}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 px-6 py-5 dark:border-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-white">Asset metadata</h2>
            <p className="mt-1 text-sm text-slate-500">Describe, classify and control the asset.</p>
          </div>
          <div className="max-h-[calc(100vh-250px)] space-y-5 overflow-y-auto p-6">
            <Input label="Asset name" required><input disabled={isBusy} value={metadata.assetName} onChange={(e) => update("assetName", e.target.value)} className="form-input" placeholder="e.g. Football Final Highlights" /></Input>
            <Input label="Asset description"><textarea disabled={isBusy} value={metadata.description} onChange={(e) => update("description", e.target.value)} className="form-input min-h-24 resize-y" placeholder="A concise description of the content…" /></Input>
            <Input label="Notes"><textarea disabled={isBusy} value={metadata.notes} onChange={(e) => update("notes", e.target.value)} className="form-input min-h-20 resize-y" placeholder="Internal editorial or operational notes…" /></Input>

            <Input label="Tags" hint="Press Enter or comma to add a tag.">
              <div className="rounded-xl border border-slate-300 bg-white p-2 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-950">
                <div className="flex flex-wrap gap-1.5">{metadata.tags.map((value) => <span key={value} className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"><Tag className="h-3 w-3" />{value}<button type="button" onClick={() => removeTag(value)}><X className="h-3 w-3" /></button></span>)}</div>
                <input disabled={isBusy} value={tagText} onChange={(e) => setTagText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }} onBlur={addTag} className="mt-1 w-full border-0 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-slate-400" placeholder="sports, highlights, final" />
              </div>
            </Input>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Category"><div className="relative"><select disabled={isBusy} value={metadata.category} onChange={(e) => update("category", e.target.value)} className="form-input appearance-none pr-9"><option value="">Select category</option><option>Sports</option><option>News</option><option>Entertainment</option><option>Documentary</option><option>Commercial</option><option>Other</option></select><ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-400" /></div></Input>
              <Input label="Language"><div className="relative"><Globe2 className="input-icon" /><input disabled={isBusy} value={metadata.language} onChange={(e) => update("language", e.target.value)} className="form-input pl-10" placeholder="English" /></div></Input>
              <Input label="Source / provider"><div className="relative"><UserRound className="input-icon" /><input disabled={isBusy} value={metadata.source} onChange={(e) => update("source", e.target.value)} className="form-input pl-10" placeholder="Stadium feed" /></div></Input>
              <Input label="Production date"><div className="relative"><CalendarDays className="input-icon" /><input disabled={isBusy} type="date" value={metadata.productionDate} onChange={(e) => update("productionDate", e.target.value)} className="form-input pl-10" /></div></Input>
              <Input label="Location"><div className="relative"><MapPin className="input-icon" /><input disabled={isBusy} value={metadata.location} onChange={(e) => update("location", e.target.value)} className="form-input pl-10" placeholder="Dubai, UAE" /></div></Input>
              <Input label="Rights owner"><input disabled={isBusy} value={metadata.rightsOwner} onChange={(e) => update("rightsOwner", e.target.value)} className="form-input" placeholder="Organization" /></Input>
              <Input label="Rights expiry"><input disabled={isBusy} type="date" value={metadata.rightsExpiryDate} onChange={(e) => update("rightsExpiryDate", e.target.value)} className="form-input" /></Input>
              <Input label="External reference"><div className="relative"><Hash className="input-icon" /><input disabled={isBusy} value={metadata.externalReference} onChange={(e) => update("externalReference", e.target.value)} className="form-input pl-10" placeholder="MAM-2026-001" /></div></Input>
              <Input label="Retention class"><select disabled={isBusy} value={metadata.retentionClass} onChange={(e) => update("retentionClass", e.target.value)} className="form-input"><option>Standard</option><option>Archive</option><option>Temporary</option><option>Legal hold</option></select></Input>
            </div>

            <div className="flex gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-500 dark:bg-slate-950/60 dark:text-slate-400"><Info className="mt-0.5 h-4 w-4 shrink-0" />Technical fields such as filename, file size, MIME type, checksum, upload user and S3 path should be generated automatically by the backend.</div>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4 dark:border-slate-800 dark:bg-slate-950/30">
            <button type="button" disabled={isBusy} onClick={reset} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-white disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"><RotateCcw className="h-4 w-4" />Reset</button>
            {isBusy ? <button type="button" onClick={cancelUpload} className="rounded-xl border border-rose-200 bg-white px-5 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:bg-slate-900">Cancel upload</button> : <button type="button" disabled={!canUpload} onClick={startUpload} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40">{status === "completed" ? <><UploadCloud className="h-4 w-4" />Upload another</> : <><UploadCloud className="h-4 w-4" />Upload asset</>}</button>}
          </div>
        </section>
      </div>
    </div>
  );
}
