"use client";
import { useState, useEffect } from "react";
import BottomNav from "@/components/nav/BottomNav";
import TutorialOverlay from "@/components/TutorialOverlay";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    // Show tutorial if user hasn't completed it yet
    const done = localStorage.getItem("purrdict_tutorial_done");
    if (!done) {
      // Small delay so the dashboard renders first
      const timer = setTimeout(() => setShowTutorial(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div
      className="min-h-screen w-full max-w-2xl mx-auto relative"
      style={{
        background:
          "radial-gradient(ellipse at top, rgba(66,55,88,0.12) 0%, transparent 50%), var(--cream)",
      }}
    >
      <div className="pb-24">{children}</div>
      <BottomNav />

      {/* Tutorial overlay for first-time users */}
      {showTutorial && (
        <TutorialOverlay onComplete={() => setShowTutorial(false)} />
      )}
    </div>
  );
}
