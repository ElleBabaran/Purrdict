"use client";
import { useState, useEffect } from "react";
import TopBar from "@/components/nav/TopBar";
import CatRoom from "@/components/CatRoom";
import { useAuth } from "@/lib/AuthContext";
import { camEvents } from "@/lib/mockData";

type CatActivity = "sleeping" | "eating" | "playing" | "walking" | "sitting";

const ACTIVITIES: { id: CatActivity; label: string; emoji: string; duration: number }[] = [
  { id: "sitting", label: "Just vibing", emoji: "😌", duration: 8000 },
  { id: "walking", label: "Exploring", emoji: "🚶", duration: 6000 },
  { id: "eating", label: "Eating", emoji: "🍽️", duration: 5000 },
  { id: "playing", label: "Playing", emoji: "🎯", duration: 7000 },
  { id: "sleeping", label: "Napping", emoji: "💤", duration: 12000 },
  { id: "walking", label: "Strolling", emoji: "🚶", duration: 5000 },
  { id: "sitting", label: "Watching", emoji: "👀", duration: 6000 },
];

export default function CamPage() {
  const { user } = useAuth();
  const catName = user?.cats[0]?.name || "Your Cat";
  const [activityIndex, setActivityIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState("");
  const [isLive, setIsLive] = useState(true);

  const currentActivity = ACTIVITIES[activityIndex];

  // Cycle through activities
  useEffect(() => {
    if (!isLive) return;
    const timeout = setTimeout(() => {
      setActivityIndex((i) => (i + 1) % ACTIVITIES.length);
    }, currentActivity.duration);
    return () => clearTimeout(timeout);
  }, [activityIndex, isLive, currentActivity.duration]);

  // Clock
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }));
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

  // Determine time of day
  const hour = new Date().getHours();
  const timeOfDay = (hour >= 6 && hour < 18) ? "day" : "night";

  return (
    <>
      <TopBar title="▸ CAT'S WORLD" />
      <div className="px-4 py-5 space-y-4">

        {/* ── Virtual Pet Room ── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            border: "3px solid var(--cocoa)",
            boxShadow: "5px 5px 0 var(--cocoa)",
          }}
        >
          <CatRoom
            activity={currentActivity.id}
            catName={catName}
            timeOfDay={timeOfDay}
          />
        </div>

        {/* ── Activity Status Card ── */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{currentActivity.emoji}</span>
              <div>
                <div className="text-[14px] font-bold text-[var(--cocoa)]">{catName} is {currentActivity.label.toLowerCase()}</div>
                <div className="font-pixel text-[7px] text-[var(--cocoa-lt)] mt-0.5">{currentTime} · ESP32 Collar Active</div>
              </div>
            </div>
            <button
              onClick={() => setIsLive(!isLive)}
              className="px-3 py-1.5 rounded-full font-pixel text-[7px] transition-all"
              style={{
                background: isLive ? "rgba(79,174,148,0.12)" : "rgba(255,107,107,0.12)",
                border: `1.5px solid ${isLive ? "rgba(79,174,148,0.4)" : "rgba(255,107,107,0.4)"}`,
                color: isLive ? "var(--mint-dk)" : "var(--coral)",
              }}
            >
              {isLive ? "● LIVE" : "◯ PAUSED"}
            </button>
          </div>

          {/* Activity bar */}
          <div className="flex gap-1.5">
            {ACTIVITIES.map((a, i) => (
              <div
                key={`${a.id}-${i}`}
                className="flex-1 h-1.5 rounded-full transition-all"
                style={{
                  background: i === activityIndex ? "var(--pink)" : i < activityIndex ? "var(--mint)" : "var(--cream2)",
                }}
              />
            ))}
          </div>
        </div>

        {/* ── Quick Actions ── */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { emoji: "📸", label: "Snap" },
            { emoji: "🎥", label: "Record" },
            { emoji: "🔔", label: "Alert" },
            { emoji: "🍽️", label: "Feed" },
          ].map((action) => (
            <button
              key={action.label}
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all pixel-press"
              style={{
                background: "var(--cream2)",
                border: "2px solid var(--cream2)",
              }}
            >
              <span className="text-xl">{action.emoji}</span>
              <span className="font-pixel text-[6px] text-[var(--cocoa-lt)]">{action.label.toUpperCase()}</span>
            </button>
          ))}
        </div>

        {/* ── Today's Activity Log ── */}
        <div className="glass-card p-4">
          <div className="font-pixel text-[8px] text-[var(--cocoa-lt)] mb-3">TODAY&apos;S MOMENTS</div>
          <div className="space-y-2.5">
            {camEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                style={{ background: "var(--cream)" }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                  style={{ background: "var(--cream2)", border: "1.5px solid var(--cocoa)" }}
                >
                  {event.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-bold text-[var(--cocoa)] truncate">{event.caption}</div>
                  <div className="font-pixel text-[7px] text-[var(--cocoa-lt)] mt-0.5">{event.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Stats Summary ── */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "ACTIVE", value: "2.1h", color: "var(--mint-dk)" },
            { label: "SLEEP", value: "8.4h", color: "var(--lavender)" },
            { label: "MEALS", value: "3x", color: "var(--yellow)" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="text-center py-3 rounded-xl"
              style={{ background: "var(--cream2)" }}
            >
              <div className="text-[16px] font-bold" style={{ color: stat.color }}>{stat.value}</div>
              <div className="font-pixel text-[6px] text-[var(--cocoa-lt)] mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
