import type { Metadata } from "next";
import { Cinzel, DM_Sans, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "CineScript AI — Screenplay Intelligence",
  description: "AI-powered screenplay analysis for cinematic excellence",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${cinzel.variable} ${dmSans.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-void text-ink">
        {/* Top film-strip accent */}
        <div className="perforations" />

        <nav
          className="relative z-50 border-b border-gold/10"
          style={{ background: "rgba(13,13,18,0.96)", backdropFilter: "blur(12px)" }}
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-5 flex items-center justify-between">
            {/* Logotype */}
            <Link href="/" className="flex items-center gap-4 group">
              <div className="relative w-9 h-9 spin-slow opacity-70 group-hover:opacity-100 transition-opacity duration-500">
                <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  <circle cx="18" cy="18" r="15.5" stroke="#c9a84c" strokeWidth="1" strokeDasharray="3 4" />
                  <circle cx="18" cy="18" r="10"   stroke="#c9a84c" strokeWidth="1.5" />
                  <circle cx="18" cy="18" r="3"    fill="#c9a84c" />
                  <circle cx="18" cy="7.5" r="2.8" fill="#8a6e2a" />
                  <circle cx="18" cy="28.5" r="2.8" fill="#8a6e2a" />
                  <circle cx="7.5" cy="18"  r="2.8" fill="#8a6e2a" />
                  <circle cx="28.5" cy="18" r="2.8" fill="#8a6e2a" />
                  <circle cx="11" cy="11" r="2"   fill="#8a6e2a" opacity=".55" />
                  <circle cx="25" cy="25" r="2"   fill="#8a6e2a" opacity=".55" />
                  <circle cx="11" cy="25" r="2"   fill="#8a6e2a" opacity=".55" />
                  <circle cx="25" cy="11" r="2"   fill="#8a6e2a" opacity=".55" />
                </svg>
              </div>
              <div>
                <div
                  className="text-base font-semibold tracking-[0.24em] text-gold group-hover:text-gold-bright transition-colors duration-300"
                  style={{ fontFamily: "var(--font-cinzel, Georgia, serif)" }}
                >
                  CINESCRIPT
                </div>
                <div
                  className="text-[0.55rem] tracking-[0.35em] text-smoke"
                  style={{ fontFamily: "var(--font-dm-sans, system-ui)" }}
                >
                  AI ASSISTANT
                </div>
              </div>
            </Link>

            {/* Links */}
            <div className="flex items-center gap-10">
              <Link href="/upload"  className="nav-link">Upload Script</Link>
              <Link href="/history" className="nav-link">History</Link>
            </div>
          </div>
          <div className="gold-rule" />
        </nav>

        <main className="flex-1 relative">{children}</main>

        {/* Footer */}
        <div className="gold-rule" />
        <footer
          className="py-5 border-t border-gold/[0.07]"
          style={{ background: "rgba(13,13,18,0.8)" }}
        >
          <p
            className="text-center text-smoke text-[0.6rem] tracking-[0.28em] uppercase"
            style={{ fontFamily: "var(--font-dm-sans, system-ui)" }}
          >
            CineScript AI · Screenplay Intelligence
          </p>
        </footer>
        <div className="perforations" />
      </body>
    </html>
  );
}
