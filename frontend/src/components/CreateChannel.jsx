import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  BrainCircuit,
  CalendarDays,
  ChevronDown,
  Clock3,
  FileText,
  Globe,
  Languages,
  Loader2,
  MapPin,
  Plus,
  Radio,
  Tag,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

const EMPTY_METADATA = { key: "", value: "" };
const RECORDING_REGION = "eu-west-1";

const inputClass =
  "block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white";

const sectionClass =
  "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900";

const defaultForm = {
  name: "",
  title: "",
  description: "",
  program: "",
  eventType: "Sports",
  eventDate: "",
  eventQuality: "STANDARD",
  deliveryRegion: "eu-west-1",
  streamLatency: "LOW",

  titleAr: "",
  titleEn: "",
  titleFr: "",
  eventTag: "",
  headlineAr: "",
  headlineEn: "",
  headlineFr: "",
  location: "",
  contributor: "",

  userName: "",
  organization: "",

  recordingEnabled: false,
  recordingStartAt: "",
  recordingEndAt: "",

  transcriptLanguage: "NONE",
};

export default function CreateChannel({ onCreated }) {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [metadata, setMetadata] = useState([{ ...EMPTY_METADATA }]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const recordingAvailable = form.deliveryRegion === RECORDING_REGION;

  useEffect(() => {
    if (!recordingAvailable && form.recordingEnabled) {
      setForm((current) => ({ ...current, recordingEnabled: false }));
    }
  }, [recordingAvailable, form.recordingEnabled]);

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateMetadata = (index, field, value) => {
    setMetadata((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  const removeMetadata = (index) => {
    setMetadata((current) => {
      const next = current.filter((_, itemIndex) => itemIndex !== index);
      return next.length ? next : [{ ...EMPTY_METADATA }];
    });
  };

  const reset = () => {
    setForm(defaultForm);
    setMetadata([{ ...EMPTY_METADATA }]);
    setError("");
  };

  const closeModal = () => {
    if (!isCreating) setIsOpen(false);
  };

  const builtInTags = useMemo(
    () => ({
      EventTitle: form.title,
      EventDescription: form.description,
      Program: form.program,
      EventType: form.eventType,
      EventDate: form.eventDate,
      TitleAR: form.titleAr,
      TitleEN: form.titleEn,
      TitleFR: form.titleFr,
      EventTag: form.eventTag,
      HeadlineAR: form.headlineAr,
      HeadlineEN: form.headlineEn,
      HeadlineFR: form.headlineFr,
      Location: form.location,
      Contributor: form.contributor,
      CreatedBy: form.userName,
      Organization: form.organization,
      RecordingStartAt: form.recordingStartAt,
      RecordingEndAt: form.recordingEndAt,
      TranscriptLanguage: form.transcriptLanguage,
    }),
    [form],
  );

  const handleCreate = async (event) => {
    event.preventDefault();
    setError("");

    if (!/^[a-zA-Z0-9-_]+$/.test(form.name.trim())) {
      setError("Event name can contain only letters, numbers, hyphens, and underscores.");
      return;
    }

    if (!form.title.trim()) {
      setError("Event title is required.");
      return;
    }

    const tagMap = {};

    for (const [key, value] of Object.entries(builtInTags)) {
      if (String(value ?? "").trim()) tagMap[key] = String(value).trim();
    }

    for (const item of metadata) {
      const key = item.key.trim();
      if (!key) continue;
      if (Object.prototype.hasOwnProperty.call(tagMap, key)) {
        setError(`Duplicate metadata key: ${key}`);
        return;
      }
      tagMap[key] = item.value.trim();
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
          name: form.name.trim(),
          region: form.deliveryRegion,
          type: form.eventQuality,
          latencyMode: form.streamLatency,
          tags: tagMap,
          autoRecord: form.recordingEnabled,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to create event.");
      }

      onCreated(result.data);
      reset();
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
          className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700"
        >
          <Plus className="h-4 w-4" />
          Create event
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[94vh] w-full max-w-6xl overflow-y-auto rounded-3xl border border-slate-200 bg-slate-50 shadow-2xl dark:border-slate-700 dark:bg-slate-950">
            <div className="sticky top-0 z-20 flex items-start justify-between border-b border-slate-200 bg-white/95 px-6 py-5 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Create new event
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Define editorial information, user ownership, recording, and AI-processing options.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close create event"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-6 p-6">
              <section className={sectionClass}>
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/40">
                    <Radio className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">1. Event</h3>
                    <p className="text-xs text-slate-500">Core event and stream-delivery information.</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Name" required className="md:col-span-1">
                    <input
                      required
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                      placeholder="dubai-football-final"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Title" required>
                    <input
                      required
                      value={form.title}
                      onChange={(e) => update("title", e.target.value)}
                      placeholder="Dubai Football Final"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Description" className="md:col-span-2">
                    <textarea
                      value={form.description}
                      onChange={(e) => update("description", e.target.value)}
                      rows={3}
                      placeholder="Describe the event."
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Program">
                    <input
                      value={form.program}
                      onChange={(e) => update("program", e.target.value)}
                      placeholder="Sports Program"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Event type" icon={Radio}>
                    <select
                      value={form.eventType}
                      onChange={(e) => update("eventType", e.target.value)}
                      className={inputClass}
                    >
                      <option>Sports</option>
                      <option>Conference</option>
                      <option>News</option>
                      <option>Entertainment</option>
                      <option>Corporate</option>
                      <option>Training</option>
                      <option>Religious</option>
                      <option>Other</option>
                    </select>
                  </Field>

                  <Field label="Event date" icon={CalendarDays}>
                    <input
                      type="date"
                      value={form.eventDate}
                      onChange={(e) => update("eventDate", e.target.value)}
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Event quality" icon={Radio}>
                    <select
                      value={form.eventQuality}
                      onChange={(e) => update("eventQuality", e.target.value)}
                      className={inputClass}
                    >
                      <option value="BASIC">Basic — SD / cost optimized</option>
                      <option value="STANDARD">Standard — HD / recommended</option>
                      <option value="ADVANCED_SD">Advanced SD</option>
                      <option value="ADVANCED_HD">Premium — Advanced HD</option>
                    </select>
                  </Field>

                  <Field label="Delivery region" icon={Globe}>
                    <select
                      value={form.deliveryRegion}
                      onChange={(e) => update("deliveryRegion", e.target.value)}
                      className={inputClass}
                    >
                      <option value="us-east-1">US East (N. Virginia)</option>
                      <option value="us-west-2">US West (Oregon)</option>
                      <option value="eu-west-1">EU West (Ireland)</option>
                    </select>
                  </Field>

                  <Field label="Stream latency" icon={Clock3}>
                    <select
                      value={form.streamLatency}
                      onChange={(e) => update("streamLatency", e.target.value)}
                      className={inputClass}
                    >
                      <option value="LOW">Low latency</option>
                      <option value="NORMAL">Normal latency</option>
                    </select>
                  </Field>
                </div>

                <div className="mt-5">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                        <Tag className="h-4 w-4" /> Additional event metadata
                      </h4>
                      <p className="mt-1 text-xs text-slate-500">Optional key/value metadata.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMetadata((current) => [...current, { ...EMPTY_METADATA }])}
                      className="text-xs font-semibold text-orange-600 hover:text-orange-700"
                    >
                      + Add metadata
                    </button>
                  </div>

                  <div className="space-y-2">
                    {metadata.map((item, index) => (
                      <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                        <input
                          value={item.key}
                          onChange={(e) => updateMetadata(index, "key", e.target.value)}
                          placeholder="Key"
                          className={inputClass}
                        />
                        <input
                          value={item.value}
                          onChange={(e) => updateMetadata(index, "value", e.target.value)}
                          placeholder="Value"
                          className={inputClass}
                        />
                        <button
                          type="button"
                          onClick={() => removeMetadata(index)}
                          className="rounded-xl border border-slate-200 px-3 text-slate-400 hover:bg-slate-50 hover:text-red-500 dark:border-slate-700 dark:hover:bg-slate-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className={sectionClass}>
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">2. Media Info</h3>
                    <p className="text-xs text-slate-500">Multilingual titles, headlines, and editorial details.</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="Title AR">
                    <input value={form.titleAr} onChange={(e) => update("titleAr", e.target.value)} className={inputClass} />
                  </Field>
                  <Field label="Title EN">
                    <input value={form.titleEn} onChange={(e) => update("titleEn", e.target.value)} className={inputClass} />
                  </Field>
                  <Field label="Title FR">
                    <input value={form.titleFr} onChange={(e) => update("titleFr", e.target.value)} className={inputClass} />
                  </Field>

                  <Field label="Event tag">
                    <input value={form.eventTag} onChange={(e) => update("eventTag", e.target.value)} className={inputClass} />
                  </Field>

                  <Field label="Location" icon={MapPin}>
                    <input value={form.location} onChange={(e) => update("location", e.target.value)} className={inputClass} />
                  </Field>

                  <Field label="Contributor" icon={UsersRound}>
                    <input value={form.contributor} onChange={(e) => update("contributor", e.target.value)} className={inputClass} />
                  </Field>

                  <Field label="Headline AR" className="md:col-span-3">
                    <textarea value={form.headlineAr} onChange={(e) => update("headlineAr", e.target.value)} rows={2} className={inputClass} />
                  </Field>
                  <Field label="Headline EN" className="md:col-span-3">
                    <textarea value={form.headlineEn} onChange={(e) => update("headlineEn", e.target.value)} rows={2} className={inputClass} />
                  </Field>
                  <Field label="Headline FR" className="md:col-span-3">
                    <textarea value={form.headlineFr} onChange={(e) => update("headlineFr", e.target.value)} rows={2} className={inputClass} />
                  </Field>
                </div>
              </section>

              <section className={sectionClass}>
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/40">
                    <UserRound className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">3. User</h3>
                    <p className="text-xs text-slate-500">Event owner and organization.</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="User name" icon={UserRound}>
                    <input
                      value={form.userName}
                      onChange={(e) => update("userName", e.target.value)}
                      placeholder="Name of the user creating the event"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Organization" icon={UsersRound}>
                    <select
                      value={form.organization}
                      onChange={(e) => update("organization", e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Select organization</option>
                      <option value="Broadcast Solutions">Broadcast Solutions</option>
                      <option value="ASBU">ASBU</option>
                      <option value="Customer">Customer</option>
                      <option value="Partner">Partner</option>
                      <option value="Other">Other</option>
                    </select>
                  </Field>
                </div>
              </section>

              <section className={sectionClass}>
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
                    <Archive className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">4. Recording</h3>
                    <p className="text-xs text-slate-500">Enable recording and define the recording window.</p>
                  </div>
                </div>

                <div className="mb-5 flex items-center justify-between rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Record this event</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {recordingAvailable
                        ? "Recording is available in EU West (Ireland)."
                        : "Select EU West (Ireland) to enable recording."}
                    </p>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.recordingEnabled}
                    disabled={!recordingAvailable}
                    onClick={() => update("recordingEnabled", !form.recordingEnabled)}
                    className={`relative h-6 w-11 rounded-full transition ${
                      form.recordingEnabled ? "bg-orange-600" : "bg-slate-300 dark:bg-slate-700"
                    } disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    <span
                      className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition"
                      style={{ left: form.recordingEnabled ? "22px" : "2px" }}
                    />
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Start at">
                    <input
                      type="datetime-local"
                      value={form.recordingStartAt}
                      onChange={(e) => update("recordingStartAt", e.target.value)}
                      disabled={!form.recordingEnabled}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="End at">
                    <input
                      type="datetime-local"
                      value={form.recordingEndAt}
                      onChange={(e) => update("recordingEndAt", e.target.value)}
                      disabled={!form.recordingEnabled}
                      className={inputClass}
                    />
                  </Field>
                </div>
              </section>

              <section className={sectionClass}>
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40">
                    <BrainCircuit className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">5. AI Processing</h3>
                    <p className="text-xs text-slate-500">Configure transcript processing.</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Transcript language" icon={Languages}>
                    <select
                      value={form.transcriptLanguage}
                      onChange={(e) => update("transcriptLanguage", e.target.value)}
                      className={inputClass}
                    >
                      <option value="NONE">No transcript</option>
                      <option value="AR">Arabic</option>
                      <option value="EN">English</option>
                      <option value="FR">French</option>
                    </select>
                  </Field>
                </div>
              </section>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                  {error}
                </div>
              )}

              <div className="sticky bottom-0 z-10 flex justify-end gap-3 border-t border-slate-200 bg-slate-50/95 py-4 backdrop-blur dark:border-slate-700 dark:bg-slate-950/95">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isCreating}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
                >
                  {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, required = false, icon: Icon, className = "", children }) {
  return (
    <label className={className}>
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
        {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}
