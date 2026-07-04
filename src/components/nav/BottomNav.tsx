"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/dashboard",           icon: "⚡",  label: "Live"   },
  { href: "/dashboard/cam",       icon: "📷",  label: "Cam"    },
  { href: "/dashboard/map",       icon: "🗺️",  label: "Map"    },
  { href: "/dashboard/reminders", icon: "🔔",  label: "Tasks"  },
  { href: "/dashboard/scrapbook", icon: "📖",  label: "Album"  },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex max-w-2xl mx-auto nav-glow"
      style={{
        background: "linear-gradient(180deg, #2D2438 0%, #1A1225 100%)",
        borderTop: "2px solid rgba(255,255,255,0.06)",
        borderRadius: "16px 16px 0 0",
      }}
    >
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex-1 flex flex-col items-center justify-center py-3.5 gap-1 relative group"
          >
            {active && (
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-7 rounded-full"
                style={{ background: "var(--pink)" }}
              />
            )}
            <span
              className={`text-xl leading-none transition-all duration-200 ${
                active
                  ? "scale-115 drop-shadow-[0_0_5px_rgba(255,143,163,0.6)]"
                  : "opacity-40 group-hover:opacity-65 group-hover:scale-105"
              }`}
            >
              {tab.icon}
            </span>
            <span
              className={`font-pixel text-[8px] leading-tight transition-colors ${
                active ? "text-[var(--pink)]" : "text-white/30"
              }`}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
