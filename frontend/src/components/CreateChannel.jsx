import { useEffect, useState } from "react";
import {
  Archive,
  Clock3,
  Globe,
  Loader2,
  Plus,
  Radio,
  Tag,
  Trash2,
  X,
} from "lucide-react";

const EMPTY_TAG = { key: "", value: "" };
const RECORDING_REGION = "eu-west-1";
const RECORDING_BUCKET = "awsivs-emp-platform-950363885603";

export default function CreateChannel({ onCreated }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [region, setRegion] = useState("us-east-1");
  const [type, setType] = useState("STANDARD");
  const [latencyMode, setLatencyMode] = useState("LOW");
  const [tags, setTags] = useState([{ ...EMPTY_TAG }]);
  const [autoRecord, setAutoRecord] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const recordingAvailable = region === RECORDING_REGION;

  useEffect(() => {
    if (!recordingAvailable) setAutoRecord(false);
  }, [recordingAvailable]);

  const closeModal = () => {
    if (!isCreating) setIsOpen(false);
  };

  const updateTag = (index, field, value) => {
    setTags((current) =>
      current.map((tag, tagIndex) =>
        tagIndex === index ? { ...tag, [field]: value } : tag,
      ),
    );
  };

  const removeTag = (index) => {
    setTags((current) => {
      const next = current.filter((_, tagIndex) => tagIndex !== index);
      return next.length ? next : [{ ...EMPTY_TAG }];
    });
  };

  const resetForm = () => {
    setName("");
    setRegion("us-east-1");
    setType("STANDARD");
    setLatencyMode("LOW");
    setTags([{ ...EMPTY_TAG }]);
    setAutoRecord(false);
    setError("");
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setError("");

    if (!/^[a-zA-Z0-9-_]+$/.test(name.trim())) {
      setError(
        "Channel name can contain only letters, numbers, hyphens, and underscores.",
      );
      return;
    }

    const tagMap = {};
    for (const tag of tags) {
      const key = tag.key.trim();
      if (!key) continue;
      if (Object.prototype.hasOwnProperty.call(tagMap, key)) {
        setError(`Duplicate tag key: ${key}`);
        return;
      }
      tagMap[key] = tag.value.trim();
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/channels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          region,
          type,
          latencyMode,
          tags: tagMap,
          autoRecord,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to create channel.");
      }

      onCreated(result.data);
      resetForm();
      setIsOpen(false);
    } catch (requestError) {
      setError(requestError.message || "Network error");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <div className="mb-6 flex justify-end">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
        >
          <Plus className="h-4 w-4" />
          Create channel
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-6 py-5 dark:border-slate-700 dark:bg-slate-900">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Create channel
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Configure channel delivery and recording settings.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-6 p-6">
              <section>
                <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-white">
                  Channel configuration
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="md:col-span-2">
                    <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Channel name
                    </span>
                    <input
                      required
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="example-live-channel"
                      className={inputClass}
                    />
                  </label>

                  <label>
                    <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      <Globe className="h-3.5 w-3.5" /> Region
                    </span>
                    <select
                      value={region}
                      onChange={(event) => setRegion(event.target.value)}
                      className={inputClass}
                    >
                      <option value="us-east-1">US East (N. Virginia)</option>
                      <option value="us-west-2">US West (Oregon)</option>
                      <option value="eu-west-1">EU West (Ireland)</option>
                    </select>
                  </label>

                  <label>
                    <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      <Radio className="h-3.5 w-3.5" /> Channel type
                    </span>
                    <select
                      value={type}
                      onChange={(event) => setType(event.target.value)}
                      className={inputClass}
                    >
                      <option value="BASIC">Basic</option>
                      <option value="STANDARD">Standard</option>
                      <option value="ADVANCED_SD">Advanced SD</option>
                      <option value="ADVANCED_HD">Advanced HD</option>
                    </select>
                  </label>

                  <label>
                    <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      <Clock3 className="h-3.5 w-3.5" /> Video latency
                    </span>
                    <select
                      value={latencyMode}
                      onChange={(event) => setLatencyMode(event.target.value)}
                      className={inputClass}
                    >
                      <option value="LOW">Low latency</option>
                      <option value="NORMAL">Normal latency</option>
                    </select>
                  </label>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/40">
                      <Archive className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Auto-record to S3
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {recordingAvailable
                          ? `Store live recordings in ${RECORDING_BUCKET}.`
                          : "Auto-recording is available only for channels in EU West (Ireland)."}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={autoRecord}
                    disabled={!recordingAvailable}
                    onClick={() => setAutoRecord((current) => !current)}
                    className={`relative h-6 w-11 flex-shrink-0 rounded-full transition ${
                      autoRecord ? "bg-orange-600" : "bg-slate-300 dark:bg-slate-700"
                    } disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                        autoRecord ? "left-5.5 translate-x-0" : "left-0.5"
                      }`}
                      style={{ left: autoRecord ? "22px" : "2px" }}
                    />
                  </button>
                </div>
              </section>

              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                    <Tag className="h-4 w-4" /> Tags
                  </h3>
                  <button
                    type="button"
                    onClick={() => setTags((current) => [...current, { ...EMPTY_TAG }])}
                    className="text-xs font-semibold text-orange-600 hover:text-orange-700"
                  >
                    + Add tag
                  </button>
                </div>
                <div className="space-y-2">
                  {tags.map((tag, index) => (
                    <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                      <input
                        value={tag.key}
                        onChange={(event) => updateTag(index, "key", event.target.value)}
                        placeholder="Key"
                        className={inputClass}
                      />
                      <input
                        value={tag.value}
                        onChange={(event) => updateTag(index, "value", event.target.value)}
                        placeholder="Value"
                        className={inputClass}
                      />
                      <button
                        type="button"
                        onClick={() => removeTag(index)}
                        className="rounded-xl border border-slate-200 px-3 text-slate-400 hover:bg-slate-50 hover:text-red-500 dark:border-slate-700 dark:hover:bg-slate-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5 dark:border-slate-700">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isCreating}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
                >
                  {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create channel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white";
