"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Character {
  name: string;
  role_type: string | null;
  description: string | null;
}

interface Suggestion {
  type: string;
  severity: string;
  scene_reference: number | null;
  suggestion: string;
  example: string;
}

interface Scene {
  scene_number: number;
  scene_header: string;
  line_count: number;
  dialogue_ratio: number;
  is_slow: boolean;
  is_dialogue_heavy: boolean;
  raw_text: string;
  summary: string | null;
  emotion: string | null;
  pacing_label: string | null;
}

interface ScriptData {
  id: number;
  title: string | null;
  status: string;
  s3_key: string | null;
  created_at: string;
  detected_genre: string | null;
  detected_secondary_genre: string | null;
  scenes: Scene[];
  characters: Character[];
  improvement_suggestions: Suggestion[];
}

// ── Style helpers ─────────────────────────────────────────────────────────────

function emotionStyle(emotion: string | null): string {
  const map: Record<string, string> = {
    tension:  "bg-orange-950/50 text-orange-400 border-orange-800/50",
    joy:      "bg-yellow-950/50 text-yellow-400 border-yellow-800/50",
    grief:    "bg-purple-950/50 text-purple-400 border-purple-800/50",
    action:   "bg-red-950/50    text-red-400    border-red-800/50",
    humor:    "bg-green-950/50  text-green-400  border-green-800/50",
    romance:  "bg-pink-950/50   text-pink-400   border-pink-800/50",
    suspense: "bg-blue-950/60   text-blue-400   border-blue-900/60",
    calm:     "bg-sky-950/50    text-sky-400    border-sky-800/50",
    anger:    "bg-red-950/70    text-red-600    border-red-900/60",
    fear:     "bg-zinc-800/60   text-zinc-400   border-zinc-700/60",
  };
  return map[emotion ?? ""] ?? "bg-zinc-900/50 text-zinc-500 border-zinc-800/50";
}

function pacingStyle(label: string | null): string {
  if (label === "fast")   return "text-green-400 bg-green-950/40 border-green-800/40";
  if (label === "slow")   return "text-red-400   bg-red-950/40   border-red-800/40";
  if (label === "medium") return "text-amber-400 bg-amber-950/40 border-amber-800/40";
  return "text-zinc-500 bg-zinc-900/30 border-zinc-700/30";
}

function roleStyle(role: string | null): string {
  if (role === "protagonist") return "text-blue-400  bg-blue-950/40  border-blue-800/40";
  if (role === "antagonist")  return "text-red-400   bg-red-950/40   border-red-800/40";
  if (role === "supporting")  return "text-zinc-400  bg-zinc-800/40  border-zinc-700/40";
  return "text-zinc-500 bg-zinc-900/30 border-zinc-700/30";
}

function severityStyle(sev: string): string {
  if (sev === "high")   return "text-red-400";
  if (sev === "medium") return "text-amber-400";
  return "text-green-400";
}

function suggestionTypeStyle(type: string): string {
  const map: Record<string, string> = {
    pacing:    "text-orange-400 border-orange-800/40 bg-orange-950/30",
    dialogue:  "text-blue-400   border-blue-800/40   bg-blue-950/30",
    structure: "text-purple-400 border-purple-800/40 bg-purple-950/30",
    character: "text-green-400  border-green-800/40  bg-green-950/30",
    emotion:   "text-pink-400   border-pink-800/40   bg-pink-950/30",
  };
  return map[type] ?? "text-zinc-400 border-zinc-700/40 bg-zinc-900/30";
}

const BADGE_BASE = "inline-block px-2 py-0.5 rounded-xs text-[0.6rem] tracking-[0.15em] uppercase font-medium border";

// ── Component ─────────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const params   = useParams();
  const id       = params?.id as string;

  const [data,      setData]      = useState<ScriptData | null>(null);
  const [fetchErr,  setFetchErr]  = useState("");
  const [starting,  setStarting]  = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPoll = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const fetchData = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch(`${API}/api/scripts/${id}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d: ScriptData = await res.json();
      setData(d);
      setFetchErr("");
      return d.status;
    } catch (e) {
      setFetchErr(e instanceof Error ? e.message : "Failed to load script.");
      return null;
    }
  }, [id]);

  const startPolling = useCallback(() => {
    if (pollRef.current) return;
    pollRef.current = setInterval(async () => {
      const status = await fetchData();
      if (status === "complete" || status === "failed" || status === null) stopPoll();
    }, 3000);
  }, [fetchData]);

  useEffect(() => {
    fetchData().then((status) => { if (status === "processing") startPolling(); });
    return stopPoll;
  }, [id]);

  const triggerAnalysis = async () => {
    setStarting(true);
    try {
      const res = await fetch(`${API}/api/scripts/${id}/analyze`, { method: "POST" });
      if (!res.ok) { const t = await res.text(); throw new Error(t || `HTTP ${res.status}`); }
      await fetchData();
      startPolling();
    } catch (e) {
      setFetchErr(e instanceof Error ? e.message : "Failed to start analysis.");
    } finally {
      setStarting(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (!data && !fetchErr) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-4" />
          <p className="text-smoke text-sm" style={{ fontFamily: "var(--font-dm-sans)" }}>Loading…</p>
        </div>
      </div>
    );
  }

  // ── Fetch error ──────────────────────────────────────────────────────────
  if (fetchErr && !data) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <p className="text-red-400 text-sm mb-4" style={{ fontFamily: "var(--font-dm-sans)" }}>{fetchErr}</p>
        <Link href="/" className="btn-ghost px-6 py-2.5 rounded-xs text-xs">Go Home</Link>
      </div>
    );
  }

  const script = data!;
  const isProcessing = script.status === "processing";
  const isFailed     = script.status === "failed";
  const isPending    = script.status === "pending";
  const isComplete   = script.status === "complete";

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ambient glow */}
      <div className="spotlight w-[600px] h-[600px] opacity-[0.05]"
        style={{ top: "-120px", right: "-150px", background: "radial-gradient(circle, #c9a84c, transparent 70%)" }} />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-14">

        {/* ── Page header ───────────────────────────────────────────────── */}
        <div className="anim-up mb-8">
          <p className="text-[0.6rem] tracking-[0.4em] text-smoke uppercase mb-3"
            style={{ fontFamily: "var(--font-dm-sans)" }}>
            Analysis Report
          </p>

          <div className="flex flex-col md:flex-row md:items-end gap-4 mb-3">
            <h1 className="text-4xl md:text-5xl font-bold text-ink tracking-tight leading-none"
              style={{ fontFamily: "var(--font-cinzel)" }}>
              {script.title ? script.title.toUpperCase() : `SCRIPT #${script.id}`}
            </h1>

            <span className={`self-start px-3 py-1.5 rounded-xs text-[0.6rem] tracking-[0.18em] uppercase font-medium ${
              isComplete   ? "badge-complete" :
              isFailed     ? "bg-red-950/30 text-red-400 border border-red-800/40" :
              isProcessing ? "badge-pending" :
                             "bg-zinc-900/40 text-zinc-400 border border-zinc-700/40"
            }`} style={{ fontFamily: "var(--font-dm-sans)" }}>
              {script.status}
            </span>
          </div>

          <div className="gold-rule w-14 mb-4" />
          <p className="text-smoke text-xs" style={{ fontFamily: "var(--font-dm-sans)", letterSpacing: "0.06em" }}>
            {new Date(script.created_at).toLocaleDateString("en-US", {
              year: "numeric", month: "long", day: "numeric",
              hour: "2-digit", minute: "2-digit",
            })}
          </p>
        </div>

        {/* ── Status banners ────────────────────────────────────────────── */}
        {isPending && (
          <div className="anim-up-1 mb-8 rounded-xs p-6 text-center"
            style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.18)" }}>
            <p className="text-fog text-sm mb-4" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
              Script uploaded. Run AI analysis to detect genre, characters, pacing, and get improvement suggestions.
            </p>
            <button onClick={triggerAnalysis} disabled={starting} className="btn-gold px-10 py-3.5 rounded-xs gap-2">
              {starting ? (
                <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg> Starting…</>
              ) : "Run AI Analysis"}
            </button>
          </div>
        )}

        {isProcessing && (
          <div className="anim-up-1 mb-8 rounded-xs overflow-hidden"
            style={{ border: "1px solid rgba(201,168,76,0.2)" }}>
            <div className="px-6 py-5 flex items-center gap-4"
              style={{ background: "rgba(201,168,76,0.05)" }}>
              <div className="w-5 h-5 border border-gold/40 border-t-gold rounded-full animate-spin shrink-0" />
              <div>
                <p className="text-gold text-sm font-medium" style={{ fontFamily: "var(--font-cinzel)", letterSpacing: "0.1em" }}>
                  AI IS ANALYZING YOUR SCRIPT
                </p>
                <p className="text-smoke text-xs mt-0.5" style={{ fontFamily: "var(--font-dm-sans)" }}>
                  This takes 30–90 seconds. Page updates automatically.
                </p>
              </div>
            </div>
            {/* Animated progress bar */}
            <div className="h-0.5 w-full" style={{ background: "rgba(201,168,76,0.1)" }}>
              <div className="h-full animate-pulse" style={{ background: "linear-gradient(90deg, transparent, #c9a84c, transparent)", width: "60%" }} />
            </div>
          </div>
        )}

        {isFailed && (
          <div className="anim-up-1 mb-8 rounded-xs p-5 flex items-start justify-between gap-4"
            style={{ background: "rgba(192,57,43,0.1)", border: "1px solid rgba(192,57,43,0.3)" }}>
            <div>
              <p className="text-red-400 text-sm font-medium mb-1" style={{ fontFamily: "var(--font-dm-sans)" }}>
                Analysis failed.
              </p>
              <p className="text-smoke text-xs" style={{ fontFamily: "var(--font-dm-sans)" }}>
                Check server logs for details. You can retry below.
              </p>
            </div>
            <button onClick={triggerAnalysis} disabled={starting} className="btn-ghost px-5 py-2.5 rounded-xs shrink-0 gap-2">
              {starting ? "Starting…" : "Try Again"}
            </button>
          </div>
        )}

        {/* ── Section 1: Genre + Stats (complete only) ──────────────────── */}
        {isComplete && (script.detected_genre || script.scenes.length > 0) && (
          <div className="anim-up-1 mb-10">
            {/* Genre badges */}
            {script.detected_genre && (
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className={`${BADGE_BASE} bg-gold/10 text-gold border-gold/30 text-xs px-4 py-1.5`}
                  style={{ fontFamily: "var(--font-cinzel)" }}>
                  {script.detected_genre}
                </span>
                {script.detected_secondary_genre && (
                  <span className={`${BADGE_BASE} bg-violet/10 text-violet-soft border-violet/20 px-3 py-1`}>
                    {script.detected_secondary_genre}
                  </span>
                )}
              </div>
            )}

            {/* Stats strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Total Scenes",    value: script.scenes.length },
                { label: "Characters",      value: script.characters.length },
                { label: "Slow Scenes",     value: script.scenes.filter(s => s.is_slow).length,
                  color: script.scenes.filter(s => s.is_slow).length > 0 ? "#c0392b" : undefined },
                { label: "Dialogue Heavy",  value: script.scenes.filter(s => s.is_dialogue_heavy).length,
                  color: script.scenes.filter(s => s.is_dialogue_heavy).length > 0 ? "#c9a84c" : undefined },
              ].map(({ label, value, color }) => (
                <div key={label} className="card-glow rounded-xs p-5">
                  <div className="text-3xl font-semibold mb-1.5 tabular-nums"
                    style={{ fontFamily: "var(--font-cinzel)", color: color ?? "#f0ebe0" }}>
                    {value}
                  </div>
                  <div className="text-[0.6rem] tracking-[0.22em] uppercase text-smoke"
                    style={{ fontFamily: "var(--font-dm-sans)" }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Section 2: Characters ──────────────────────────────────────── */}
        {isComplete && script.characters.length > 0 && (
          <div className="anim-up-2 mb-10">
            <h2 className="text-xs font-semibold tracking-[0.2em] uppercase text-fog mb-5"
              style={{ fontFamily: "var(--font-cinzel)" }}>
              Characters
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {script.characters.map((char) => (
                <div key={char.name} className="card-glow rounded-xs p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-sm font-semibold text-ink"
                      style={{ fontFamily: "var(--font-cinzel)", letterSpacing: "0.08em" }}>
                      {char.name}
                    </span>
                    {char.role_type && (
                      <span className={`${BADGE_BASE} shrink-0 ${roleStyle(char.role_type)}`}>
                        {char.role_type}
                      </span>
                    )}
                  </div>
                  {char.description && (
                    <p className="text-fog text-xs leading-relaxed"
                      style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
                      {char.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Section 3: Scene table ─────────────────────────────────────── */}
        {script.scenes.length > 0 && (
          <div className="anim-up-3 mb-10">
            <div className="flex flex-wrap items-center gap-6 mb-4 text-xs text-fog"
              style={{ fontFamily: "var(--font-dm-sans)" }}>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-xs inline-block"
                  style={{ background: "rgba(192,57,43,0.35)", border: "1px solid rgba(192,57,43,0.5)" }} />
                Slow scene
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-xs inline-block"
                  style={{ background: "rgba(201,168,76,0.25)", border: "1px solid rgba(201,168,76,0.4)" }} />
                Dialogue heavy
              </span>
            </div>

            <div className="rounded-xs overflow-x-auto" style={{ border: "1px solid rgba(201,168,76,0.09)" }}>
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr style={{ background: "rgba(13,13,18,0.95)", borderBottom: "1px solid rgba(201,168,76,0.09)" }}>
                    {["#", "Scene Header", "Lines", "Dialogue %", "Summary", "Emotion", "Pacing"].map(h => (
                      <th key={h} className="px-4 py-3.5 text-left"
                        style={{ fontFamily: "var(--font-dm-sans)", fontSize: "0.58rem",
                          letterSpacing: "0.22em", textTransform: "uppercase", color: "#4a4540", fontWeight: 500 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {script.scenes.map((scene, i) => (
                    <tr key={scene.scene_number}
                      className={`scene-row ${scene.is_slow ? "scene-slow" : scene.is_dialogue_heavy ? "scene-dialogue" : "scene-normal"}`}
                      style={{ borderBottom: i < script.scenes.length - 1 ? "1px solid rgba(201,168,76,0.055)" : "none" }}>
                      <td className="px-4 py-3 tabular-nums"
                        style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.7rem", color: "#4a4540" }}>
                        {String(scene.scene_number).padStart(2, "0")}
                      </td>
                      <td className="px-4 py-3 max-w-[220px]"
                        style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.72rem", color: "#ccc4b0" }}>
                        {scene.scene_header}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-right"
                        style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.82rem", color: "#a09272" }}>
                        {scene.line_count}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 justify-end">
                          <span className="inline-block h-1 rounded-full"
                            style={{ width: `${Math.round(scene.dialogue_ratio * 50)}px`,
                              background: scene.is_dialogue_heavy ? "rgba(201,168,76,0.55)" : "rgba(80,74,66,0.4)" }} />
                          <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.72rem", color: "#a09272" }}>
                            {(scene.dialogue_ratio * 100).toFixed(0)}%
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-[260px]">
                        {scene.summary ? (
                          <p className="text-fog/80 leading-relaxed line-clamp-2"
                            style={{ fontFamily: "var(--font-dm-sans)", fontSize: "0.72rem", fontWeight: 300 }}>
                            {scene.summary}
                          </p>
                        ) : (
                          <span className="text-smoke/40 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {scene.emotion ? (
                          <span className={`${BADGE_BASE} ${emotionStyle(scene.emotion)}`}>
                            {scene.emotion}
                          </span>
                        ) : <span className="text-smoke/30 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {scene.pacing_label ? (
                          <span className={`${BADGE_BASE} ${pacingStyle(scene.pacing_label)}`}>
                            {scene.pacing_label}
                          </span>
                        ) : <span className="text-smoke/30 text-xs">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Section 4: Improvement suggestions ────────────────────────── */}
        {isComplete && script.improvement_suggestions.length > 0 && (
          <div className="anim-up-4 mb-10">
            <h2 className="text-xs font-semibold tracking-[0.2em] uppercase text-fog mb-5"
              style={{ fontFamily: "var(--font-cinzel)" }}>
              Improvement Suggestions
            </h2>
            <div className="space-y-4">
              {script.improvement_suggestions.map((s, i) => (
                <div key={i} className="card-glow rounded-xs p-6">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className={`${BADGE_BASE} ${suggestionTypeStyle(s.type)}`}>{s.type}</span>
                    <span className={`text-xs font-semibold uppercase tracking-widest ${severityStyle(s.severity)}`}
                      style={{ fontFamily: "var(--font-dm-sans)", fontSize: "0.62rem" }}>
                      {s.severity} severity
                    </span>
                    <span className="text-smoke text-xs" style={{ fontFamily: "var(--font-dm-sans)" }}>
                      {s.scene_reference ? `Scene ${s.scene_reference}` : "Overall"}
                    </span>
                  </div>
                  <p className="text-fog text-sm leading-relaxed mb-3"
                    style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
                    {s.suggestion}
                  </p>
                  <p className="text-smoke/70 text-xs leading-relaxed italic"
                    style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
                    {s.example}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── AI placeholder (not yet analyzed) ─────────────────────────── */}
        {!isComplete && !isProcessing && (
          <div className="anim-up-4 rounded-xs relative overflow-hidden px-8 py-10 text-center"
            style={{ border: "1px dashed rgba(201,168,76,0.15)" }}>
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.04), transparent 70%)" }} />
            <div className="relative">
              <p className="text-[0.58rem] tracking-[0.4em] uppercase text-gold/40 mb-2"
                style={{ fontFamily: "var(--font-dm-sans)" }}>
                Not Yet Analyzed
              </p>
              <p className="text-base font-semibold text-fog/50 mb-1.5"
                style={{ fontFamily: "var(--font-cinzel)" }}>
                AI INTELLIGENCE LAYER
              </p>
              <p className="text-smoke text-xs max-w-sm mx-auto leading-relaxed"
                style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
                Genre detection, character extraction, pacing report, and improvement suggestions appear here after analysis.
              </p>
            </div>
          </div>
        )}

        {/* ── Rating widget ──────────────────────────────────────────────── */}
        {isComplete && <RatingWidget scriptId={id} apiBase={API} />}

        {/* ── MLflow link ────────────────────────────────────────────────── */}
        <div className="mt-6 text-center">
          <a
            href="http://localhost:5001"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-smoke/50 hover:text-gold transition-colors duration-300 text-xs"
            style={{ fontFamily: "var(--font-dm-sans)", letterSpacing: "0.1em" }}
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            View in MLflow ↗
          </a>
        </div>

      </div>
    </div>
  );
}

// ── Rating widget component ───────────────────────────────────────────────────

function RatingWidget({ scriptId, apiBase }: { scriptId: string; apiBase: string }) {
  const [selected,  setSelected]  = useState(0);
  const [hovered,   setHovered]   = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);

  const submit = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await fetch(`${apiBase}/api/scripts/${scriptId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: selected }),
      });
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="mt-10 text-center">
        <p className="text-gold/60 text-xs tracking-[0.2em]" style={{ fontFamily: "var(--font-dm-sans)" }}>
          Thank you — your feedback improves the model.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-10 pt-8 border-t border-gold/10 text-center">
      <p className="text-smoke text-xs tracking-[0.18em] uppercase mb-4"
        style={{ fontFamily: "var(--font-dm-sans)" }}>
        How accurate was this analysis?
      </p>
      <div className="flex items-center justify-center gap-2 mb-5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setSelected(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="text-2xl transition-transform duration-100 hover:scale-110 focus:outline-none"
            style={{ color: star <= (hovered || selected) ? "#c9a84c" : "#3a3530" }}
          >
            ★
          </button>
        ))}
      </div>
      <button
        onClick={submit}
        disabled={!selected || loading}
        className="btn-gold px-8 py-2.5 rounded-xs text-xs gap-2"
      >
        {loading ? "Submitting…" : "Submit Rating"}
      </button>
    </div>
  );
}
