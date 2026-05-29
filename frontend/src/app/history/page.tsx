"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface ScriptSummary {
  id: number;
  title: string | null;
  status: string;
  created_at: string;
  scene_count: number | null;
}

function statusStyle(status: string): string {
  if (status === "complete")   return "badge-complete";
  if (status === "processing") return "badge-pending";
  if (status === "failed")
    return "bg-red-950/30 text-red-400 border border-red-800/40";
  return "bg-zinc-900/40 text-zinc-400 border border-zinc-700/40";
}

export default function HistoryPage() {
  const [scripts, setScripts] = useState<ScriptSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    fetch(`${API}/api/scripts/`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((data) => setScripts(data))
      .catch((e)  => setError(e instanceof Error ? e.message : "Failed to load history."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="spotlight w-[500px] h-[500px] opacity-[0.05]"
        style={{ top: "-80px", left: "-120px", background: "radial-gradient(circle, #c9a84c, transparent 70%)" }} />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="anim-up mb-10">
          <p className="text-[0.6rem] tracking-[0.4em] text-smoke uppercase mb-3"
            style={{ fontFamily: "var(--font-dm-sans)" }}>
            Script Library
          </p>
          <h1 className="text-5xl font-bold text-ink tracking-tight leading-none mb-4"
            style={{ fontFamily: "var(--font-cinzel)" }}>
            HISTORY
          </h1>
          <div className="gold-rule w-14 mb-4" />
          <p className="text-fog text-sm" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
            All uploaded screenplays and their analysis status.
          </p>
        </div>

        {/* Upload CTA */}
        <div className="anim-up-1 mb-8">
          <Link href="/upload" className="btn-gold px-8 py-3 rounded-xs text-xs inline-flex items-center gap-2">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Upload New Script
          </Link>
        </div>

        {/* States */}
        {loading && (
          <div className="flex items-center gap-3 text-fog text-sm" style={{ fontFamily: "var(--font-dm-sans)" }}>
            <div className="w-4 h-4 border border-gold/30 border-t-gold rounded-full animate-spin" />
            Loading…
          </div>
        )}

        {error && (
          <div className="rounded-xs px-5 py-4 text-sm text-red-400 border"
            style={{ background: "rgba(192,57,43,0.09)", borderColor: "rgba(192,57,43,0.28)",
              fontFamily: "var(--font-dm-sans)" }}>
            {error}
          </div>
        )}

        {!loading && !error && scripts.length === 0 && (
          <div className="rounded-xs px-8 py-12 text-center"
            style={{ border: "1px dashed rgba(201,168,76,0.15)" }}>
            <p className="text-fog/50 text-sm" style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}>
              No scripts uploaded yet.
            </p>
          </div>
        )}

        {/* Script list */}
        {scripts.length > 0 && (
          <div className="anim-up-2 rounded-xs overflow-hidden" style={{ border: "1px solid rgba(201,168,76,0.09)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "rgba(13,13,18,0.95)", borderBottom: "1px solid rgba(201,168,76,0.09)" }}>
                  {["Title", "Status", "Scenes", "Uploaded", ""].map((h) => (
                    <th key={h} className="px-5 py-4 text-left"
                      style={{ fontFamily: "var(--font-dm-sans)", fontSize: "0.58rem",
                        letterSpacing: "0.22em", textTransform: "uppercase", color: "#4a4540", fontWeight: 500 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scripts.map((s, i) => (
                  <tr key={s.id} className="scene-row scene-normal"
                    style={{ borderBottom: i < scripts.length - 1 ? "1px solid rgba(201,168,76,0.055)" : "none" }}>
                    <td className="px-5 py-4">
                      <span className="text-ink text-sm font-medium"
                        style={{ fontFamily: "var(--font-cinzel)", letterSpacing: "0.06em" }}>
                        {s.title ?? `Script #${s.id}`}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-block px-2.5 py-1 rounded-xs text-[0.6rem] tracking-[0.15em] uppercase font-medium ${statusStyle(s.status)}`}
                        style={{ fontFamily: "var(--font-dm-sans)" }}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 tabular-nums"
                      style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", color: "#a09272" }}>
                      {s.scene_count ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-smoke text-xs" style={{ fontFamily: "var(--font-dm-sans)" }}>
                      {new Date(s.created_at).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link href={`/results/${s.id}`} className="nav-link text-xs">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
