"use client";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";

export default function TopBar({ title }: { title: string }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  function handleSignOut() {
    logout();
    router.push("/");
  }

  const catName = user?.cats[0]?.name || "PURRDICT";

  return (
    <div className="sticky top-0 z-40" style={{ background: "var(--plum-xl)" }}>
      {/* main row */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: "2px solid rgba(255,255,255,0.06)" }}
      >
        {/* user info */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, var(--plum-lt), var(--plum))",
              border: "2.5px solid var(--mint-dk)",
            }}
          >
            {user?.cats[0]?.photo ? (
              <img src={user.cats[0].photo} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <span>🐱</span>
            )}
          </div>
          <div>
            <div className="font-pixel text-[10px] text-[var(--yellow)] leading-tight">
              {catName.toUpperCase()}
            </div>
            <div className="text-[12px] text-[var(--mint)] leading-tight font-medium mt-0.5">
              {user?.displayName || "Guest"}
            </div>
          </div>
        </div>

        {/* sign out button */}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full transition-all hover:bg-white/10"
          style={{
            background: "rgba(255,107,107,0.1)",
            border: "1.5px solid rgba(255,107,107,0.3)",
          }}
        >
          <span className="text-sm">🚪</span>
          <span className="font-pixel text-[7px] text-[var(--coral)]">OUT</span>
        </button>
      </div>

      {/* breadcrumb */}
      <div
        className="px-5 py-2"
        style={{ background: "rgba(255,255,255,0.03)" }}
      >
        <span className="font-pixel text-[9px] text-white/40 tracking-wide">{title}</span>
      </div>
    </div>
  );
}
