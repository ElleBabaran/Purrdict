import Link from "next/link";

export default function LandingNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-8 py-3.5" style={{ background: "rgba(255,246,236,0.9)", backdropFilter: "blur(10px)", borderBottom: "2.5px solid var(--cocoa)" }}>
      <div className="font-pixel text-[11px] text-[var(--cocoa)] flex items-center gap-2">
        <span className="text-xl">🐾</span>PURRDICT
      </div>
      <ul className="hidden md:flex gap-7 list-none">
        <li>
          <a href="#levels" className="text-[var(--cocoa)] font-semibold text-sm hover:text-[var(--pink-dk)] transition-colors">
            How It Works
          </a>
        </li>
        <li>
          <a href="#showcase" className="text-[var(--cocoa)] font-semibold text-sm hover:text-[var(--pink-dk)] transition-colors">
            Spy Cam
          </a>
        </li>
        <li>
          <a href="#scrapbook" className="text-[var(--cocoa)] font-semibold text-sm hover:text-[var(--pink-dk)] transition-colors">
            Scrapbook
          </a>
        </li>
      </ul>
      <div className="flex items-center gap-2.5">
        <Link
          href="/login"
          className="font-pixel text-[8px] px-3.5 py-2 rounded-xl text-[var(--cocoa)] hover:text-[var(--pink-dk)] transition-colors"
        >
          LOG IN
        </Link>
        <Link
          href="/signup"
          className="pixel-press font-pixel text-[8px] px-4 py-2.5 rounded-xl text-white"
          style={{
            background: "linear-gradient(135deg, var(--pink) 0%, var(--pink-dk) 100%)",
            border: "2px solid var(--cocoa)",
            boxShadow: "3px 3px 0 var(--cocoa)",
          }}
        >
          SIGN UP
        </Link>
      </div>
    </nav>
  );
}
