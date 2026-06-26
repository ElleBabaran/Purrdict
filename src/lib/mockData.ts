// src/lib/mockData.ts
// Centralized mock data, shaped to match the future real API responses.
// Swap any of these for a real fetch() / Supabase call later without
// changing component code — just keep the same shape.

export type BehaviorKey =
  | "sleeping"
  | "grooming"
  | "walking"
  | "playing"
  | "eating"
  | "drinking"
  | "resting";

export interface CatProfile {
  id: string;
  name: string;
  avatarEmoji: string;
  breed: string;
  ageMonths: number;
}

export interface LiveStatus {
  cat: CatProfile;
  behavior: BehaviorKey;
  behaviorLabel: string;
  activityLevel: number; // 0-100
  activityDeltaPct: number; // vs daily avg, negative = below
  emotion: string;
  emotionEmoji: string;
  topNeed: { label: string; confidence: number; emoji: string };
  healthStatus: "normal" | "watch" | "alert";
  lastSync: string;
  sessionMinutes: number;
  sessionStarted: string;
}

export interface BehaviorEvent {
  id: string;
  time: string;
  title: string;
  desc: string;
  tone: "sage" | "amber" | "coral" | "neutral";
  emoji: string;
}

export interface NeedPrediction {
  key: string;
  emoji: string;
  name: string;
  pct: number;
  level: "high" | "normal" | "low";
  desc: string;
  meta: string;
}

export interface EmotionScore {
  key: string;
  emoji: string;
  label: string;
  pct: number;
}

export interface HealthDay {
  day: string;
  score: number; // 0-100, how "normal" the day was
  status: "normal" | "watch" | "alert";
}

export interface MapPin {
  id: string;
  emoji: string;
  label: string;
  time: string;
  xPct: number;
  yPct: number;
}

export interface CamEvent {
  id: string;
  time: string;
  caption: string;
  emoji: string;
}

// ---- DATA ----

export const activeCat: CatProfile = {
  id: "mochi",
  name: "Mochi",
  avatarEmoji: "🐱",
  breed: "Domestic Shorthair",
  ageMonths: 22,
};

export const allCats: CatProfile[] = [
  activeCat,
  { id: "nori", name: "Nori", avatarEmoji: "🐈", breed: "Tabby Mix", ageMonths: 14 },
];

export const liveStatus: LiveStatus = {
  cat: activeCat,
  behavior: "grooming",
  behaviorLabel: "Grooming",
  activityLevel: 12,
  activityDeltaPct: -18,
  emotion: "Calm",
  emotionEmoji: "😌",
  topNeed: { label: "Hungry", confidence: 74, emoji: "🍽️" },
  healthStatus: "watch",
  lastSync: "23s ago",
  sessionMinutes: 14,
  sessionStarted: "2:41 PM",
};

export const behaviorBreakdown = [
  { key: "sleeping", emoji: "😴", label: "Sleeping", pct: 52, color: "#5B8DEF" },
  { key: "grooming", emoji: "🐾", label: "Grooming", pct: 18, color: "#4FAE94" },
  { key: "walking", emoji: "🚶", label: "Walking", pct: 12, color: "#FFD166" },
  { key: "eating", emoji: "🍽️", label: "Eating", pct: 8, color: "#FF8FA3" },
  { key: "playing", emoji: "🎯", label: "Playing", pct: 6, color: "#A78BFA" },
  { key: "drinking", emoji: "💧", label: "Drinking", pct: 4, color: "#5B8DEF" },
];

export const recentEvents: BehaviorEvent[] = [
  { id: "e1", time: "2:41p", title: "Started grooming", desc: "Post-meal, normal pattern", tone: "sage", emoji: "🐾" },
  { id: "e2", time: "2:28p", title: "Meowing near kitchen", desc: "Hunger signal detected", tone: "amber", emoji: "😿" },
  { id: "e3", time: "2:15p", title: "Finished eating", desc: "Bowl 100% → 40%", tone: "sage", emoji: "🍽️" },
  { id: "e4", time: "1:50p", title: "Woke from nap", desc: "2h 10min sleep session", tone: "neutral", emoji: "😴" },
];

export const activityHourly: number[] = [
  30, 32, 35, 40, 60, 65, 45, 50, 70, 80, 65, 40, 35, 38, 42, 50, 55, 45, 32, 30, 31, 33, 34, 36,
];

export const needPredictions: NeedPrediction[] = [
  {
    key: "hungry",
    emoji: "🍽️",
    name: "Hungry",
    pct: 74,
    level: "high",
    desc: "Meowing near kitchen + bowl empty. Matches her feeding window from the last 14 days.",
    meta: "Last fed 2:15p",
  },
  {
    key: "thirsty",
    emoji: "💧",
    name: "Thirsty",
    pct: 22,
    level: "normal",
    desc: "Water visits within normal range. No unusual hydration pattern.",
    meta: "3 visits today",
  },
  {
    key: "play",
    emoji: "🎯",
    name: "Wants to Play",
    pct: 18,
    level: "low",
    desc: "Currently calm. Expect play-seeking during the evening active window.",
    meta: "Peak 6–8 PM",
  },
  {
    key: "rest",
    emoji: "😴",
    name: "Rest",
    pct: 8,
    level: "normal",
    desc: "Already completed a 2hr nap. Not currently tired.",
    meta: "Last nap 1:50p",
  },
  {
    key: "attention",
    emoji: "🤗",
    name: "Attention",
    pct: 35,
    level: "normal",
    desc: "Mild head-rubbing near common areas — possibly seeking interaction.",
    meta: "2 rubs detected",
  },
  {
    key: "vet",
    emoji: "🏥",
    name: "Vet Check",
    pct: 4,
    level: "normal",
    desc: "All behaviors within normal range. No health flags today.",
    meta: "0 flags",
  },
];

export const emotionScores: EmotionScore[] = [
  { key: "calm", emoji: "😌", label: "Calm", pct: 82 },
  { key: "happy", emoji: "😸", label: "Happy", pct: 70 },
  { key: "curious", emoji: "🎯", label: "Curious", pct: 55 },
  { key: "stressed", emoji: "😰", label: "Stressed", pct: 10 },
  { key: "anxious", emoji: "😿", label: "Anxious", pct: 5 },
  { key: "agitated", emoji: "😾", label: "Agitated", pct: 3 },
];

export const emotionTrend7d: number[] = [70, 65, 75, 80, 70, 85, 82];

export const healthAlert = {
  active: true,
  title: "Slightly reduced grooming — Day 2",
  desc: "Mochi's grooming sessions are 28% shorter than her 14-day baseline. Not critical yet — keep watching. If it continues, a vet check is worth it.",
};

export const healthWeek: HealthDay[] = [
  { day: "Mon", score: 95, status: "normal" },
  { day: "Tue", score: 96, status: "normal" },
  { day: "Wed", score: 94, status: "normal" },
  { day: "Thu", score: 88, status: "normal" },
  { day: "Fri", score: 68, status: "watch" },
  { day: "Sat", score: 60, status: "watch" },
  { day: "Today", score: 62, status: "watch" },
];

export const healthStats = [
  { k: "Overall health score", v: "88 / 100", tone: "good" },
  { k: "Days since last anomaly", v: "14 days", tone: "neutral" },
  { k: "Avg daily activity", v: "38%", tone: "neutral" },
  { k: "Sleep quality trend", v: "Normal ↑", tone: "good" },
  { k: "Grooming regularity", v: "↓ Watch", tone: "warn" },
  { k: "Eating pattern", v: "Normal", tone: "good" },
  { k: "Hydration visits", v: "Normal", tone: "good" },
  { k: "Stress events (7d)", v: "0 detected", tone: "good" },
];

export const mapPins: MapPin[] = [
  { id: "p1", emoji: "😴", label: "Long nap", time: "9:10 AM", xPct: 18, yPct: 22 },
  { id: "p2", emoji: "🍽️", label: "Breakfast", time: "8:05 AM", xPct: 72, yPct: 30 },
  { id: "p3", emoji: "🧶", label: "Toy ambush", time: "11:20 AM", xPct: 45, yPct: 68 },
  { id: "p4", emoji: "☀️", label: "Sunbathing", time: "1:15 PM", xPct: 65, yPct: 75 },
  { id: "p5", emoji: "💧", label: "Water break", time: "2:30 PM", xPct: 78, yPct: 50 },
];

export const camEvents: CamEvent[] = [
  { id: "c1", time: "2:41 PM", caption: "Investigating the snack drawer", emoji: "🐟" },
  { id: "c2", time: "1:58 PM", caption: "Staring suspiciously at the ceiling fan", emoji: "👀" },
  { id: "c3", time: "1:15 PM", caption: "Sunbathing on the windowsill", emoji: "☀️" },
  { id: "c4", time: "11:20 AM", caption: "Ambushed the feather toy", emoji: "🧶" },
];

export const weeklySummary = [
  { k: "Avg daily sleep", v: "13.2 hrs" },
  { k: "Avg daily active", v: "4.1 hrs" },
  { k: "Feeding events", v: "21 (3/day)" },
  { k: "Water visits", v: "18 (2–3/day)" },
  { k: "Play sessions", v: "9 detected" },
  { k: "Mood avg", v: "Calm / Happy" },
];

export const predictionAccuracy = [
  { k: "Hunger predictions", v: "91% accurate", tone: "good" },
  { k: "Play predictions", v: "84% accurate", tone: "good" },
  { k: "Stress detections", v: "100% (0 events)", tone: "good" },
  { k: "Health flags", v: "1 flag (grooming)", tone: "warn" },
  { k: "Total predictions", v: "143", tone: "neutral" },
];
