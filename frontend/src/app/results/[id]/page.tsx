const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface Scene {
  scene_number: number;
  scene_header: string;
  line_count: number;
  dialogue_ratio: number;
  is_slow: boolean;
  is_dialogue_heavy: boolean;
  raw_text: string;
}

interface Script {
  id: number;
  title: string | null;
  status: string;
  s3_key: string | null;
  created_at: string;
  scenes: Scene[];
}

async function getScript(id: string): Promise<Script> {
  const res = await fetch(`${API}/api/scripts/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load script (${res.status})`);
  return res.json();
}

function sceneRowClass(scene: Scene): string {
  if (scene.is_slow)           return "scene-slow scene-row";
  if (scene.is_dialogue_heavy) return "scene-dialogue scene-row";
  return "scene-normal scene-row";
}

const STAT_LABEL: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans, system-ui)",
  fontSize: "0.6rem",
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: "#5a5248",
};

const TH_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans, system-ui)",
  fontSize: "0.58rem",
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: "#4a4540",
  fontWeight: 500,
};

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id }   = await params;
  const script   = await getScript(id);

  const slowCount     = script.scenes.filter((s) => s.is_slow).length;
  const dialogueCount = script.scenes.filter((s) => s.is_dialogue_heavy).length;
  const avgLines      = script.scenes.length
    ? Math.round(script.scenes.reduce((a, s) => a + s.line_count, 0) / script.scenes.length)
    : 0;

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ambient glow */}
      <div
        className="spotlight w-[600px] h-[600px] opacity-[0.05]"
        style={{ top: "-120px", right: "-150px", background: "radial-gradient(circle, #c9a84c, transparent 70%)" }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">

        {/* Page header */}
        <div className="anim-up mb-10">
          <p
            className="text-[0.6rem] tracking-[0.4em] text-smoke uppercase mb-3"
            style={{ fontFamily: "var(--font-dm-sans, system-ui)" }}
          >
            Analysis Report
          </p>
          <div className="flex flex-col md:flex-row md:items-end gap-4 mb-4">
            <h1
              className="text-4xl md:text-5xl font-bold text-ink tracking-tight leading-none"
              style={{ fontFamily: "var(--font-cinzel, Georgia, serif)" }}
            >
              {script.title ? script.title.toUpperCase() : `SCRIPT #${script.id}`}
            </h1>
            <span
              className={`self-start md:self-auto px-3 py-1.5 rounded-[2px] text-[0.6rem] tracking-[0.18em] uppercase font-medium ${
                script.status === "complete" ? "badge-complete" : "badge-pending"
              }`}
              style={{ fontFamily: "var(--font-dm-sans, system-ui)" }}
            >
              {script.status}
            </span>
          </div>
          <div className="gold-rule w-14 mb-4" />
          <p
            className="text-smoke text-xs"
            style={{ fontFamily: "var(--font-dm-sans, system-ui)", letterSpacing: "0.06em" }}
          >
            {new Date(script.created_at).toLocaleDateString("en-US", {
              year: "numeric", month: "long", day: "numeric",
              hour: "2-digit", minute: "2-digit",
            })}
          </p>
        </div>

        {/* Stats strip */}
        <div className="anim-up-1 grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {[
            { label: "Total Scenes",      value: script.scenes.length, color: "#f0ebe0" },
            { label: "Slow Scenes",       value: slowCount,            color: slowCount     > 0 ? "#c0392b" : "#5a5248" },
            { label: "Dialogue Heavy",    value: dialogueCount,        color: dialogueCount > 0 ? "#c9a84c" : "#5a5248" },
            { label: "Avg Lines / Scene", value: avgLines,             color: "#a09272"    },
          ].map(({ label, value, color }) => (
            <div key={label} className="card-glow rounded-[2px] p-5">
              <div
                className="text-3xl font-semibold mb-1.5 tabular-nums"
                style={{ fontFamily: "var(--font-cinzel, Georgia, serif)", color }}
              >
                {value}
              </div>
              <div style={STAT_LABEL}>{label}</div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div
          className="anim-up-2 flex flex-wrap gap-6 mb-5 text-xs text-fog"
          style={{ fontFamily: "var(--font-dm-sans, system-ui)" }}
        >
          <span className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-[1px] inline-block"
              style={{ background: "rgba(192,57,43,0.35)", border: "1px solid rgba(192,57,43,0.5)" }}
            />
            Slow scene (&lt;8 lines)
          </span>
          <span className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-[1px] inline-block"
              style={{ background: "rgba(201,168,76,0.25)", border: "1px solid rgba(201,168,76,0.4)" }}
            />
            Dialogue heavy (&gt;65%)
          </span>
        </div>

        {/* Scene table */}
        <div
          className="anim-up-3 rounded-[2px] overflow-hidden"
          style={{ border: "1px solid rgba(201,168,76,0.09)" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "rgba(13,13,18,0.95)", borderBottom: "1px solid rgba(201,168,76,0.09)" }}>
                <th className="text-left  px-5 py-4 w-14" style={TH_STYLE}>#</th>
                <th className="text-left  px-5 py-4"      style={TH_STYLE}>Scene Header</th>
                <th className="text-right px-5 py-4 w-24" style={TH_STYLE}>Lines</th>
                <th className="text-right px-5 py-4 w-36" style={TH_STYLE}>Dialogue %</th>
                <th className="text-center px-5 py-4 w-20" style={TH_STYLE}>Slow</th>
                <th className="text-center px-5 py-4 w-24" style={TH_STYLE}>Heavy</th>
              </tr>
            </thead>
            <tbody>
              {script.scenes.map((scene, i) => (
                <tr
                  key={scene.scene_number}
                  className={sceneRowClass(scene)}
                  style={{
                    borderBottom: i < script.scenes.length - 1
                      ? "1px solid rgba(201,168,76,0.055)"
                      : "none",
                  }}
                >
                  {/* # */}
                  <td
                    className="px-5 py-3.5 tabular-nums"
                    style={{ fontFamily: "var(--font-jetbrains, monospace)", fontSize: "0.7rem", color: "#4a4540" }}
                  >
                    {String(scene.scene_number).padStart(2, "0")}
                  </td>

                  {/* Header */}
                  <td
                    className="px-5 py-3.5"
                    style={{ fontFamily: "var(--font-jetbrains, monospace)", fontSize: "0.75rem", color: "#ccc4b0", letterSpacing: "0.03em" }}
                  >
                    {scene.scene_header}
                  </td>

                  {/* Lines */}
                  <td
                    className="px-5 py-3.5 text-right tabular-nums"
                    style={{ fontFamily: "var(--font-cinzel, Georgia, serif)", fontSize: "0.85rem", color: "#a09272" }}
                  >
                    {scene.line_count}
                  </td>

                  {/* Dialogue % with mini bar */}
                  <td className="px-5 py-3.5 text-right">
                    <span className="inline-flex items-center justify-end gap-2">
                      <span
                        className="inline-block h-1 rounded-full"
                        style={{
                          width: `${Math.round(scene.dialogue_ratio * 56)}px`,
                          background: scene.is_dialogue_heavy
                            ? "rgba(201,168,76,0.55)"
                            : "rgba(80,74,66,0.45)",
                        }}
                      />
                      <span
                        className="w-9 text-right tabular-nums"
                        style={{ fontFamily: "var(--font-jetbrains, monospace)", fontSize: "0.75rem", color: "#a09272" }}
                      >
                        {(scene.dialogue_ratio * 100).toFixed(0)}%
                      </span>
                    </span>
                  </td>

                  {/* Slow indicator */}
                  <td className="px-5 py-3.5 text-center">
                    {scene.is_slow ? (
                      <span
                        className="inline-flex items-center justify-center w-5 h-5 rounded-full"
                        style={{ background: "rgba(192,57,43,0.22)" }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-ember inline-block" />
                      </span>
                    ) : (
                      <span className="text-smoke/30 text-xs">—</span>
                    )}
                  </td>

                  {/* Dialogue-heavy indicator */}
                  <td className="px-5 py-3.5 text-center">
                    {scene.is_dialogue_heavy ? (
                      <span
                        className="inline-flex items-center justify-center w-5 h-5 rounded-full"
                        style={{ background: "rgba(201,168,76,0.14)" }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-gold inline-block" />
                      </span>
                    ) : (
                      <span className="text-smoke/30 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* AI placeholder */}
        <div
          className="anim-up-4 mt-8 rounded-[2px] relative overflow-hidden px-8 py-10 text-center"
          style={{ border: "1px dashed rgba(201,168,76,0.15)" }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.04), transparent 70%)" }}
          />
          <div className="relative">
            <p
              className="text-[0.58rem] tracking-[0.4em] uppercase text-gold/40 mb-2"
              style={{ fontFamily: "var(--font-dm-sans, system-ui)" }}
            >
              Coming Soon — Week 3
            </p>
            <p
              className="text-base font-semibold text-fog/50 mb-1.5"
              style={{ fontFamily: "var(--font-cinzel, Georgia, serif)" }}
            >
              AI INTELLIGENCE LAYER
            </p>
            <p
              className="text-smoke text-xs max-w-sm mx-auto leading-relaxed"
              style={{ fontFamily: "var(--font-dm-sans, system-ui)", fontWeight: 300 }}
            >
              Genre detection, character extraction, pacing report, and intelligent improvement suggestions will appear here.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
