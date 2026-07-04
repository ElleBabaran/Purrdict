"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/nav/BottomNav";
import TutorialOverlay from "@/components/TutorialOverlay";
import { useAuth } from "@/lib/AuthContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    // Show tutorial if user hasn't completed it yet
    if (user) {
      const done = localStorage.getItem("purrdict_tutorial_done");
      if (!done) {
        // Small delay so the dashboard renders first
        const timer = setTimeout(() => setShowTutorial(true), 800);
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  // Show nothing while checking auth
  if (isLoading || !user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--cream)" }}
      >
        <div className="font-pixel text-[10px] text-[var(--cocoa-lt)] animate-pulse">
          Loading...
        </div>
      </div>
    );
  }

  const isDemo = user?.id === "demo-user";

  return (
    <div
      className="min-h-screen w-full max-w-2xl mx-auto relative"
      style={{
        background:
          "radial-gradient(ellipse at top, rgba(66,55,88,0.12) 0%, transparent 50%), var(--cream)",
      }}
    >
      {/* Demo mode banner */}
      {isDemo && (
        <div
          className="sticky top-0 z-40 px-4 py-2.5 flex items-center gap-2"
          style={{
            background: "linear-gradient(135deg, #2D2438 0%, #1A1225 100%)",
            borderBottom: "2px solid rgba(255,209,102,0.3)",
          }}
        >
          <span className="text-base">🎮</span>
          <div className="flex-1">
            <span className="font-pixel text-[7px] text-[var(--yellow)]">DEMO MODE</span>
            <span className="text-[10px] text-white/60 ml-2">
              Sensors & camera are simulated — ESP32 leash hardware not connected.
            </span>
          </div>
        </div>
      )}

      <div className="pb-24">{children}</div>
      <BottomNav />

      {/* Tutorial overlay for first-time users */}
      {showTutorial && (
        <TutorialOverlay onComplete={() => setShowTutorial(false)} />
      )}
    </div>
  );
}
