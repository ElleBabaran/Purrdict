"use client";
import { useEffect } from "react";

export default function DemoPage() {
  useEffect(() => {
    // Create demo user with a pre-paired cat
    const demoUser = {
      id: "demo-user",
      email: "demo@purrdict.app",
      displayName: "Demo Owner",
      cats: [
        {
          id: "demo-cat",
          name: "Whiskers",
          emoji: "playful",
          breed: "Persian Mix",
          color: "#8A7768",
          ageMonths: 14,
          esp32Pin: "DEMO42",
          esp32Connected: true,
        },
      ],
    };

    localStorage.setItem("purrdict_user", JSON.stringify(demoUser));

    // Full page redirect to guarantee auth loads fresh
    window.location.href = "/dashboard";
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ background: "var(--cream)" }}
    >
      <div className="w-12 h-12 rounded-full border-3 border-[var(--mint-dk)] border-t-transparent animate-spin" />
      <div className="font-pixel text-[10px] text-[var(--cocoa-lt)]">LOADING DEMO...</div>
      <div className="font-pixel text-[7px] text-[var(--cocoa-lt)]">Setting up Mochi&apos;s profile</div>
    </div>
  );
}
