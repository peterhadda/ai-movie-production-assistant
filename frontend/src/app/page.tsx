import Link from "next/link";

const FEATURES = [
  {
    title: "Pacing Analysis",
    desc: "Identify scenes that drag or rush. Surface structural imbalances before they reach the cutting room.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    title: "Dialogue Breakdown",
    desc: "Know exactly which scenes lean heavy on dialogue versus action — scene by scene, ratio by ratio.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
  },
  {
    title: "AI Intelligence",
    desc: "Genre detection, character mapping, and intelligent revision suggestions powered by state-of-the-art LLMs.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
      </svg>
    ),
  },
];

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Ambient spotlights */}
      <div
        className="spotlight w-[700px] h-[700px] opacity-[0.08]"
        style={{ top: "-200px", left: "-180px", background: "radial-gradient(circle, #c9a84c, transparent 70%)" }}
      />
      <div
        className="spotlight w-[500px] h-[500px] opacity-[0.05]"
        style={{ bottom: "-80px", right: "-120px", background: "radial-gradient(circle, #6b5fd8, transparent 70%)" }}
      />

      {/* Hero */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-28 text-center">
        {/* Pre-heading pill */}
        <div className="anim-up mb-8">
          <span
            className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full text-[0.6rem] tracking-[0.3em] uppercase text-gold border border-gold/20 bg-gold/[0.06]"
            style={{ fontFamily: "var(--font-dm-sans, system-ui)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse inline-block" />
            AI-Powered Production Intelligence
          </span>
        </div>

        {/* Main headline */}
        <h1
          className="anim-up-1 text-6xl md:text-7xl lg:text-[5.5rem] font-bold leading-[0.92] tracking-tight mb-7 max-w-4xl"
          style={{ fontFamily: "var(--font-cinzel, Georgia, serif)" }}
        >
          <span className="block text-ink">EVERY SCENE</span>
          <span className="text-shimmer block">MATTERS.</span>
        </h1>

        {/* Subtext */}
        <p
          className="anim-up-2 text-fog text-lg md:text-xl max-w-xl leading-relaxed mb-12"
          style={{ fontFamily: "var(--font-dm-sans, system-ui)", fontWeight: 300 }}
        >
          Upload your screenplay and let AI surface the scenes that need attention
          — before they make it to set.
        </p>

        {/* CTAs */}
        <div className="anim-up-3 flex flex-col sm:flex-row items-center gap-4 mb-20">
          <Link href="/upload" className="btn-gold px-10 py-4 rounded-[2px] text-sm">
            Analyze Your Script
          </Link>
          <Link href="/history" className="btn-ghost px-10 py-4 rounded-[2px] text-sm">
            View History
          </Link>
        </div>

        {/* Thin gold divider */}
        <div className="anim-up-4 flex items-center gap-5 mb-16 w-full max-w-xs">
          <div className="flex-1 gold-rule" />
          <span className="text-smoke text-xs tracking-[0.3em]" style={{ fontFamily: "var(--font-cinzel, Georgia, serif)" }}>ACT I</span>
          <div className="flex-1 gold-rule" />
        </div>

        {/* Feature cards */}
        <div className="anim-up-5 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl w-full">
          {FEATURES.map((feat) => (
            <div key={feat.title} className="card-glow rounded-[2px] p-7 text-left group">
              <div className="text-gold mb-4 opacity-70 group-hover:opacity-100 transition-opacity duration-300">
                {feat.icon}
              </div>
              <h3
                className="text-xs font-semibold tracking-[0.2em] uppercase text-ink mb-2.5"
                style={{ fontFamily: "var(--font-cinzel, Georgia, serif)" }}
              >
                {feat.title}
              </h3>
              <p
                className="text-fog text-sm leading-relaxed"
                style={{ fontFamily: "var(--font-dm-sans, system-ui)", fontWeight: 300 }}
              >
                {feat.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom decoration */}
        <div className="anim-up-5 mt-20 flex items-center justify-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-gold-dim opacity-40" />
          <div className="w-1 h-1 rounded-full bg-gold-dim opacity-25" />
          <div className="w-1.5 h-1.5 rounded-full bg-gold-dim opacity-40" />
        </div>
      </section>
    </div>
  );
}
