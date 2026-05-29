"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

const GENRES    = ["Drama", "Thriller", "Comedy", "Action", "Sci-Fi", "Horror", "Romance"];
const AUDIENCES = ["General", "Adult", "Family", "Teen"];
const STYLES    = ["Indie", "Blockbuster", "Streaming"];

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [text,     setText]     = useState("");
  const [title,    setTitle]    = useState("");
  const [genre,    setGenre]    = useState("");
  const [audience, setAudience] = useState("");
  const [style,    setStyle]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setText((ev.target?.result as string) ?? "");
    reader.readAsText(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) {
      setError("Please paste a screenplay or upload a .txt file.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const body = new FormData();
      body.append("text", text);
      if (title)    body.append("title",            title);
      if (genre)    body.append("genre_hint",        genre);
      if (audience) body.append("target_audience",   audience);
      if (style)    body.append("production_style",  style);

      const res = await fetch(`${API}/api/scripts/upload`, { method: "POST", body });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `Server error ${res.status}`);
      }
      const data = await res.json();
      router.push(`/results/${data.job_id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const lineCount = text ? text.split("\n").length : 0;

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ambient glow */}
      <div
        className="spotlight w-[550px] h-[550px] opacity-[0.05]"
        style={{ top: "-80px", right: "-100px", background: "radial-gradient(circle, #c9a84c, transparent 70%)" }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-16">

        {/* Page header */}
        <div className="anim-up mb-10">
          <p
            className="text-[0.6rem] tracking-[0.4em] text-smoke uppercase mb-3"
            style={{ fontFamily: "var(--font-dm-sans, system-ui)" }}
          >
            Script Analysis
          </p>
          <h1
            className="text-5xl font-bold text-ink tracking-tight leading-none mb-4"
            style={{ fontFamily: "var(--font-cinzel, Georgia, serif)" }}
          >
            UPLOAD<br />
            <span className="text-shimmer">SCREENPLAY</span>
          </h1>
          <div className="gold-rule w-14 mb-4" />
          <p
            className="text-fog text-sm leading-relaxed max-w-lg"
            style={{ fontFamily: "var(--font-dm-sans, system-ui)", fontWeight: 300 }}
          >
            Paste your script or upload a{" "}
            <code
              className="px-1.5 py-0.5 rounded-sm text-gold-dim text-xs"
              style={{ fontFamily: "var(--font-jetbrains, monospace)", background: "rgba(201,168,76,0.08)" }}
            >
              .txt
            </code>{" "}
            file. Scene headers must follow standard format —{" "}
            <span
              className="text-fog/70 text-xs"
              style={{ fontFamily: "var(--font-jetbrains, monospace)" }}
            >
              INT. COFFEE SHOP - DAY
            </span>
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div
            className="anim-up mb-6 rounded-[2px] px-5 py-4 text-sm border flex items-start gap-3"
            style={{
              background: "rgba(192,57,43,0.09)",
              borderColor: "rgba(192,57,43,0.28)",
              color: "#e07060",
              fontFamily: "var(--font-dm-sans, system-ui)",
            }}
          >
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="anim-up-1 space-y-7">
          {/* Screenplay textarea */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label
                className="text-[0.65rem] tracking-[0.18em] uppercase text-fog font-medium"
                style={{ fontFamily: "var(--font-dm-sans, system-ui)" }}
              >
                Screenplay Text
              </label>
              <span
                className="text-smoke text-xs tabular-nums"
                style={{ fontFamily: "var(--font-jetbrains, monospace)" }}
              >
                {text.length > 0 ? `${lineCount} ln · ${text.length} ch` : "empty"}
              </span>
            </div>
            <div className="relative">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={18}
                placeholder={"INT. COFFEE SHOP - DAY\n\nA screenwriter stares at a blank page...\n\nEXT. STREET - CONTINUOUS\n\n..."}
                className="input-field mono-field rounded-[2px] px-5 py-4 resize-y"
              />
              {/* Corner accents */}
              <span className="absolute top-0 right-0 w-4 h-4 border-t border-r border-gold/25 pointer-events-none" />
              <span className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-gold/25 pointer-events-none" />
            </div>
          </div>

          {/* File upload row */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-ghost px-5 py-2.5 rounded-[2px] gap-2 text-xs"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              Upload .txt File
            </button>
            <span
              className="text-smoke text-xs"
              style={{ fontFamily: "var(--font-dm-sans, system-ui)" }}
            >
              Contents populate the text area above
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Divider */}
          <div className="gold-rule" />

          {/* Title */}
          <div>
            <label
              className="block text-[0.65rem] tracking-[0.18em] uppercase text-fog font-medium mb-2.5"
              style={{ fontFamily: "var(--font-dm-sans, system-ui)" }}
            >
              Title{" "}
              <span className="text-smoke normal-case tracking-normal text-xs font-normal">
                (optional)
              </span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Screenplay"
              className="input-field rounded-[2px] px-5 py-3 text-sm"
            />
          </div>

          {/* Metadata dropdowns */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Genre Hint",       value: genre,    onChange: setGenre,    options: GENRES    },
              { label: "Target Audience",  value: audience, onChange: setAudience, options: AUDIENCES },
              { label: "Production Style", value: style,    onChange: setStyle,    options: STYLES    },
            ].map(({ label, value, onChange, options }) => (
              <div key={label}>
                <label
                  className="block text-[0.65rem] tracking-[0.18em] uppercase text-fog font-medium mb-2.5"
                  style={{ fontFamily: "var(--font-dm-sans, system-ui)" }}
                >
                  {label}
                </label>
                <select
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  className="input-field rounded-[2px] px-4 py-3 text-sm appearance-none cursor-pointer"
                >
                  <option value="">— select —</option>
                  {options.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>

          {/* Submit */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full py-4 rounded-[2px] gap-3"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Analyzing Screenplay…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  Analyze Script
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
